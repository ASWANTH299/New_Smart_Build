import { Request, Response, NextFunction } from "express";
import bomService from "./bom.service.js";
import { sendSuccess } from "../../utils/apiResponse.js";

export class BOMController {
  async getBOMsByProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = String(req.params.projectId);
      const boms = await bomService.getBOMsByProject(projectId);
      sendSuccess(res, boms, undefined, 200, "Project BOMs retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  async getBOMById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bomId = String(req.params.bomId);
      const result = await bomService.getBOMById(bomId);
      sendSuccess(res, result, undefined, 200, "BOM retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  async createBOM(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = String(req.params.projectId);
      const actorId = req.user?._id?.toString() || "";
      const result = await bomService.createBOM(projectId, req.body, actorId);
      sendSuccess(res, result, undefined, 201, "BOM created successfully");
    } catch (error) {
      next(error);
    }
  }

  async addBOMItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bomId = String(req.params.bomId);
      const actorId = req.user?._id?.toString();
      const item = await bomService.addBOMItem(bomId, req.body, actorId);
      sendSuccess(res, item, undefined, 201, "BOM item added successfully");
    } catch (error) {
      next(error);
    }
  }

  async updateBOMItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bomId = String(req.params.bomId);
      const itemId = String(req.params.itemId);
      const actorId = req.user?._id?.toString();
      const item = await bomService.updateBOMItem(bomId, itemId, req.body, actorId);
      sendSuccess(res, item, undefined, 200, "BOM item updated successfully");
    } catch (error) {
      next(error);
    }
  }

  async deleteBOMItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bomId = String(req.params.bomId);
      const itemId = String(req.params.itemId);
      const actorId = req.user?._id?.toString();
      await bomService.deleteBOMItem(bomId, itemId, actorId);
      sendSuccess(res, null, undefined, 200, "BOM item deleted successfully");
    } catch (error) {
      next(error);
    }
  }

  async approveBOM(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bomId = String(req.params.bomId);
      const actorId = req.user?._id?.toString() || "";
      const { notes } = req.body || {};
      const bom = await bomService.approveBOM(bomId, actorId, notes);
      sendSuccess(res, bom, undefined, 200, "BOM approved successfully");
    } catch (error) {
      next(error);
    }
  }
}

export const bomController = new BOMController();
export default bomController;
