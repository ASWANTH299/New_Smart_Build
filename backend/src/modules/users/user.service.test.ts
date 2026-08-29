import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserService } from "./user.service.js";
import { UserModel, IUser } from "./user.model.js";
import { ProjectMembershipModel, IProjectMembership } from "../auth/projectMembership.model.js";
import { AuditLogModel, IAuditLog } from "../audit/auditLog.model.js";
import { ConflictError } from "../../utils/AppError.js";

describe("UserService Unit Tests (Phase 6)", () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
    vi.restoreAllMocks();
  });

  it("should create user and log audit action when email is unique", async () => {
    vi.spyOn(UserModel, "findOne").mockReturnValue({
      exec: vi.fn().mockResolvedValue(null),
    } as unknown as ReturnType<typeof UserModel.findOne>);

    const mockUserDoc = {
      _id: "507f1f77bcf86cd799439011",
      name: "Aditi Rao",
      email: "aditi@smartbuild.com",
      primaryRole: "SITE_ENGINEER",
      additionalPermissions: [],
      status: "PENDING_ACTIVATION",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.spyOn(UserModel, "create").mockResolvedValue(mockUserDoc as unknown as IUser);
    vi.spyOn(AuditLogModel, "create").mockResolvedValue({} as unknown as IAuditLog);

    const result = await userService.createUser(
      {
        name: "Aditi Rao",
        email: "aditi@smartbuild.com",
        primaryRole: "SITE_ENGINEER",
      },
      "507f1f77bcf86cd799439011"
    );

    expect(result.user.name).toBe("Aditi Rao");
    expect(result.user.email).toBe("aditi@smartbuild.com");
    expect(AuditLogModel.create).toHaveBeenCalled();
  });

  it("should throw ConflictError if user with email already exists", async () => {
    vi.spyOn(UserModel, "findOne").mockReturnValue({
      exec: vi.fn().mockResolvedValue({ _id: "existing-user" }),
    } as unknown as ReturnType<typeof UserModel.findOne>);

    await expect(
      userService.createUser(
        {
          name: "Duplicate User",
          email: "existing@smartbuild.com",
          primaryRole: "SITE_ENGINEER",
        },
        "507f1f77bcf86cd799439011"
      )
    ).rejects.toThrow(ConflictError);
  });

  it("should deactivate user, invalidate session timestamp, and log audit", async () => {
    const mockUser = {
      _id: "507f1f77bcf86cd799439011",
      name: "Aditi Rao",
      email: "aditi@smartbuild.com",
      primaryRole: "SITE_ENGINEER",
      additionalPermissions: [],
      status: "ACTIVE",
      deactivatedAt: null as Date | null,
      passwordChangedAt: null as Date | null,
      save: vi.fn().mockResolvedValue(true),
    };

    vi.spyOn(UserModel, "findById").mockReturnValue({
      exec: vi.fn().mockResolvedValue(mockUser),
    } as unknown as ReturnType<typeof UserModel.findById>);

    vi.spyOn(AuditLogModel, "create").mockResolvedValue({} as unknown as IAuditLog);

    const result = await userService.updateUserStatus(
      "507f1f77bcf86cd799439011",
      "DEACTIVATED",
      "507f1f77bcf86cd799439011",
      "Employee offboarded"
    );

    expect(mockUser.status).toBe("DEACTIVATED");
    expect(mockUser.deactivatedAt).not.toBeNull();
    expect(mockUser.passwordChangedAt).not.toBeNull();
    expect(mockUser.save).toHaveBeenCalled();
    expect(result.status).toBe("DEACTIVATED");
    expect(AuditLogModel.create).toHaveBeenCalled();
  });

  it("should assign project membership and log audit", async () => {
    vi.spyOn(UserModel, "findById").mockReturnValue({
      exec: vi.fn().mockResolvedValue({ _id: "507f1f77bcf86cd799439011" }),
    } as unknown as ReturnType<typeof UserModel.findById>);

    vi.spyOn(ProjectMembershipModel, "findOneAndUpdate").mockResolvedValue({} as unknown as IProjectMembership);
    vi.spyOn(AuditLogModel, "create").mockResolvedValue({} as unknown as IAuditLog);

    await userService.assignProject(
      "507f1f77bcf86cd799439011",
      "507f1f77bcf86cd799439015",
      "507f1f77bcf86cd799439011"
    );

    expect(ProjectMembershipModel.findOneAndUpdate).toHaveBeenCalled();
    expect(AuditLogModel.create).toHaveBeenCalled();
  });

  it("should prevent admin from deleting their own account", async () => {
    await expect(
      userService.deleteUser("admin-123", "admin-123")
    ).rejects.toThrow("Administrators cannot delete their own account.");
  });

  it("should safely delete user by deactivating status and removing project memberships", async () => {
    const mockTargetUser = {
      _id: "507f1f77bcf86cd799439020",
      name: "Contractor User",
      email: "contractor@vendor.com",
      primaryRole: "CONTRACTOR",
      additionalPermissions: [],
      status: "ACTIVE",
      deactivatedAt: null as Date | null,
      passwordChangedAt: null as Date | null,
      save: vi.fn().mockResolvedValue(true),
    };

    vi.spyOn(UserModel, "findById").mockReturnValue({
      exec: vi.fn().mockResolvedValue(mockTargetUser),
    } as unknown as ReturnType<typeof UserModel.findById>);

    vi.spyOn(ProjectMembershipModel, "updateMany").mockResolvedValue({} as unknown as ReturnType<typeof ProjectMembershipModel.updateMany>);
    vi.spyOn(AuditLogModel, "create").mockResolvedValue({} as unknown as IAuditLog);

    const result = await userService.deleteUser(
      "507f1f77bcf86cd799439020",
      "507f1f77bcf86cd799439001"
    );

    expect(mockTargetUser.status).toBe("DEACTIVATED");
    expect(mockTargetUser.deactivatedAt).not.toBeNull();
    expect(mockTargetUser.passwordChangedAt).not.toBeNull();
    expect(mockTargetUser.save).toHaveBeenCalled();
    expect(ProjectMembershipModel.updateMany).toHaveBeenCalledWith(
      { userId: mockTargetUser._id, assignmentStatus: "ACTIVE" },
      expect.objectContaining({ assignmentStatus: "REMOVED" })
    );
    expect(AuditLogModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ action: "USER_DELETED" })
    );
    expect(result.status).toBe("DEACTIVATED");
  });
});
