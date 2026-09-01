import mongoose from "mongoose";
import { PhaseModel, IPhase, PhaseStatus } from "./phase.model.js";
import { TaskModel } from "../tasks/task.model.js";
import { ProjectModel } from "../projects/project.model.js";
import { progressService } from "../progress/progress.service.js";
import { logAuditAction } from "../audit/auditLog.model.js";
import { NotFoundError, BadRequestError } from "../../utils/AppError.js";

export interface CreatePhaseInput {
  name: string;
  description?: string;
  sequence?: number;
  plannedStartDate: string | Date;
  plannedEndDate: string | Date;
  dependencies?: string[];
}

export class PhaseService {
  async createPhase(
    projectId: string,
    input: CreatePhaseInput,
    userId: string
  ): Promise<IPhase> {
    const project = await ProjectModel.findById(projectId).exec();
    if (!project) {
      throw new NotFoundError("Project not found.");
    }

    let seq = input.sequence;
    if (!seq) {
      const highest = await PhaseModel.findOne({
        projectId: new mongoose.Types.ObjectId(projectId),
      })
        .sort({ sequence: -1 })
        .select("sequence")
        .exec();
      seq = (highest?.sequence || 0) + 1;
    }

    const phase = await PhaseModel.create({
      projectId: new mongoose.Types.ObjectId(projectId),
      name: input.name.trim(),
      description: input.description || "",
      sequence: seq,
      plannedStartDate: new Date(input.plannedStartDate),
      plannedEndDate: new Date(input.plannedEndDate),
      status: "NOT_STARTED",
      progress: 0,
      dependencies: (input.dependencies || []).map(
        (id) => new mongoose.Types.ObjectId(id)
      ),
    });

    await progressService.recalculateProjectProgress(projectId);

    await logAuditAction({
      actorUserId: userId,
      action: "PHASE_CREATED",
      entityType: "PROJECT",
      entityId: phase._id.toString(),
      projectId,
      metadata: { name: phase.name, sequence: phase.sequence },
    });

    return phase;
  }

  async initializeDefaultPhases(projectId: string, userId: string): Promise<IPhase[]> {
    const project = await ProjectModel.findById(projectId).exec();
    if (!project) {
      throw new NotFoundError("Project not found.");
    }

    const existingPhases = await PhaseModel.find({
      projectId: new mongoose.Types.ObjectId(projectId),
    })
      .sort({ sequence: 1 })
      .exec();

    if (existingPhases.length > 0) {
      return existingPhases;
    }

    const start = new Date(project.plannedStartDate).getTime();
    const end = new Date(project.plannedEndDate).getTime();
    const totalDuration = Math.max(end - start, 30 * 24 * 60 * 60 * 1000); // at least 30 days

    const defaultPhaseBlueprints = [
      {
        name: "Substructure & Deep Foundation",
        description: "Excavation, earthworks, pile capping, and foundation concrete pouring.",
        sequence: 1,
        startFraction: 0,
        endFraction: 0.25,
      },
      {
        name: "Superstructure Concrete Frame",
        description: "Core structural columns, shear walls, and reinforced suspended slabs.",
        sequence: 2,
        startFraction: 0.25,
        endFraction: 0.6,
      },
      {
        name: "Finishing, Facade & MEP Works",
        description: "Masonry, external cladding, MEP services, HVAC, and internal plastering.",
        sequence: 3,
        startFraction: 0.6,
        endFraction: 0.88,
      },
      {
        name: "Testing, Commissioning & Handover",
        description: "Quality assurance inspections, snag-list clearance, and final authority signoffs.",
        sequence: 4,
        startFraction: 0.88,
        endFraction: 1.0,
      },
    ];

    const createdPhases: IPhase[] = [];
    for (let i = 0; i < defaultPhaseBlueprints.length; i++) {
      const bp = defaultPhaseBlueprints[i];
      const pStart = new Date(start + totalDuration * bp.startFraction);
      const pEnd = new Date(start + totalDuration * bp.endFraction);

      const prevPhaseId = i > 0 ? createdPhases[i - 1]._id : undefined;

      const phase = (await PhaseModel.create({
        projectId: new mongoose.Types.ObjectId(projectId),
        name: bp.name,
        description: bp.description,
        sequence: bp.sequence,
        plannedStartDate: pStart,
        plannedEndDate: pEnd,
        status: i === 0 ? "IN_PROGRESS" : "NOT_STARTED",
        progress: 0,
        dependencies: prevPhaseId ? [prevPhaseId] : [],
      })) as IPhase;

      createdPhases.push(phase);
    }

    await progressService.recalculateProjectProgress(projectId);

    await logAuditAction({
      actorUserId: userId,
      action: "PHASES_INITIALIZED",
      entityType: "PROJECT",
      entityId: projectId,
      projectId,
      metadata: { count: createdPhases.length },
    });

    return createdPhases;
  }

