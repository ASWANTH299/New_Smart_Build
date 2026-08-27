import { Request, Response, NextFunction } from "express";
import projectTemplateService from "./projectTemplate.service.js";
import { sendSuccess } from "../../utils/apiResponse.js";

export class ProjectTemplateController {
  async getTemplates(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const templates = await projectTemplateService.getTemplates();
      sendSuccess(res, templates);
    } catch (error) {
      next(error);
    }
  }

  async getTemplateById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const templateId = String(req.params.templateId);
      const template = await projectTemplateService.getTemplateById(templateId);
      sendSuccess(res, template);
    } catch (error) {
      next(error);
    }
  }

  async createTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const template = await projectTemplateService.createTemplate(req.body);
      sendSuccess(res, template, undefined, 201, "Project template created");
    } catch (error) {
      next(error);
    }
  }
}

export const projectTemplateController = new ProjectTemplateController();
export default projectTemplateController;
