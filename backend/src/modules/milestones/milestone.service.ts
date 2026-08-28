import mongoose from "mongoose";
import { MilestoneModel, IMilestone, MilestoneStatus } from "./milestone.model.js";
import { ProjectModel } from "../projects/project.model.js";
import { healthService } from "../projects/health.service.js";
import { logAuditAction } from "../audit/auditLog.model.js";
import { NotFoundError } from "../../utils/AppError.js";

export interface CreateMilestoneInput {
  phaseId?: string;
  name: string;
  description?: string;
  plannedDate: string | Date;
  responsibleUserId?: string;
  relatedTaskIds?: string[];
  clientVisible?: boolean;
}

export class MilestoneService {
  async createMilestone(
    projectId: string,
    input: CreateMilestoneInput,
    userId: string
  ): Promise<IMilestone> {
    const project = await ProjectModel.findById(projectId).exec();
    if (!project) {
      throw new NotFoundError("Project not found.");
    }

    const milestone = await MilestoneModel.create({
      projectId: new mongoose.Types.ObjectId(projectId),
      phaseId: input.phaseId ? new mongoose.Types.ObjectId(input.phaseId) : null,
      name: input.name.trim(),
      description: input.description || "",
      plannedDate: new Date(input.plannedDate),
      status: "PENDING",
      responsibleUserId: input.responsibleUserId
        ? new mongoose.Types.ObjectId(input.responsibleUserId)
        : null,
      relatedTaskIds: (input.relatedTaskIds || []).map(
        (id) => new mongoose.Types.ObjectId(id)
      ),
      clientVisible: input.clientVisible !== undefined ? input.clientVisible : true,
    });

    await logAuditAction({
      actorUserId: userId,
      action: "MILESTONE_CREATED",
      entityType: "PROJECT",
      entityId: milestone._id.toString(),
      projectId,
      metadata: { name: milestone.name, plannedDate: milestone.plannedDate },
    });

    return milestone;
  }

  async getMilestones(
    projectId: string,
    isClient: boolean = false
  ): Promise<IMilestone[]> {
    const query: Record<string, unknown> = {
      projectId: new mongoose.Types.ObjectId(projectId),
    };

    if (isClient) {
      query.clientVisible = true;
    }

    return await MilestoneModel.find(query)
      .populate("phaseId", "name sequence")
      .populate("responsibleUserId", "name email")
      .populate("relatedTaskIds", "title status progress")
      .sort({ plannedDate: 1 })
      .exec();
  }

  async getMilestoneById(
    projectId: string,
    milestoneId: string,
    isClient: boolean = false
  ): Promise<IMilestone> {
    const query: Record<string, unknown> = {
      _id: new mongoose.Types.ObjectId(milestoneId),
      projectId: new mongoose.Types.ObjectId(projectId),
    };

    if (isClient) {
      query.clientVisible = true;
    }

    const milestone = await MilestoneModel.findOne(query)
      .populate("phaseId", "name sequence")
      .populate("responsibleUserId", "name email")
      .populate("relatedTaskIds", "title status progress plannedEndDate")
      .exec();

    if (!milestone) {
      throw new NotFoundError("Milestone not found in this project.");
    }
    return milestone;
  }

  async updateMilestone(
    projectId: string,
    milestoneId: string,
    updates: Partial<CreateMilestoneInput> & {
      status?: MilestoneStatus;
      actualDate?: string | Date | null;
    },
    userId: string
  ): Promise<IMilestone> {
    const milestone = await MilestoneModel.findOne({
      _id: new mongoose.Types.ObjectId(milestoneId),
      projectId: new mongoose.Types.ObjectId(projectId),
    }).exec();

    if (!milestone) {
      throw new NotFoundError("Milestone not found in this project.");
    }

    if (updates.name) milestone.name = updates.name.trim();
    if (updates.description !== undefined) milestone.description = updates.description;
    if (updates.phaseId !== undefined) {
      milestone.phaseId = updates.phaseId
        ? new mongoose.Types.ObjectId(updates.phaseId)
        : null;
    }
    if (updates.plannedDate) milestone.plannedDate = new Date(updates.plannedDate);
    if (updates.actualDate !== undefined) {
      milestone.actualDate = updates.actualDate ? new Date(updates.actualDate) : null;
    }
    if (updates.status) {
      milestone.status = updates.status;
      if (updates.status === "ACHIEVED" && !milestone.actualDate) {
        milestone.actualDate = new Date();
      }
    }
    if (updates.responsibleUserId !== undefined) {
      milestone.responsibleUserId = updates.responsibleUserId
        ? new mongoose.Types.ObjectId(updates.responsibleUserId)
        : null;
    }
    if (updates.relatedTaskIds) {
      milestone.relatedTaskIds = updates.relatedTaskIds.map(
        (id) => new mongoose.Types.ObjectId(id)
      );
    }
    if (updates.clientVisible !== undefined) {
      milestone.clientVisible = updates.clientVisible;
    }

    await milestone.save();

    try {
      await healthService.evaluateProjectHealth(projectId);
    } catch {
      // Health calculation logged
    }

    await logAuditAction({
      actorUserId: userId,
      action: "MILESTONE_UPDATED",
      entityType: "PROJECT",
      entityId: milestoneId,
      projectId,
      metadata: updates,
    });

    return milestone;
  }

  async deleteMilestone(
    projectId: string,
    milestoneId: string,
    userId: string
  ): Promise<void> {
    const deleted = await MilestoneModel.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(milestoneId),
      projectId: new mongoose.Types.ObjectId(projectId),
    }).exec();

    if (!deleted) {
      throw new NotFoundError("Milestone not found in this project.");
    }

    await logAuditAction({
      actorUserId: userId,
      action: "MILESTONE_DELETED",
      entityType: "PROJECT",
      entityId: milestoneId,
      projectId,
      metadata: { name: deleted.name },
    });
  }
}

export const milestoneService = new MilestoneService();
export default milestoneService;
