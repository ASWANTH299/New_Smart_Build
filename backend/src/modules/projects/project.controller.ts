import { Request, Response, NextFunction } from "express";
import projectService from "./project.service.js";
import healthService from "./health.service.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { ProjectStatus, ProjectHealth } from "./project.model.js";

export class ProjectController {
  async createProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const creatorUserId = req.user!._id.toString();
      const project = await projectService.createProject(req.body, creatorUserId);
      sendSuccess(res, project, undefined, 201, "Project created successfully");
    } catch (error) {
      next(error);
    }
  }

  async getProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const userRole = req.user!.primaryRole;
      const { search, status, health, page, limit } = req.query;

      const result = await projectService.getProjects(userId, userRole, {
        search: search ? String(search) : undefined,
        status: status ? (String(status) as ProjectStatus) : undefined,
        health: health ? (String(health) as ProjectHealth) : undefined,
        page: page ? parseInt(String(page), 10) : 1,
        limit: limit ? parseInt(String(limit), 10) : 20,
      });

      sendSuccess(res, result.projects, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProjectById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = String(req.params.projectId);
      const project = await projectService.getProjectById(projectId);
      sendSuccess(res, project);
    } catch (error) {
      next(error);
    }
  }

  async updateProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = String(req.params.projectId);
      const userId = req.user!._id.toString();
      const project = await projectService.updateProject(projectId, req.body, userId);
      sendSuccess(res, project, undefined, 200, "Project updated successfully");
    } catch (error) {
      next(error);
    }
  }

  async updateProjectStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = String(req.params.projectId);
      const { status, reason } = req.body;
      const userId = req.user!._id.toString();
      const project = await projectService.updateProjectStatus(
        projectId,
        status,
        userId,
        reason
      );
      sendSuccess(
        res,
        project,
        undefined,
        200,
        `Project status updated to ${status}`
      );
    } catch (error) {
      next(error);
    }
  }

  async getProjectOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = String(req.params.projectId);
      const overview = await projectService.getProjectOverview(projectId);
      sendSuccess(res, overview);
    } catch (error) {
      next(error);
    }
  }

  async getProjectTeam(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = String(req.params.projectId);
      const team = await projectService.getProjectTeam(projectId);
      sendSuccess(res, team);
    } catch (error) {
      next(error);
    }
  }

  async getProjectHealth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = String(req.params.projectId);
      const healthData = await healthService.evaluateProjectHealth(projectId);
      sendSuccess(res, healthData);
    } catch (error) {
      next(error);
    }
  }
}

export const projectController = new ProjectController();
export default projectController;
