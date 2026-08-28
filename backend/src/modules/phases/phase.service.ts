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
