import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response, NextFunction } from "express";
import { requireRoles, requirePermission, requireAnyPermission } from "./authorize.js";
import { PERMISSIONS } from "../modules/auth/permissions.js";
import { ForbiddenError, UnauthorizedError } from "../utils/AppError.js";
import { IUser } from "../modules/users/user.model.js";

describe("Authorization Middleware Tests (Phase 5)", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {};
    mockRes = {};
    mockNext = vi.fn();
  });

  describe("requireRoles", () => {
    it("should throw UnauthorizedError when user is not authenticated on request", () => {
      const middleware = requireRoles("PROJECT_MANAGER");
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it("should allow ADMIN regardless of specified allowed roles", () => {
      mockReq.user = { primaryRole: "ADMIN" } as IUser;
      const middleware = requireRoles("SITE_ENGINEER");
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should allow user when primary role matches allowed list", () => {
      mockReq.user = { primaryRole: "PROJECT_MANAGER" } as IUser;
      const middleware = requireRoles("PROJECT_MANAGER", "SITE_ENGINEER");
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should throw ForbiddenError when user primary role is not in allowed list", () => {
      mockReq.user = { primaryRole: "STORE_MANAGER" } as IUser;
      const middleware = requireRoles("PROJECT_MANAGER", "SITE_ENGINEER");
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });
  });

  describe("requirePermission", () => {
    it("should allow user who possesses required permission via base role", () => {
      mockReq.user = {
        primaryRole: "SITE_ENGINEER",
        additionalPermissions: [],
      } as unknown as IUser;

      const middleware = requirePermission(PERMISSIONS.DAILY_LOGS_CREATE);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should allow user who possesses permission via additionalPermissions", () => {
      mockReq.user = {
        primaryRole: "SITE_ENGINEER",
        additionalPermissions: [PERMISSIONS.BUDGET_EDIT],
      } as unknown as IUser;

      const middleware = requirePermission(PERMISSIONS.BUDGET_EDIT);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should throw ForbiddenError when user lacks required permission", () => {
      mockReq.user = {
        primaryRole: "SITE_ENGINEER",
        additionalPermissions: [],
      } as unknown as IUser;

      const middleware = requirePermission(PERMISSIONS.BUDGET_APPROVE);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });
  });

  describe("requireAnyPermission", () => {
    it("should allow user when at least one permission matches", () => {
      mockReq.user = {
        primaryRole: "STORE_MANAGER",
        additionalPermissions: [],
      } as unknown as IUser;

      const middleware = requireAnyPermission(
        PERMISSIONS.DAILY_LOGS_CREATE,
        PERMISSIONS.INVENTORY_REQUEST
      );
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should throw ForbiddenError when none of the permissions match", () => {
      mockReq.user = {
        primaryRole: "CONTRACTOR",
        additionalPermissions: [],
      } as unknown as IUser;

      const middleware = requireAnyPermission(
        PERMISSIONS.BUDGET_APPROVE,
        PERMISSIONS.USERS_MANAGE
      );
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });
  });
});
