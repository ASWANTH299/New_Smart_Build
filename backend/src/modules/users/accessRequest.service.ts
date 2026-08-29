import mongoose from "mongoose";
import { AccessRequestModel, IAccessRequest, AccessRequestStatus } from "./accessRequest.model.js";
import { UserModel, UserRole } from "./user.model.js";
import { ProjectMembershipModel } from "../auth/projectMembership.model.js";
import { logAuditAction } from "../audit/auditLog.model.js";
import { hashPassword, generateSecureToken } from "../../utils/password.js";
import { ConflictError, NotFoundError, BadRequestError } from "../../utils/AppError.js";

export interface CreateAccessRequestInput {
  name: string;
  email: string;
  requestedRole: UserRole;
  organization?: string;
  reason?: string;
}

export interface ApproveAccessRequestInput {
  assignedRole: UserRole;
  additionalPermissions?: string[];
  projectIds?: string[];
}

export interface AccessRequestListFilter {
  status?: AccessRequestStatus;
  page?: number;
  limit?: number;
}

export class AccessRequestService {
  async createAccessRequest(input: CreateAccessRequestInput): Promise<IAccessRequest> {
    const normalizedEmail = input.email.trim().toLowerCase();

    // 1. Check if an active/existing user account already exists with this email
    const existingUser = await UserModel.findOne({ email: normalizedEmail }).exec();
    if (existingUser) {
      throw new ConflictError("An account with this email address already exists.");
    }

    // 2. Check if a pending access request already exists for this email
    const existingRequest = await AccessRequestModel.findOne({
      email: normalizedEmail,
      status: "PENDING",
    }).exec();

    if (existingRequest) {
      throw new ConflictError("An access request for this email is already pending review.");
    }

    const request = await AccessRequestModel.create({
      name: input.name.trim(),
      email: normalizedEmail,
      requestedRole: input.requestedRole,
      organization: input.organization?.trim() || "",
      reason: input.reason?.trim() || "",
      status: "PENDING",
    });

    return request;
  }

  async getAccessRequests(filter: AccessRequestListFilter): Promise<{
    requests: IAccessRequest[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(1, filter.page || 1);
    const limit = Math.min(100, Math.max(1, filter.limit || 20));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};
    if (filter.status) {
      query.status = filter.status;
    }

    const [requests, total] = await Promise.all([
      AccessRequestModel.find(query)
        .populate("reviewedBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      AccessRequestModel.countDocuments(query).exec(),
    ]);

    return {
      requests,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async approveAccessRequest(
    requestId: string,
    input: ApproveAccessRequestInput,
    adminUserId: string
  ): Promise<{ accessRequest: IAccessRequest; activationToken: string; user: { id: string; email: string } }> {
    const request = await AccessRequestModel.findById(requestId).exec();
    if (!request) {
      throw new NotFoundError("Access request not found.");
    }

    if (request.status !== "PENDING") {
      throw new BadRequestError(`Cannot approve an access request with status ${request.status}.`);
    }

    // Check if user with this email was created in the meantime
    const existingUser = await UserModel.findOne({ email: request.email }).exec();
    if (existingUser) {
      throw new ConflictError("A user with this email already exists.");
    }

    // Generate secure activation token and placeholder hash
    const activationToken = generateSecureToken();
    const tempPassword = generateSecureToken().slice(0, 16) + "A1!";
    const passwordHash = await hashPassword(tempPassword);

    const user = await UserModel.create({
      name: request.name,
      email: request.email,
      passwordHash,
      primaryRole: input.assignedRole,
      additionalPermissions: input.additionalPermissions || [],
      status: "PENDING_ACTIVATION",
      activationToken,
      activationExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    if (input.projectIds && input.projectIds.length > 0) {
      const membershipDocs = input.projectIds.map((projectId) => ({
        userId: user._id,
        projectId,
        assignmentStatus: "ACTIVE",
        assignedAt: new Date(),
        assignedBy: mongoose.Types.ObjectId.isValid(adminUserId)
          ? new mongoose.Types.ObjectId(adminUserId)
          : null,
      }));
      await ProjectMembershipModel.insertMany(membershipDocs);
    }

    request.status = "APPROVED";
    request.assignedRole = input.assignedRole;
    request.reviewedBy = new mongoose.Types.ObjectId(adminUserId);
    request.reviewedAt = new Date();
    request.userId = user._id;
    await request.save();

    await logAuditAction({
      actorUserId: adminUserId,
      action: "ACCESS_REQUEST_APPROVED",
      entityType: "USER",
      entityId: user._id.toString(),
      metadata: {
        accessRequestId: request._id.toString(),
        email: request.email,
        assignedRole: input.assignedRole,
      },
    });

    return {
      accessRequest: request,
      activationToken,
      user: {
        id: user._id.toString(),
        email: user.email,
      },
    };
  }

  async rejectAccessRequest(
    requestId: string,
    reason: string,
    adminUserId: string
  ): Promise<IAccessRequest> {
    const request = await AccessRequestModel.findById(requestId).exec();
    if (!request) {
      throw new NotFoundError("Access request not found.");
    }

    if (request.status !== "PENDING") {
      throw new BadRequestError(`Cannot reject an access request with status ${request.status}.`);
    }

    request.status = "REJECTED";
    request.rejectionReason = reason.trim();
    request.reviewedBy = new mongoose.Types.ObjectId(adminUserId);
    request.reviewedAt = new Date();
    await request.save();

    await logAuditAction({
      actorUserId: adminUserId,
      action: "ACCESS_REQUEST_REJECTED",
      entityType: "USER",
      entityId: request._id.toString(),
      metadata: {
        email: request.email,
        reason,
      },
    });

    return request;
  }
}

export const accessRequestService = new AccessRequestService();
export default accessRequestService;
