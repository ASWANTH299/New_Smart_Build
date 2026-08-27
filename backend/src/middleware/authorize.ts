import { Request, Response, NextFunction } from "express";
import { UserRole } from "../modules/users/user.model.js";
import { hasUserPermission } from "../modules/auth/permissions.js";
import { ForbiddenError, UnauthorizedError } from "../utils/AppError.js";

export const requireRoles = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = req.user;
    if (!user) {
      return next(new UnauthorizedError("Authentication required."));
    }

    if (user.primaryRole === "ADMIN") {
      return next();
    }

    if (allowedRoles.includes(user.primaryRole)) {
      return next();
    }

    return next(
      new ForbiddenError(
        `Access denied. Role '${user.primaryRole}' is not authorized to access this resource.`
      )
    );
  };
};

export const requirePermission = (...requiredPermissions: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = req.user;
    if (!user) {
      return next(new UnauthorizedError("Authentication required."));
    }

    if (user.primaryRole === "ADMIN") {
      return next();
    }

    const missingPermissions = requiredPermissions.filter(
      (perm) => !hasUserPermission(user, perm)
    );

    if (missingPermissions.length > 0) {
      return next(
        new ForbiddenError(
          `Access denied. Missing required permission(s): ${missingPermissions.join(", ")}`
        )
      );
    }

    return next();
  };
};

export const requireAnyPermission = (...permissions: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = req.user;
    if (!user) {
      return next(new UnauthorizedError("Authentication required."));
    }

    if (user.primaryRole === "ADMIN") {
      return next();
    }

    const hasAny = permissions.some((perm) => hasUserPermission(user, perm));
    if (!hasAny) {
      return next(
        new ForbiddenError("Access denied. Insufficient permissions for this action.")
      );
    }

    return next();
  };
};

export default {
  requireRoles,
  requirePermission,
  requireAnyPermission,
};
