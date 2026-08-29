import mongoose from "mongoose";
import { UserModel, UserRole, UserStatus } from "./user.model.js";
import { ProjectMembershipModel } from "../auth/projectMembership.model.js";
import { LoginHistoryModel } from "../auth/loginHistory.model.js";
import { logAuditAction } from "../audit/auditLog.model.js";
import { hashPassword, generateSecureToken } from "../../utils/password.js";
import {
  ConflictError,
  NotFoundError,
  BadRequestError,
} from "../../utils/AppError.js";
import { sanitizeUser, UserResponse } from "../auth/auth.service.js";

export interface CreateUserInput {
  name: string;
  email: string;
  primaryRole: UserRole;
  password?: string;
  additionalPermissions?: string[];
  projectIds?: string[];
}

export interface UserListFilter {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  page?: number;
  limit?: number;
}

export class UserService {
  async createUser(
    input: CreateUserInput,
    adminUserId: string
  ): Promise<{ user: UserResponse; activationToken?: string }> {
    const normalizedEmail = input.email.trim().toLowerCase();
    const existing = await UserModel.findOne({ email: normalizedEmail }).exec();
    if (existing) {
      throw new ConflictError("User with this email already exists.");
    }

    const rawPassword = input.password || generateSecureToken().slice(0, 12) + "A1!";
    const passwordHash = await hashPassword(rawPassword);
    const activationToken = generateSecureToken();

    const user = await UserModel.create({
      name: input.name.trim(),
      email: normalizedEmail,
      passwordHash,
      primaryRole: input.primaryRole,
      additionalPermissions: input.additionalPermissions || [],
      status: input.password ? "ACTIVE" : "PENDING_ACTIVATION",
      activationToken: input.password ? null : activationToken,
      activationExpires: input.password ? null : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
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

    await logAuditAction({
      actorUserId: adminUserId,
      action: "USER_CREATED",
      entityType: "USER",
      entityId: user._id.toString(),
      metadata: {
        email: user.email,
        primaryRole: user.primaryRole,
        initialProjects: input.projectIds || [],
      },
    });

    return {
      user: sanitizeUser(user),
      activationToken: input.password ? undefined : activationToken,
    };
  }

  async getUsers(filter: UserListFilter): Promise<{
    users: UserResponse[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(1, filter.page || 1);
    const limit = Math.min(100, Math.max(1, filter.limit || 20));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};

    if (filter.search) {
      const searchRegex = new RegExp(filter.search.trim(), "i");
      query.$or = [{ name: searchRegex }, { email: searchRegex }];
    }

    if (filter.role) {
      query.primaryRole = filter.role;
    }

    if (filter.status) {
      query.status = filter.status;
    }

    const [users, total] = await Promise.all([
      UserModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      UserModel.countDocuments(query).exec(),
    ]);

    return {
      users: users.map(sanitizeUser),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getUserById(userId: string): Promise<{
    user: UserResponse;
    projectMemberships: Array<{ projectId: string; assignmentStatus: string; assignedAt: Date }>;
    recentLogins: Array<{ success: boolean; ipAddress: string; timestamp: Date }>;
  }> {
    const user = await UserModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundError("User not found.");
    }

    const [memberships, logins] = await Promise.all([
      ProjectMembershipModel.find({ userId: user._id, assignmentStatus: "ACTIVE" })
        .select("projectId assignmentStatus assignedAt")
        .exec(),
      LoginHistoryModel.find({ userId: user._id })
        .sort({ timestamp: -1 })
        .limit(10)
        .select("success ipAddress timestamp")
        .exec(),
    ]);

    return {
      user: sanitizeUser(user),
      projectMemberships: memberships.map((m) => ({
        projectId: m.projectId,
        assignmentStatus: m.assignmentStatus,
        assignedAt: m.assignedAt,
      })),
      recentLogins: logins.map((l) => ({
        success: l.success,
        ipAddress: l.ipAddress,
        timestamp: l.timestamp,
      })),
    };
  }

  async updateUser(
    userId: string,
    updates: Partial<{ name: string; primaryRole: UserRole }>,
    adminUserId: string
  ): Promise<UserResponse> {
    const user = await UserModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundError("User not found.");
    }

    if (updates.name) user.name = updates.name.trim();
    if (updates.primaryRole) user.primaryRole = updates.primaryRole;

    await user.save();

    await logAuditAction({
      actorUserId: adminUserId,
      action: "USER_UPDATED",
      entityType: "USER",
      entityId: user._id.toString(),
      metadata: updates,
    });

    return sanitizeUser(user);
  }

  async updateUserStatus(
    userId: string,
    status: "ACTIVE" | "DEACTIVATED",
    adminUserId: string,
    reason?: string
  ): Promise<UserResponse> {
    const user = await UserModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundError("User not found.");
    }

    user.status = status;
    if (status === "DEACTIVATED") {
      user.deactivatedAt = new Date();
      // Force token invalidation
      user.passwordChangedAt = new Date();
    } else {
      user.deactivatedAt = null;
      user.accountLockedUntil = null;
      user.failedLoginCount = 0;
    }

    await user.save();

    await logAuditAction({
      actorUserId: adminUserId,
      action: status === "DEACTIVATED" ? "USER_DEACTIVATED" : "USER_ACTIVATED",
      entityType: "USER",
      entityId: user._id.toString(),
      metadata: { reason },
    });

    return sanitizeUser(user);
  }

  async updateUserPermissions(
    userId: string,
    additionalPermissions: string[],
    adminUserId: string
  ): Promise<UserResponse> {
    const user = await UserModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundError("User not found.");
    }

    user.additionalPermissions = additionalPermissions;
    await user.save();

    await logAuditAction({
      actorUserId: adminUserId,
      action: "USER_PERMISSIONS_UPDATED",
      entityType: "USER",
      entityId: user._id.toString(),
      metadata: { additionalPermissions },
    });

    return sanitizeUser(user);
  }

