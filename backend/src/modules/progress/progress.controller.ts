import { Request, Response, NextFunction } from "express";
import progressService from "./progress.service.js";
import { sendSuccess } from "../../utils/apiResponse.js";

export class ProgressController {
  async getProgressHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = String(req.params.projectId);
      const { taskId, phaseId, limit } = req.query;
      const records = await progressService.getProgressHistory(projectId, {
        taskId: taskId ? String(taskId) : undefined,
        phaseId: phaseId ? String(phaseId) : undefined,
        limit: limit ? parseInt(String(limit), 10) : 50,
      });
      sendSuccess(res, records);
    } catch (error) {
      next(error);
    }
  }
}

export const progressController = new ProgressController();
export default progressController;
