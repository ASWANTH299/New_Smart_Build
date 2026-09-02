import { Request, Response, NextFunction } from "express";
import { workforceService } from "./workforce.service.js";
import { AuthenticatedRequest } from "../../middleware/authenticate.js";

export class WorkforceController {
  async createWorker(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const worker = await workforceService.createWorker(req.body);
      res.status(201).json({
        success: true,
        message: "Worker record created successfully",
        data: worker,
      });
    } catch (error) {
      next(error);
    }
  }

  async getWorkers(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, trade, workerType, contractorId, status, page, limit } = req.query;
      const result = await workforceService.getWorkers({
        search: search as string,
        trade: trade as any,
        workerType: workerType as any,
        contractorId: contractorId as string,
        status: status as any,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });

      res.status(200).json({
        success: true,
        data: result.workers,
        meta: {
          total: result.total,
          page: result.page,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getWorkerById(req: Request, res: Response, next: NextFunction) {
    try {
      const { workerId } = req.params;
      const result = await workforceService.getWorkerById(workerId);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateWorker(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { workerId } = req.params;
      const worker = await workforceService.updateWorker(workerId, req.body);
      res.status(200).json({
        success: true,
        message: "Worker record updated successfully",
        data: worker,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteWorker(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { workerId } = req.params;
      await workforceService.deleteWorker(workerId);
      res.status(200).json({
        success: true,
        message: "Worker record deleted or deactivated successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async assignWorker(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      const assignment = await workforceService.assignWorker(
        projectId,
        req.body,
        req.user!.id
      );
      res.status(201).json({
        success: true,
        message: "Worker assigned to project successfully",
        data: assignment,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProjectWorkforce(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      const { status, trade, phaseId, taskId } = req.query;
      const assignments = await workforceService.getProjectWorkforce(projectId, {
        status: status as any,
        trade: trade as any,
        phaseId: phaseId as string,
        taskId: taskId as string,
      });

      res.status(200).json({
        success: true,
        data: assignments,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateAssignment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { projectId, assignmentId } = req.params;
      const assignment = await workforceService.updateAssignment(
        projectId,
        assignmentId,
        req.body
      );
      res.status(200).json({
        success: true,
        message: "Workforce assignment updated successfully",
        data: assignment,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteAssignment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { projectId, assignmentId } = req.params;
      await workforceService.deleteAssignment(projectId, assignmentId);
      res.status(200).json({
        success: true,
        message: "Workforce assignment cancelled successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

export const workforceController = new WorkforceController();
export default workforceController;