  async getPhases(projectId: string): Promise<
    Array<
      IPhase & {
        taskCount: number;
        completedTaskCount: number;
      }
    >
  > {
    const phases = await PhaseModel.find({
      projectId: new mongoose.Types.ObjectId(projectId),
    })
      .populate("dependencies", "name sequence status")
      .sort({ sequence: 1 })
      .exec();

    const phaseIds = phases.map((p) => p._id);
    const tasks = await TaskModel.find({
      phaseId: { $in: phaseIds },
    })
      .select("phaseId status")
      .exec();

    const taskCountMap = new Map<string, { total: number; completed: number }>();
    tasks.forEach((t) => {
      const pId = t.phaseId.toString();
      const curr = taskCountMap.get(pId) || { total: 0, completed: 0 };
      curr.total += 1;
      if (t.status === "COMPLETED") curr.completed += 1;
      taskCountMap.set(pId, curr);
    });

    return phases.map((phase) => {
      const counts = taskCountMap.get(phase._id.toString()) || { total: 0, completed: 0 };
      const obj = phase.toObject();
      return {
        ...obj,
        taskCount: counts.total,
        completedTaskCount: counts.completed,
      };
    }) as unknown as Array<
      IPhase & {
        taskCount: number;
        completedTaskCount: number;
      }
    >;
  }

  async getPhaseById(projectId: string, phaseId: string): Promise<IPhase> {
    const phase = await PhaseModel.findOne({
      _id: new mongoose.Types.ObjectId(phaseId),
      projectId: new mongoose.Types.ObjectId(projectId),
    })
      .populate("dependencies", "name sequence status progress")
      .exec();

    if (!phase) {
      throw new NotFoundError("Phase not found in this project.");
    }
    return phase;
  }

  async updatePhase(
    projectId: string,
    phaseId: string,
    updates: Partial<CreatePhaseInput> & { status?: PhaseStatus },
    userId: string
  ): Promise<IPhase> {
    const phase = await PhaseModel.findOne({
      _id: new mongoose.Types.ObjectId(phaseId),
      projectId: new mongoose.Types.ObjectId(projectId),
    }).exec();

    if (!phase) {
      throw new NotFoundError("Phase not found in this project.");
    }

    if (updates.name) phase.name = updates.name.trim();
    if (updates.description !== undefined) phase.description = updates.description;
    if (updates.sequence !== undefined) phase.sequence = updates.sequence;
    if (updates.plannedStartDate) phase.plannedStartDate = new Date(updates.plannedStartDate);
    if (updates.plannedEndDate) phase.plannedEndDate = new Date(updates.plannedEndDate);
    if (updates.status) {
      phase.status = updates.status;
      if (updates.status === "IN_PROGRESS" && !phase.actualStartDate) {
        phase.actualStartDate = new Date();
      }
      if (updates.status === "COMPLETED") {
        if (!phase.actualEndDate) phase.actualEndDate = new Date();
        phase.progress = 100;
      }
    }
    if (updates.dependencies) {
      phase.dependencies = updates.dependencies.map(
        (id) => new mongoose.Types.ObjectId(id)
      );
    }

    await phase.save();
    await progressService.recalculateProjectProgress(projectId);

    await logAuditAction({
      actorUserId: userId,
      action: "PHASE_UPDATED",
      entityType: "PROJECT",
      entityId: phaseId,
      projectId,
      metadata: updates,
    });

    return phase;
  }

  async deletePhase(projectId: string, phaseId: string, userId: string): Promise<void> {
    const tasksCount = await TaskModel.countDocuments({
      phaseId: new mongoose.Types.ObjectId(phaseId),
    }).exec();

    if (tasksCount > 0) {
      throw new BadRequestError(
        `Cannot delete phase containing ${tasksCount} task(s). Reassign or delete child tasks first.`
      );
    }

    const deleted = await PhaseModel.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(phaseId),
      projectId: new mongoose.Types.ObjectId(projectId),
    }).exec();

    if (!deleted) {
      throw new NotFoundError("Phase not found in this project.");
    }

    await progressService.recalculateProjectProgress(projectId);

    await logAuditAction({
      actorUserId: userId,
      action: "PHASE_DELETED",
      entityType: "PROJECT",
      entityId: phaseId,
      projectId,
      metadata: { name: deleted.name },
    });
  }
}

export const phaseService = new PhaseService();
export default phaseService;
