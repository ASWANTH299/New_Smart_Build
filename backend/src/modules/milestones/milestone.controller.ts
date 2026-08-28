import { Request, Response, NextFunction } from "express";
import milestoneService from "./milestone.service.js";
import { sendSuccess } from "../../utils/apiResponse.js";

export class MilestoneController {
  async createMilestone(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = String(req.params.projectId);
      const userId = req.user!._id.toString();
      const milestone = await milestoneService.createMilestone(
        projectId,
        req.body,
        userId
      );
      sendSuccess(res, milestone, undefined, 201, "Milestone created successfully");
    } catch (error) {
      next(error);
    }
  }

  async getMilestones(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = String(req.params.projectId);
      const isClient = req.user!.primaryRole === "CLIENT";
      const milestones = await milestoneService.getMilestones(projectId, isClient);
      sendSuccess(res, milestones);
    } catch (error) {
      next(error);
    }
  }

  async getMilestoneById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = String(req.params.projectId);
      const milestoneId = String(req.params.milestoneId);
      const isClient = req.user!.primaryRole === "CLIENT";
      const milestone = await milestoneService.getMilestoneById(
        projectId,
        milestoneId,
        isClient
      );
      sendSuccess(res, milestone);
    } catch (error) {
      next(error);
    }
  }

  async updateMilestone(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = String(req.params.projectId);
      const milestoneId = String(req.params.milestoneId);
      const userId = req.user!._id.toString();
      const milestone = await milestoneService.updateMilestone(
        projectId,
        milestoneId,
        req.body,
        userId
      );
      sendSuccess(res, milestone, undefined, 200, "Milestone updated successfully");
    } catch (error) {
      next(error);
    }
  }

  async deleteMilestone(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = String(req.params.projectId);
      const milestoneId = String(req.params.milestoneId);
      const userId = req.user!._id.toString();
      await milestoneService.deleteMilestone(projectId, milestoneId, userId);
      sendSuccess(res, { message: "Milestone deleted successfully" });
    } catch (error) {
      next(error);
    }
  }
}

export const milestoneController = new MilestoneController();
export default milestoneController;
