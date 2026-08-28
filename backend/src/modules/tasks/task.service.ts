import mongoose from "mongoose";
import { TaskModel, ITask, TaskPriority, TaskStatus } from "./task.model.js";
import { PhaseModel } from "../phases/phase.model.js";
import { progressService } from "../progress/progress.service.js";
import { logAuditAction } from "../audit/auditLog.model.js";
import { NotFoundError, BadRequestError } from "../../utils/AppError.js";

export interface CreateTaskInput {
  phaseId: string;
  title: string;
  description?: string;
  assigneeId?: string;
  contractorId?: string;
  priority?: TaskPriority;
  plannedStartDate: string | Date;
  plannedEndDate: string | Date;
  plannedQuantity: number;
  unit?: string;
  dependencies?: string[];
}

export interface TaskFilter {
  phaseId?: string;
  assigneeId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  search?: string;
  page?: number;
  limit?: number;
}

export class TaskService {
  /**
   * Validates Finish-to-Start dependencies.
   * If any prerequisite task is not COMPLETED, returns the unfulfilled dependencies.
   */
  async checkUnmetDependencies(task: ITask): Promise<ITask[]> {
    if (!task.dependencies || task.dependencies.length === 0) return [];

    const prerequisiteTasks = await TaskModel.find({
      _id: { $in: task.dependencies },
    }).exec();

    return prerequisiteTasks.filter((dep) => dep.status !== "COMPLETED");
  }

