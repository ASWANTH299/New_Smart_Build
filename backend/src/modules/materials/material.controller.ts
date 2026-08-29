import { Request, Response, NextFunction } from "express";
import materialService from "./material.service.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { MaterialStatus } from "./material.model.js";

export class MaterialController {
  async getMaterials(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search, category, status, page, limit } = req.query;
      const result = await materialService.getMaterials({
        search: search as string,
        category: category as string,
        status: status as MaterialStatus,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });
      sendSuccess(res, result.materials, result.pagination, 200, "Materials retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  async getMaterialById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const material = await materialService.getMaterialById(id);
      sendSuccess(res, material, undefined, 200, "Material retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  async createMaterial(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = req.user?._id?.toString();
      const material = await materialService.createMaterial(req.body, actorId);
      sendSuccess(res, material, undefined, 201, "Material created successfully");
    } catch (error) {
      next(error);
    }
  }

  async updateMaterial(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const actorId = req.user?._id?.toString();
      const material = await materialService.updateMaterial(id, req.body, actorId);
      sendSuccess(res, material, undefined, 200, "Material updated successfully");
    } catch (error) {
      next(error);
    }
  }

  async getCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await materialService.getCategories();
      sendSuccess(res, categories, undefined, 200, "Categories retrieved successfully");
    } catch (error) {
      next(error);
    }
  }
}

export const materialController = new MaterialController();
export default materialController;
