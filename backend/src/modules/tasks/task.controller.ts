import { Request, Response, NextFunction } from "express";
import taskService from "./task.service.js";
import progressService from "../progress/progress.service.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { TaskStatus, TaskPriority } from "./task.model.js";

export class TaskController {
  async createTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = String(req.params.projectId);
      const userId = req.user!._id.toString();
      const task = await taskService.createTask(projectId, req.body, userId);
      sendSuccess(res, task, undefined, 201, "Task created successfully");
    } catch (error) {
      next(error);
    }
  }

  async getTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = String(req.params.projectId);
      const { phaseId, assigneeId, status, priority, search, page, limit } = req.query;

      const result = await taskService.getTasks(projectId, {
        phaseId: phaseId ? String(phaseId) : undefined,
        assigneeId: assigneeId ? String(assigneeId) : undefined,
        status: status ? (String(status) as TaskStatus) : undefined,
        priority: priority ? (String(priority) as TaskPriority) : undefined,
        search: search ? String(search) : undefined,
        page: page ? parseInt(String(page), 10) : 1,
        limit: limit ? parseInt(String(limit), 10) : 50,
      });

      sendSuccess(res, result.tasks, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (error) {
      next(error);
    }
  }

  async getTaskById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = String(req.params.projectId);
      const taskId = String(req.params.taskId);
      const task = await taskService.getTaskById(projectId, taskId);
      sendSuccess(res, task);
    } catch (error) {
      next(error);
    }
  }

  async updateTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = String(req.params.projectId);
      const taskId = String(req.params.taskId);
      const userId = req.user!._id.toString();
      const task = await taskService.updateTask(projectId, taskId, req.body, userId);
      sendSuccess(res, task, undefined, 200, "Task updated successfully");
    } catch (error) {
      next(error);
    }
  }

  async updateTaskStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = String(req.params.projectId);
      const taskId = String(req.params.taskId);
      const { status, reason } = req.body;
      const userId = req.user!._id.toString();
      const task = await taskService.updateTaskStatus(
        projectId,
        taskId,
        status,
        userId,
        reason
      );
      sendSuccess(res, task, undefined, 200, `Task status updated to ${status}`);
    } catch (error) {
      next(error);
    }
  }

  async logProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = String(req.params.projectId);
      const taskId = String(req.params.taskId);
      const userId = req.user!._id.toString();
      const result = await progressService.logProgress(
        projectId,
        taskId,
        req.body,
        userId
      );
      sendSuccess(
        res,
        result,
        undefined,
        200,
        `Progress logged: ${result.task.progress}% complete`
      );
    } catch (error) {
      next(error);
    }
  }

  async deleteTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = String(req.params.projectId);
      const taskId = String(req.params.taskId);
      const userId = req.user!._id.toString();
      await taskService.deleteTask(projectId, taskId, userId);
      sendSuccess(res, { message: "Task deleted successfully" });
    } catch (error) {
      next(error);
    }
  }
}

export const taskController = new TaskController();
export default taskController;
