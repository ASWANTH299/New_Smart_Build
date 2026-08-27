import { Request, Response, NextFunction } from "express";
import { ProjectMembershipModel, IProjectMembership } from "../modules/auth/projectMembership.model.js";
import { ForbiddenError, UnauthorizedError, BadRequestError } from "../utils/AppError.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      projectMembership?: IProjectMembership | null;
      projectId?: string;
    }
  }
}

export const requireProjectAccess = (paramName = "projectId") => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError("Authentication required.");
      }

      const projectId =
        req.params?.[paramName] || req.query?.[paramName] || req.body?.[paramName];

      if (!projectId || typeof projectId !== "string" || projectId.trim().length === 0) {
        throw new BadRequestError(`Missing required project identifier '${paramName}'.`);
      }

      const cleanProjectId = projectId.trim();
      req.projectId = cleanProjectId;

      // Admin has system-wide access to all projects
      if (user.primaryRole === "ADMIN") {
        req.projectMembership = null;
        return next();
      }

      // Check active project membership in database
      const membership = await ProjectMembershipModel.findOne({
        userId: user._id,
        projectId: cleanProjectId,
        assignmentStatus: "ACTIVE",
      }).exec();

      if (!membership) {
        throw new ForbiddenError(
          "Access denied. You do not have active membership or authorization for this project."
        );
      }

      req.projectMembership = membership;
      next();
    } catch (error) {
      next(error);
    }
  };
};

export default requireProjectAccess;
