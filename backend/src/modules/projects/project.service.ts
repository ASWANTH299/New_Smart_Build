import mongoose from "mongoose";
import { ProjectModel, IProject, ProjectStatus, ProjectHealth } from "./project.model.js";
import { ProjectMembershipModel } from "../auth/projectMembership.model.js";
import { UserModel } from "../users/user.model.js";
import { logAuditAction } from "../audit/auditLog.model.js";
import {
  ConflictError,
  NotFoundError,
  BadRequestError,
} from "../../utils/AppError.js";

const VALID_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  DRAFT: ["PLANNING", "ARCHIVED"],
  PLANNING: ["ACTIVE", "DRAFT", "ARCHIVED"],
  ACTIVE: ["ON_HOLD", "COMPLETED", "ARCHIVED"],
  ON_HOLD: ["ACTIVE", "ARCHIVED"],
  COMPLETED: ["ARCHIVED"],
  ARCHIVED: [],
};

export interface CreateProjectInput {
  code: string;
  name: string;
  typeId?: string;
  templateId?: string;
  clientUserId?: string;
  location: string;
  description?: string;
  plannedStartDate: string | Date;
  plannedEndDate: string | Date;
  projectManagerId: string;
  teamUserIds?: string[];
}

export interface ProjectListFilter {
  search?: string;
  status?: ProjectStatus;
  health?: ProjectHealth;
  page?: number;
  limit?: number;
}

export class ProjectService {
  async createProject(input: CreateProjectInput, creatorUserId: string): Promise<IProject> {
    const cleanCode = input.code.toUpperCase().trim();
    const existing = await ProjectModel.findOne({ code: cleanCode }).exec();
    if (existing) {
      throw new ConflictError(`Project with code '${cleanCode}' already exists.`);
    }

    const project = await ProjectModel.create({
      code: cleanCode,
      name: input.name.trim(),
      typeId: input.typeId ? new mongoose.Types.ObjectId(input.typeId) : null,
      clientUserId: input.clientUserId ? new mongoose.Types.ObjectId(input.clientUserId) : null,
      location: input.location.trim(),
      description: input.description || "",
      plannedStartDate: new Date(input.plannedStartDate),
      plannedEndDate: new Date(input.plannedEndDate),
      projectManagerId: new mongoose.Types.ObjectId(input.projectManagerId),
      status: "PLANNING",
      health: "HEALTHY",
      progress: 0,
      createdBy: new mongoose.Types.ObjectId(creatorUserId),
    });

    const projectIdStr = project._id.toString();

    // Assign PM, Creator, Client, and Team
    const userIdsToAssign = new Set<string>();
    userIdsToAssign.add(input.projectManagerId);
    userIdsToAssign.add(creatorUserId);
    if (input.clientUserId) userIdsToAssign.add(input.clientUserId);
    if (input.teamUserIds) {
      input.teamUserIds.forEach((id) => userIdsToAssign.add(id));
    }

    const memberships = Array.from(userIdsToAssign).map((userId) => ({
      userId: new mongoose.Types.ObjectId(userId),
      projectId: projectIdStr,
      assignmentStatus: "ACTIVE" as const,
      assignedAt: new Date(),
      assignedBy: new mongoose.Types.ObjectId(creatorUserId),
    }));

    await ProjectMembershipModel.insertMany(memberships);

    await logAuditAction({
      actorUserId: creatorUserId,
      action: "PROJECT_CREATED",
      entityType: "PROJECT",
      entityId: projectIdStr,
      projectId: projectIdStr,
      metadata: { code: project.code, name: project.name },
    });

    return project;
  }

