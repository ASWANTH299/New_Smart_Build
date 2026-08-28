import { Request, Response, NextFunction } from "express";
import phaseService from "./phase.service.js";
import { sendSuccess } from "../../utils/apiResponse.js";

export class PhaseController {
  async createPhase(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = String(req.params.projectId);
      const userId = req.user!._id.toString();
      const phase = await phaseService.createPhase(projectId, req.body, userId);
      sendSuccess(res, phase, undefined, 201, "Phase created successfully");
    } catch (error) {
      next(error);
    }
  }

  async getPhases(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = String(req.params.projectId);
      const phases = await phaseService.getPhases(projectId);
      sendSuccess(res, phases);
    } catch (error) {
      next(error);
    }
  }

  async getPhaseById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = String(req.params.projectId);
      const phaseId = String(req.params.phaseId);
      const phase = await phaseService.getPhaseById(projectId, phaseId);
      sendSuccess(res, phase);
    } catch (error) {
      next(error);
    }
  }

  async updatePhase(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = String(req.params.projectId);
      const phaseId = String(req.params.phaseId);
      const userId = req.user!._id.toString();
      const phase = await phaseService.updatePhase(projectId, phaseId, req.body, userId);
      sendSuccess(res, phase, undefined, 200, "Phase updated successfully");
    } catch (error) {
      next(error);
    }
  }

  async deletePhase(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = String(req.params.projectId);
      const phaseId = String(req.params.phaseId);
      const userId = req.user!._id.toString();
      await phaseService.deletePhase(projectId, phaseId, userId);
      sendSuccess(res, { message: "Phase deleted successfully" });
    } catch (error) {
      next(error);
    }
  }
}

export const phaseController = new PhaseController();
export default phaseController;
