import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import { AccessRequestService } from "./accessRequest.service.js";
import { AccessRequestModel, IAccessRequest } from "./accessRequest.model.js";
import { UserModel, IUser } from "./user.model.js";
import { AuditLogModel } from "../audit/auditLog.model.js";
import { ConflictError, NotFoundError, BadRequestError } from "../../utils/AppError.js";

describe("AccessRequestService Unit Tests", () => {
  let service: AccessRequestService;

  beforeEach(() => {
    service = new AccessRequestService();
    vi.restoreAllMocks();
  });

  it("should create a pending access request for valid input", async () => {
    vi.spyOn(UserModel, "findOne").mockReturnValue({
      exec: vi.fn().mockResolvedValue(null),
    } as unknown as ReturnType<typeof UserModel.findOne>);

    vi.spyOn(AccessRequestModel, "findOne").mockReturnValue({
      exec: vi.fn().mockResolvedValue(null),
    } as unknown as ReturnType<typeof AccessRequestModel.findOne>);

    const mockCreated = {
      _id: new mongoose.Types.ObjectId(),
      name: "John Builder",
      email: "john@builder.com",
      requestedRole: "SITE_ENGINEER",
      organization: "Acme Corp",
      reason: "Need site logging access",
      status: "PENDING",
    };

    vi.spyOn(AccessRequestModel, "create").mockResolvedValue(
      mockCreated as unknown as IAccessRequest
    );

    const result = await service.createAccessRequest({
      name: "John Builder",
      email: "john@builder.com",
      requestedRole: "SITE_ENGINEER",
      organization: "Acme Corp",
      reason: "Need site logging access",
    });

    expect(result.email).toBe("john@builder.com");
    expect(result.status).toBe("PENDING");
    expect(result.requestedRole).toBe("SITE_ENGINEER");
  });

  it("should reject request if user with email already exists", async () => {
    vi.spyOn(UserModel, "findOne").mockReturnValue({
      exec: vi.fn().mockResolvedValue({ _id: "u-1", email: "existing@builder.com" }),
    } as unknown as ReturnType<typeof UserModel.findOne>);

    await expect(
      service.createAccessRequest({
        name: "Existing User",
        email: "existing@builder.com",
        requestedRole: "PROJECT_MANAGER",
      })
    ).rejects.toThrow(ConflictError);
  });

  it("should reject request if another pending request already exists for email", async () => {
    vi.spyOn(UserModel, "findOne").mockReturnValue({
      exec: vi.fn().mockResolvedValue(null),
    } as unknown as ReturnType<typeof UserModel.findOne>);

    vi.spyOn(AccessRequestModel, "findOne").mockReturnValue({
      exec: vi.fn().mockResolvedValue({ _id: "req-1", status: "PENDING" }),
    } as unknown as ReturnType<typeof AccessRequestModel.findOne>);

    await expect(
      service.createAccessRequest({
        name: "Pending User",
        email: "pending@builder.com",
        requestedRole: "PROJECT_MANAGER",
      })
    ).rejects.toThrow(ConflictError);
  });

  it("should approve pending request, create user with PENDING_ACTIVATION, and generate activation token", async () => {
    const mockRequest = {
      _id: new mongoose.Types.ObjectId(),
      name: "Alice PM",
      email: "alice@pm.com",
      status: "PENDING",
      save: vi.fn().mockResolvedValue(true),
    };

    vi.spyOn(AccessRequestModel, "findById").mockReturnValue({
      exec: vi.fn().mockResolvedValue(mockRequest),
    } as unknown as ReturnType<typeof AccessRequestModel.findById>);

    vi.spyOn(UserModel, "findOne").mockReturnValue({
      exec: vi.fn().mockResolvedValue(null),
    } as unknown as ReturnType<typeof UserModel.findOne>);

    const mockUser = {
      _id: new mongoose.Types.ObjectId(),
      email: "alice@pm.com",
      primaryRole: "PROJECT_MANAGER",
      status: "PENDING_ACTIVATION",
    };

    vi.spyOn(UserModel, "create").mockResolvedValue(mockUser as unknown as IUser);
    vi.spyOn(AuditLogModel, "create").mockResolvedValue({} as unknown as ReturnType<typeof AuditLogModel.create>);

    const adminId = "507f1f77bcf86cd799439001";
    const result = await service.approveAccessRequest(
      mockRequest._id.toString(),
      { assignedRole: "PROJECT_MANAGER" },
      adminId
    );

    expect(result.accessRequest.status).toBe("APPROVED");
    expect(result.accessRequest.assignedRole).toBe("PROJECT_MANAGER");
    expect(result).toHaveProperty("activationToken");
    expect(typeof result.activationToken).toBe("string");
    expect(mockRequest.save).toHaveBeenCalled();
  });

  it("should reject pending request with reason and record in audit log", async () => {
    const mockRequest = {
      _id: new mongoose.Types.ObjectId(),
      name: "Spam Request",
      email: "spam@example.com",
      status: "PENDING",
      save: vi.fn().mockResolvedValue(true),
    };

    vi.spyOn(AccessRequestModel, "findById").mockReturnValue({
      exec: vi.fn().mockResolvedValue(mockRequest),
    } as unknown as ReturnType<typeof AccessRequestModel.findById>);

    vi.spyOn(AuditLogModel, "create").mockResolvedValue({} as unknown as ReturnType<typeof AuditLogModel.create>);

    const adminId = "507f1f77bcf86cd799439001";
    const result = await service.rejectAccessRequest(
      mockRequest._id.toString(),
      "Unverified external contractor",
      adminId
    );

    expect(result.status).toBe("REJECTED");
    expect(result.rejectionReason).toBe("Unverified external contractor");
    expect(mockRequest.save).toHaveBeenCalled();
  });

  it("should throw NotFoundError if access request is not found", async () => {
    vi.spyOn(AccessRequestModel, "findById").mockReturnValue({
      exec: vi.fn().mockResolvedValue(null),
    } as unknown as ReturnType<typeof AccessRequestModel.findById>);

    await expect(
      service.approveAccessRequest(
        "507f1f77bcf86cd799439099",
        { assignedRole: "PROJECT_MANAGER" },
        "507f1f77bcf86cd799439001"
      )
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw BadRequestError if request has already been approved or rejected", async () => {
    const mockRequest = {
      _id: new mongoose.Types.ObjectId(),
      status: "APPROVED",
    };

    vi.spyOn(AccessRequestModel, "findById").mockReturnValue({
      exec: vi.fn().mockResolvedValue(mockRequest),
    } as unknown as ReturnType<typeof AccessRequestModel.findById>);

    await expect(
      service.approveAccessRequest(
        mockRequest._id.toString(),
        { assignedRole: "PROJECT_MANAGER" },
        "507f1f77bcf86cd799439001"
      )
    ).rejects.toThrow(BadRequestError);
  });
});