  async getProjects(
    userId: string,
    userRole: string,
    filter: ProjectListFilter
  ): Promise<{
    projects: IProject[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(1, filter.page || 1);
    const limit = Math.min(100, Math.max(1, filter.limit || 20));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};

    if (userRole !== "ADMIN") {
      const memberships = await ProjectMembershipModel.find({
        userId: new mongoose.Types.ObjectId(userId),
        assignmentStatus: "ACTIVE",
      }).select("projectId").exec();

      const projectIds = memberships.map((m) => {
        try {
          return new mongoose.Types.ObjectId(m.projectId);
        } catch {
          return null;
        }
      }).filter(Boolean);

      query._id = { $in: projectIds };
    }

    if (filter.search) {
      const searchRegex = new RegExp(filter.search.trim(), "i");
      query.$or = [{ name: searchRegex }, { code: searchRegex }, { location: searchRegex }];
    }

    if (filter.status) {
      query.status = filter.status;
    }

    if (filter.health) {
      query.health = filter.health;
    }

    const [projects, total] = await Promise.all([
      ProjectModel.find(query)
        .populate("projectManagerId", "name email")
        .populate("typeId", "name code")
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      ProjectModel.countDocuments(query).exec(),
    ]);

    return {
      projects,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getProjectById(projectId: string): Promise<IProject> {
    const project = await ProjectModel.findById(projectId)
      .populate("projectManagerId", "name email primaryRole")
      .populate("clientUserId", "name email")
      .populate("typeId", "name code description")
      .exec();

    if (!project) {
      throw new NotFoundError("Project not found.");
    }
    return project;
  }

  async updateProject(
    projectId: string,
    updates: Partial<CreateProjectInput> & { health?: ProjectHealth; progress?: number },
    userId: string
  ): Promise<IProject> {
    const project = await ProjectModel.findById(projectId).exec();
    if (!project) {
      throw new NotFoundError("Project not found.");
    }

    if (updates.name) project.name = updates.name.trim();
    if (updates.location) project.location = updates.location.trim();
    if (updates.description !== undefined) project.description = updates.description;
    if (updates.plannedStartDate) project.plannedStartDate = new Date(updates.plannedStartDate);
    if (updates.plannedEndDate) project.plannedEndDate = new Date(updates.plannedEndDate);
    if (updates.health) project.health = updates.health;
    if (updates.progress !== undefined) project.progress = updates.progress;
    if (updates.projectManagerId) {
      project.projectManagerId = new mongoose.Types.ObjectId(updates.projectManagerId);
    }

    await project.save();

    await logAuditAction({
      actorUserId: userId,
      action: "PROJECT_UPDATED",
      entityType: "PROJECT",
      entityId: projectId,
      projectId,
      metadata: updates,
    });

    return project;
  }

  async updateProjectStatus(
    projectId: string,
    newStatus: ProjectStatus,
    userId: string,
    reason?: string
  ): Promise<IProject> {
    const project = await ProjectModel.findById(projectId).exec();
    if (!project) {
      throw new NotFoundError("Project not found.");
    }

    const currentStatus = project.status;
    const allowed = VALID_TRANSITIONS[currentStatus] || [];

    if (!allowed.includes(newStatus)) {
      throw new BadRequestError(
        `Invalid status transition from '${currentStatus}' to '${newStatus}'. Allowed: ${allowed.join(", ") || "none"}`
      );
    }

    project.status = newStatus;
    if (newStatus === "ACTIVE" && !project.actualStartDate) {
      project.actualStartDate = new Date();
    }
    if (newStatus === "COMPLETED" && !project.actualEndDate) {
      project.actualEndDate = new Date();
    }
    if (newStatus === "ARCHIVED") {
      project.archivedAt = new Date();
    }

    await project.save();

    await logAuditAction({
      actorUserId: userId,
      action: "PROJECT_STATUS_CHANGED",
      entityType: "PROJECT",
      entityId: projectId,
      projectId,
      metadata: { from: currentStatus, to: newStatus, reason },
    });

    return project;
  }

  async getProjectOverview(projectId: string): Promise<{
    project: IProject;
    teamCount: number;
    daysRemaining: number;
  }> {
    const project = await this.getProjectById(projectId);
    const teamCount = await ProjectMembershipModel.countDocuments({
      projectId,
      assignmentStatus: "ACTIVE",
    }).exec();

    const now = new Date().getTime();
    const end = new Date(project.plannedEndDate).getTime();
    const daysRemaining = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));

    return {
      project,
      teamCount,
      daysRemaining,
    };
  }

  async getProjectTeam(projectId: string): Promise<
    Array<{
      membershipId: string;
      user: { id: string; name: string; email: string; primaryRole: string };
      assignedAt: Date;
    }>
  > {
    const memberships = await ProjectMembershipModel.find({
      projectId,
      assignmentStatus: "ACTIVE",
    }).exec();

    const userIds = memberships.map((m) => m.userId);
    const users = await UserModel.find({ _id: { $in: userIds } })
      .select("name email primaryRole")
      .exec();

    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    return memberships
      .map((m) => {
        const u = userMap.get(m.userId.toString());
        if (!u) return null;
        return {
          membershipId: m._id.toString(),
          user: {
            id: u._id.toString(),
            name: u.name,
            email: u.email,
            primaryRole: u.primaryRole,
          },
          assignedAt: m.assignedAt,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }
}

export const projectService = new ProjectService();
export default projectService;
