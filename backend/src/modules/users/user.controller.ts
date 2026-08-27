import { Request, Response, NextFunction } from "express";
import userService from "./user.service.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { UserRole, UserStatus } from "./user.model.js";

export class UserController {
  async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminUserId = req.user!._id.toString();
      const result = await userService.createUser(req.body, adminUserId);
      sendSuccess(res, result, undefined, 201, "User created successfully");
    } catch (error) {
      next(error);
    }
  }

  async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search, role, status, page, limit } = req.query;
      const result = await userService.getUsers({
        search: search ? String(search) : undefined,
        role: role ? (String(role) as UserRole) : undefined,
        status: status ? (String(status) as UserStatus) : undefined,
        page: page ? parseInt(String(page), 10) : 1,
        limit: limit ? parseInt(String(limit), 10) : 20,
      });

      sendSuccess(res, result.users, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = String(req.params.userId);
      const result = await userService.getUserById(userId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = String(req.params.userId);
      const adminUserId = req.user!._id.toString();
      const result = await userService.updateUser(userId, req.body, adminUserId);
      sendSuccess(res, result, undefined, 200, "User updated successfully");
    } catch (error) {
      next(error);
    }
  }

  async updateUserStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = String(req.params.userId);
      const { status, reason } = req.body;
      const adminUserId = req.user!._id.toString();
      const result = await userService.updateUserStatus(userId, status, adminUserId, reason);
      sendSuccess(res, result, undefined, 200, `User ${status.toLowerCase()} successfully`);
    } catch (error) {
      next(error);
    }
  }

  async updateUserPermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = String(req.params.userId);
      const { additionalPermissions } = req.body;
      const adminUserId = req.user!._id.toString();
      const result = await userService.updateUserPermissions(
        userId,
        additionalPermissions,
        adminUserId
      );
      sendSuccess(res, result, undefined, 200, "User permissions updated successfully");
    } catch (error) {
      next(error);
    }
  }

  async assignProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = String(req.params.userId);
      const { projectId } = req.body;
      const adminUserId = req.user!._id.toString();
      await userService.assignProject(userId, projectId, adminUserId);
      sendSuccess(res, { message: "Project assigned successfully" });
    } catch (error) {
      next(error);
    }
  }

  async removeProjectAssignment(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = String(req.params.userId);
      const projectId = String(req.params.projectId);
      const adminUserId = req.user!._id.toString();
      await userService.removeProjectAssignment(userId, projectId, adminUserId);
      sendSuccess(res, { message: "Project assignment removed successfully" });
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
export default userController;
