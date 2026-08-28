import mongoose from "mongoose";
import { ProgressRecordModel, IProgressRecord } from "./progressRecord.model.js";
import { TaskModel, ITask } from "../tasks/task.model.js";
import { PhaseModel } from "../phases/phase.model.js";
import { ProjectModel } from "../projects/project.model.js";
import { healthService } from "../projects/health.service.js";
import { logAuditAction } from "../audit/auditLog.model.js";
import { NotFoundError, BadRequestError } from "../../utils/AppError.js";

export interface LogProgressInput {
  completedQuantity: number;
  date?: string | Date;
  notes?: string;
  source?: "WEB" | "MOBILE";
}

export class ProgressService {
  /**
   * Calculates progress percentage with boundary protection [0, 100] and 2-decimal precision.
   */
  calculateTaskProgress(
    plannedQuantity: number,
    completedQuantity: number,
    status?: string
  ): number {
    if (plannedQuantity <= 0) {
      return status === "COMPLETED" ? 100 : 0;
    }
    if (completedQuantity <= 0) {
      return 0;
    }
    const raw = (completedQuantity / plannedQuantity) * 100;
    return Math.min(100, Math.max(0, Math.round(raw * 100) / 100));
  }

  /**
   * Recalculates phase progress by averaging progress of all child tasks.
   */
  async recalculatePhaseProgress(phaseId: string): Promise<number> {
    const phase = await PhaseModel.findById(phaseId).exec();
    if (!phase) return 0;

    const tasks = await TaskModel.find({
      phaseId: new mongoose.Types.ObjectId(phaseId),
    }).select("progress").exec();

    let newProgress = 0;
    if (tasks.length > 0) {
      const sum = tasks.reduce((acc, t) => acc + (t.progress || 0), 0);
      newProgress = Math.min(100, Math.max(0, Math.round((sum / tasks.length) * 100) / 100));
    }

    phase.progress = newProgress;
    if (newProgress >= 100 && phase.status !== "COMPLETED") {
      phase.status = "COMPLETED";
      phase.actualEndDate = new Date();
    } else if (newProgress > 0 && phase.status === "NOT_STARTED") {
      phase.status = "IN_PROGRESS";
      if (!phase.actualStartDate) phase.actualStartDate = new Date();
    }

    await phase.save();
    return newProgress;
  }

  /**
   * Recalculates project progress by rolling up child phases (or tasks directly) and updates health.
   */
  async recalculateProjectProgress(projectId: string): Promise<number> {
    const project = await ProjectModel.findById(projectId).exec();
    if (!project) return 0;

    const phases = await PhaseModel.find({
      projectId: new mongoose.Types.ObjectId(projectId),
    }).select("progress").exec();

    let newProgress = 0;
    if (phases.length > 0) {
      const sum = phases.reduce((acc, p) => acc + (p.progress || 0), 0);
      newProgress = Math.min(100, Math.max(0, Math.round((sum / phases.length) * 100) / 100));
    } else {
      const tasks = await TaskModel.find({
        projectId: new mongoose.Types.ObjectId(projectId),
      }).select("progress").exec();

      if (tasks.length > 0) {
        const sum = tasks.reduce((acc, t) => acc + (t.progress || 0), 0);
        newProgress = Math.min(100, Math.max(0, Math.round((sum / tasks.length) * 100) / 100));
      }
    }

    project.progress = newProgress;
    await project.save();

    // Trigger automatic health recalculation
    try {
      await healthService.evaluateProjectHealth(projectId);
    } catch {
      // Health calculation logged
    }

    return newProgress;
  }

  /**
   * Records a quantity-based progress entry and triggers hierarchical rollups.
   */
  async logProgress(
    projectId: string,
    taskId: string,
    input: LogProgressInput,
    userId: string
  ): Promise<{ task: ITask; progressRecord: IProgressRecord }> {
    const task = await TaskModel.findOne({
      _id: new mongoose.Types.ObjectId(taskId),
      projectId: new mongoose.Types.ObjectId(projectId),
    }).exec();

    if (!task) {
      throw new NotFoundError("Task not found in this project.");
    }

    if (input.completedQuantity < 0) {
      throw new BadRequestError("Completed quantity cannot be negative.");
    }

    if (input.completedQuantity > task.plannedQuantity) {
      throw new BadRequestError(
        `Completed quantity (${input.completedQuantity} ${task.unit}) cannot exceed planned quantity (${task.plannedQuantity} ${task.unit}).`
      );
    }

    // 1. Create immutable progress record
    const progressRecord = await ProgressRecordModel.create({
      projectId: new mongoose.Types.ObjectId(projectId),
      taskId: task._id,
      phaseId: task.phaseId,
      enteredBy: new mongoose.Types.ObjectId(userId),
      date: input.date ? new Date(input.date) : new Date(),
      completedQuantity: input.completedQuantity,
      unit: task.unit,
      notes: input.notes || "",
      source: input.source || "WEB",
    });

    // 2. Update task progress & status
    task.completedQuantity = input.completedQuantity;
    task.progress = this.calculateTaskProgress(
      task.plannedQuantity,
      task.completedQuantity,
      task.status
    );

    if (task.progress >= 100) {
      task.status = "COMPLETED";
      task.completedAt = new Date();
      if (!task.actualEndDate) task.actualEndDate = new Date();
    } else if (task.progress > 0) {
      if (task.status === "TODO" || task.status === "BLOCKED") {
        task.status = "IN_PROGRESS";
      }
      if (!task.actualStartDate) task.actualStartDate = new Date();
    }

    await task.save();

    // 3. Hierarchical rollups
    await this.recalculatePhaseProgress(task.phaseId.toString());
    await this.recalculateProjectProgress(projectId);

    // 4. Audit Log
    await logAuditAction({
      actorUserId: userId,
      action: "PROGRESS_RECORDED",
      entityType: "TASK",
      entityId: taskId,
      projectId,
      metadata: {
        completedQuantity: input.completedQuantity,
        plannedQuantity: task.plannedQuantity,
        unit: task.unit,
        progress: task.progress,
      },
    });

    return { task, progressRecord };
  }

  /**
   * Retrieves historical progress records for a project or specific task.
   */
  async getProgressHistory(
    projectId: string,
    filter?: { taskId?: string; phaseId?: string; limit?: number }
  ): Promise<IProgressRecord[]> {
    const query: Record<string, unknown> = {
      projectId: new mongoose.Types.ObjectId(projectId),
    };

    if (filter?.taskId) {
      query.taskId = new mongoose.Types.ObjectId(filter.taskId);
    }
    if (filter?.phaseId) {
      query.phaseId = new mongoose.Types.ObjectId(filter.phaseId);
    }

    const limit = Math.min(100, Math.max(1, filter?.limit || 50));

    return await ProgressRecordModel.find(query)
      .populate("enteredBy", "name email primaryRole")
      .populate("taskId", "title unit plannedQuantity")
      .populate("phaseId", "name sequence")
      .sort({ date: -1, createdAt: -1 })
      .limit(limit)
      .exec();
  }
}

export const progressService = new ProgressService();
export default progressService;