  /**
   * Validates that adding dependencies does not create circular dependency loops.
   */
  async checkCircularDependency(
    taskId: string,
    newDependencyIds: string[]
  ): Promise<boolean> {
    const visited = new Set<string>();
    const queue = [...newDependencyIds];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (currentId === taskId) return true; // Cycle detected!
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const depTask = await TaskModel.findById(currentId).select("dependencies").exec();
      if (depTask && depTask.dependencies) {
        depTask.dependencies.forEach((d) => queue.push(d.toString()));
      }
    }
    return false;
  }

  async createTask(
    projectId: string,
    input: CreateTaskInput,
    userId: string
  ): Promise<ITask> {
    const phase = await PhaseModel.findOne({
      _id: new mongoose.Types.ObjectId(input.phaseId),
      projectId: new mongoose.Types.ObjectId(projectId),
    }).exec();

    if (!phase) {
      throw new NotFoundError("Phase not found in this project.");
    }

    const depIds = (input.dependencies || []).map(
      (id) => new mongoose.Types.ObjectId(id)
    );

    const task = await TaskModel.create({
      projectId: new mongoose.Types.ObjectId(projectId),
      phaseId: phase._id,
      title: input.title.trim(),
      description: input.description || "",
      assigneeId: input.assigneeId ? new mongoose.Types.ObjectId(input.assigneeId) : null,
      contractorId: input.contractorId ? new mongoose.Types.ObjectId(input.contractorId) : null,
      priority: input.priority || "MEDIUM",
      status: "TODO",
      plannedStartDate: new Date(input.plannedStartDate),
      plannedEndDate: new Date(input.plannedEndDate),
      plannedQuantity: input.plannedQuantity,
      unit: input.unit?.trim() || "units",
      completedQuantity: 0,
      progress: 0,
      dependencies: depIds,
      createdBy: new mongoose.Types.ObjectId(userId),
    });

    // Recalculate phase and project progress
    await progressService.recalculatePhaseProgress(phase._id.toString());
    await progressService.recalculateProjectProgress(projectId);

    await logAuditAction({
      actorUserId: userId,
      action: "TASK_CREATED",
      entityType: "TASK",
      entityId: task._id.toString(),
      projectId,
      metadata: { title: task.title, phaseId: input.phaseId },
    });

    return task;
  }

  async getTasks(
    projectId: string,
    filter: TaskFilter
  ): Promise<{
    tasks: ITask[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(1, filter.page || 1);
    const limit = Math.min(100, Math.max(1, filter.limit || 50));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {
      projectId: new mongoose.Types.ObjectId(projectId),
    };

    if (filter.phaseId) {
      query.phaseId = new mongoose.Types.ObjectId(filter.phaseId);
    }
    if (filter.assigneeId) {
      query.assigneeId = new mongoose.Types.ObjectId(filter.assigneeId);
    }
    if (filter.status) {
      query.status = filter.status;
    }
    if (filter.priority) {
      query.priority = filter.priority;
    }
    if (filter.search) {
      query.title = new RegExp(filter.search.trim(), "i");
    }

    const [tasks, total] = await Promise.all([
      TaskModel.find(query)
        .populate("phaseId", "name sequence")
        .populate("assigneeId", "name email primaryRole")
        .populate("contractorId", "name email")
        .populate("dependencies", "title status progress")
        .sort({ plannedEndDate: 1, priority: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      TaskModel.countDocuments(query).exec(),
    ]);

    return {
      tasks,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getTaskById(projectId: string, taskId: string): Promise<ITask> {
    const task = await TaskModel.findOne({
      _id: new mongoose.Types.ObjectId(taskId),
      projectId: new mongoose.Types.ObjectId(projectId),
    })
      .populate("phaseId", "name sequence plannedStartDate plannedEndDate")
      .populate("assigneeId", "name email primaryRole")
      .populate("contractorId", "name email")
      .populate("dependencies", "title status progress plannedEndDate")
      .populate("createdBy", "name email")
      .exec();

    if (!task) {
      throw new NotFoundError("Task not found in this project.");
    }
    return task;
  }

  async updateTask(
    projectId: string,
    taskId: string,
    updates: Partial<CreateTaskInput> & {
      status?: TaskStatus;
      actualStartDate?: string | Date | null;
      actualEndDate?: string | Date | null;
    },
    userId: string
  ): Promise<ITask> {
    const task = await TaskModel.findOne({
      _id: new mongoose.Types.ObjectId(taskId),
      projectId: new mongoose.Types.ObjectId(projectId),
    }).exec();

    if (!task) {
      throw new NotFoundError("Task not found in this project.");
    }

    if (updates.dependencies) {
      const hasCycle = await this.checkCircularDependency(taskId, updates.dependencies);
      if (hasCycle) {
        throw new BadRequestError("Cannot add circular dependency loop between tasks.");
      }
      task.dependencies = updates.dependencies.map(
        (id) => new mongoose.Types.ObjectId(id)
      );
    }

    if (updates.title) task.title = updates.title.trim();
    if (updates.description !== undefined) task.description = updates.description;
    if (updates.assigneeId !== undefined) {
      task.assigneeId = updates.assigneeId
        ? new mongoose.Types.ObjectId(updates.assigneeId)
        : null;
    }
    if (updates.contractorId !== undefined) {
      task.contractorId = updates.contractorId
        ? new mongoose.Types.ObjectId(updates.contractorId)
        : null;
    }
    if (updates.priority) task.priority = updates.priority;
    if (updates.plannedStartDate) task.plannedStartDate = new Date(updates.plannedStartDate);
    if (updates.plannedEndDate) task.plannedEndDate = new Date(updates.plannedEndDate);
    if (updates.plannedQuantity !== undefined) {
      task.plannedQuantity = updates.plannedQuantity;
      task.progress = progressService.calculateTaskProgress(
        task.plannedQuantity,
        task.completedQuantity,
        task.status
      );
    }
    if (updates.unit) task.unit = updates.unit.trim();

    if (updates.status) {
      if (updates.status === "IN_PROGRESS") {
        const unmet = await this.checkUnmetDependencies(task);
        if (unmet.length > 0) {
          throw new BadRequestError(
            `Cannot start task: Prerequisite task '${unmet[0].title}' is not completed yet.`
          );
        }
        if (!task.actualStartDate) task.actualStartDate = new Date();
      }
      if (updates.status === "COMPLETED") {
        task.progress = 100;
        task.completedQuantity = task.plannedQuantity;
        task.completedAt = new Date();
        if (!task.actualEndDate) task.actualEndDate = new Date();
      }
      task.status = updates.status;
    }

    await task.save();

    await progressService.recalculatePhaseProgress(task.phaseId.toString());
    await progressService.recalculateProjectProgress(projectId);

    await logAuditAction({
      actorUserId: userId,
      action: "TASK_UPDATED",
      entityType: "TASK",
      entityId: taskId,
      projectId,
      metadata: updates,
    });

    return task;
  }

  async updateTaskStatus(
    projectId: string,
    taskId: string,
    newStatus: TaskStatus,
    userId: string,
    reason?: string
  ): Promise<ITask> {
    const task = await this.updateTask(
      projectId,
      taskId,
      { status: newStatus },
      userId
    );

    if (reason) {
      await logAuditAction({
        actorUserId: userId,
        action: "TASK_UPDATED",
        entityType: "TASK",
        entityId: taskId,
        projectId,
        metadata: { statusTransition: newStatus, reason },
      });
    }

    return task;
  }

  async deleteTask(projectId: string, taskId: string, userId: string): Promise<void> {
    const deleted = await TaskModel.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(taskId),
      projectId: new mongoose.Types.ObjectId(projectId),
    }).exec();

    if (!deleted) {
      throw new NotFoundError("Task not found in this project.");
    }

    await progressService.recalculatePhaseProgress(deleted.phaseId.toString());
    await progressService.recalculateProjectProgress(projectId);

    await logAuditAction({
      actorUserId: userId,
      action: "TASK_DELETED",
      entityType: "TASK",
      entityId: taskId,
      projectId,
      metadata: { title: deleted.title },
    });
  }
}

export const taskService = new TaskService();
export default taskService;
