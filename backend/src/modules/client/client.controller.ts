import { Request, Response, NextFunction } from "express";
import clientService from "./client.service.js";
import { sendSuccess } from "../../utils/apiResponse.js";

export class ClientController {
  async getClientProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const clientId = req.user!._id.toString();
      const userRole = req.user!.primaryRole;
      const projects = await clientService.getClientProjects(clientId, userRole);
      sendSuccess(res, projects, undefined, 200, "Client projects retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  async getClientProjectDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = String(req.params.projectId);
      const clientId = req.user!._id.toString();
      const userRole = req.user!.primaryRole;
      const details = await clientService.getClientProjectDetails(projectId, clientId, userRole);
      sendSuccess(res, details, undefined, 200, "Client project details retrieved successfully");
    } catch (error) {
      next(error);
    }
  }
}

export const clientController = new ClientController();
export default clientController;
