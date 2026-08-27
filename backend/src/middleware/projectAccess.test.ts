import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response, NextFunction } from "express";
import { requireProjectAccess } from "./projectAccess.js";
import { ProjectMembershipModel } from "../modules/auth/projectMembership.model.js";
import { ForbiddenError, UnauthorizedError, BadRequestError } from "../utils/AppError.js";
import { IUser } from "../modules/users/user.model.js";

describe("Project Access Middleware Tests (Phase 5)", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      params: { projectId: "proj-101" },
    };
    mockRes = {};
    mockNext = vi.fn();
    vi.restoreAllMocks();
  });

  it("should throw UnauthorizedError when request is unauthenticated", async () => {
    const middleware = requireProjectAccess("projectId");
    await middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  it("should throw BadRequestError when projectId param is missing", async () => {
    mockReq.user = { _id: "usr-1" as unknown, primaryRole: "SITE_ENGINEER" } as IUser;
    mockReq.params = {};

    const middleware = requireProjectAccess("projectId");
    await middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
  });

  it("should allow ADMIN to access any project without database membership record", async () => {
    mockReq.user = { _id: "usr-admin" as unknown, primaryRole: "ADMIN" } as IUser;

    const middleware = requireProjectAccess("projectId");
    await middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith();
    expect(mockReq.projectId).toBe("proj-101");
  });

  it("should allow assigned user with ACTIVE membership", async () => {
    mockReq.user = { _id: "usr-eng" as unknown, primaryRole: "SITE_ENGINEER" } as IUser;

    const mockMembership = {
      userId: "usr-eng",
      projectId: "proj-101",
      assignmentStatus: "ACTIVE",
    };

    vi.spyOn(ProjectMembershipModel, "findOne").mockReturnValue({
      exec: vi.fn().mockResolvedValue(mockMembership),
    } as unknown as ReturnType<typeof ProjectMembershipModel.findOne>);

    const middleware = requireProjectAccess("projectId");
    await middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith();
    expect(mockReq.projectMembership).toBe(mockMembership);
  });

  it("should throw ForbiddenError when user is not assigned to the requested project", async () => {
    mockReq.user = { _id: "usr-eng" as unknown, primaryRole: "SITE_ENGINEER" } as IUser;

    vi.spyOn(ProjectMembershipModel, "findOne").mockReturnValue({
      exec: vi.fn().mockResolvedValue(null),
    } as unknown as ReturnType<typeof ProjectMembershipModel.findOne>);

    const middleware = requireProjectAccess("projectId");
    await middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
  });
});
