import { Request, Response, NextFunction } from "express";
import projectTypeService from "./projectType.service.js";
import { sendSuccess } from "../../utils/apiResponse.js";

export class ProjectTypeController {
  async getProjectTypes(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const types = await projectTypeService.getProjectTypes();
      sendSuccess(res, types);
    } catch (error) {
      next(error);
    }
  }

  async createProjectType(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const type = await projectTypeService.createProjectType(req.body);
      sendSuccess(res, type, undefined, 201, "Project type created");
    } catch (error) {
      next(error);
    }
  }
}

export const projectTypeController = new ProjectTypeController();
export default projectTypeController;