  async assignProject(
    userId: string,
    projectId: string,
    adminUserId: string
  ): Promise<void> {
    const user = await UserModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundError("User not found.");
    }

    await ProjectMembershipModel.findOneAndUpdate(
      { userId: user._id, projectId },
      {
        userId: user._id,
        projectId,
        assignmentStatus: "ACTIVE",
        assignedAt: new Date(),
        removedAt: null,
        assignedBy: mongoose.Types.ObjectId.isValid(adminUserId)
          ? new mongoose.Types.ObjectId(adminUserId)
          : null,
      },
      { upsert: true, new: true }
    );

    await logAuditAction({
      actorUserId: adminUserId,
      action: "PROJECT_MEMBER_ASSIGNED",
      entityType: "PROJECT_MEMBERSHIP",
      entityId: `${user._id.toString()}:${projectId}`,
      projectId,
      metadata: { userId: user._id.toString() },
    });
  }

  async removeProjectAssignment(
    userId: string,
    projectId: string,
    adminUserId: string
  ): Promise<void> {
    const user = await UserModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundError("User not found.");
    }

    await ProjectMembershipModel.findOneAndUpdate(
      { userId: user._id, projectId },
      {
        assignmentStatus: "REMOVED",
        removedAt: new Date(),
      }
    );

    await logAuditAction({
      actorUserId: adminUserId,
      action: "PROJECT_MEMBER_REMOVED",
      entityType: "PROJECT_MEMBERSHIP",
      entityId: `${user._id.toString()}:${projectId}`,
      projectId,
      metadata: { userId: user._id.toString() },
    });
  }

  async deleteUser(userId: string, adminUserId: string): Promise<UserResponse> {
    if (userId === adminUserId) {
      throw new BadRequestError("Administrators cannot delete their own account.");
    }

    const user = await UserModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundError("User not found.");
    }

    // Safe deactivation lifecycle: retain user record for audit logs & referential integrity
    user.status = "DEACTIVATED";
    user.deactivatedAt = new Date();
    user.passwordChangedAt = new Date();
    await user.save();

    // Mark all active project memberships as removed
    await ProjectMembershipModel.updateMany(
      { userId: user._id, assignmentStatus: "ACTIVE" },
      { assignmentStatus: "REMOVED", removedAt: new Date() }
    );

    await logAuditAction({
      actorUserId: adminUserId,
      action: "USER_DELETED",
      entityType: "USER",
      entityId: user._id.toString(),
      metadata: {
        email: user.email,
        name: user.name,
        primaryRole: user.primaryRole,
      },
    });

    return sanitizeUser(user);
  }
}

export const userService = new UserService();
export default userService;
