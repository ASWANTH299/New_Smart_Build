import mongoose from "mongoose";
import {
  Issue,
  IIssue,
  IssueCategory,
  IssuePriority,
  IssueStatus,
} from "./issue.model.js";
import { AppError } from "../../utils/AppError.js";

export interface CreateIssueInput {
  title: string;
  description: string;
  category?: IssueCategory;
  priority?: IssuePriority;
  assignedTo?: string | null;
  phaseId?: string | null;
  taskId?: string | null;
  dueDate?: string | Date | null;
}

export interface UpdateIssueInput {
  title?: string;
  description?: string;
  category?: IssueCategory;
  priority?: IssuePriority;
  status?: IssueStatus;
  assignedTo?: string | null;
  phaseId?: string | null;
  taskId?: string | null;
  dueDate?: string | Date | null;
  resolutionNotes?: string;
}

export interface IssueFilterOptions {
  status?: IssueStatus;
  priority?: IssuePriority;
  category?: IssueCategory;
  assignedTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class IssueService {
  async createIssue(
    projectId: string,
    data: CreateIssueInput,
    userId: string
  ): Promise<IIssue> {
    const count = await Issue.countDocuments({ projectId });
    const issueNumber = `ISS-${String(count + 1).padStart(4, "0")}`;

    const issue = new Issue({
      projectId: new mongoose.Types.ObjectId(projectId),
      issueNumber,
      title: data.title,
      description: data.description,
      category: data.category || "OTHER",
      priority: data.priority || "MEDIUM",
      status: "OPEN",
      assignedTo: data.assignedTo ? new mongoose.Types.ObjectId(data.assignedTo) : null,
      reportedBy: new mongoose.Types.ObjectId(userId),
      createdBy: new mongoose.Types.ObjectId(userId),
      phaseId: data.phaseId ? new mongoose.Types.ObjectId(data.phaseId) : null,
      taskId: data.taskId ? new mongoose.Types.ObjectId(data.taskId) : null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    });

    await issue.save();
    return await issue.populate([
      { path: "reportedBy", select: "name email role primaryRole" },
      { path: "assignedTo", select: "name email role primaryRole" },
    ]);
  }

  async getIssuesByProject(
    projectId: string,
    options: IssueFilterOptions = {}
  ): Promise<{ issues: IIssue[]; total: number; page: number; totalPages: number }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, Math.min(100, options.limit || 20));
    const skip = (page - 1) * limit;

    const query: any = { projectId: new mongoose.Types.ObjectId(projectId) };

    if (options.status) {
      query.status = options.status;
    }
    if (options.priority) {
      query.priority = options.priority;
    }
    if (options.category) {
      query.category = options.category;
    }
    if (options.assignedTo) {
      query.assignedTo = new mongoose.Types.ObjectId(options.assignedTo);
    }
    if (options.search) {
      query.$or = [
        { title: { $regex: options.search, $options: "i" } },
        { description: { $regex: options.search, $options: "i" } },
        { issueNumber: { $regex: options.search, $options: "i" } },
      ];
    }

    const [issues, total] = await Promise.all([
      Issue.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("reportedBy", "name email role primaryRole")
        .populate("assignedTo", "name email role primaryRole")
        .populate("phaseId", "name code")
        .populate("taskId", "title code"),
      Issue.countDocuments(query),
    ]);

    return {
      issues,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getIssueById(projectId: string, issueId: string): Promise<IIssue> {
    if (!mongoose.Types.ObjectId.isValid(issueId)) {
      throw new AppError("Invalid issue ID", 400);
    }

    const issue = await Issue.findOne({
      _id: new mongoose.Types.ObjectId(issueId),
      projectId: new mongoose.Types.ObjectId(projectId),
    })
      .populate("reportedBy", "name email role primaryRole")
      .populate("assignedTo", "name email role primaryRole")
      .populate("phaseId", "name code")
      .populate("taskId", "title code");

    if (!issue) {
      throw new AppError("Issue not found", 404);
    }

    return issue;
  }

  async updateIssue(
    projectId: string,
    issueId: string,
    updates: UpdateIssueInput,
    _userId: string
  ): Promise<IIssue> {
    if (!mongoose.Types.ObjectId.isValid(issueId)) {
      throw new AppError("Invalid issue ID", 400);
    }

    const issue = await Issue.findOne({
      _id: new mongoose.Types.ObjectId(issueId),
      projectId: new mongoose.Types.ObjectId(projectId),
    });

    if (!issue) {
      throw new AppError("Issue not found", 404);
    }

    if (updates.title !== undefined) issue.title = updates.title;
    if (updates.description !== undefined) issue.description = updates.description;
    if (updates.category !== undefined) issue.category = updates.category;
    if (updates.priority !== undefined) issue.priority = updates.priority;
    if (updates.assignedTo !== undefined) {
      issue.assignedTo = updates.assignedTo ? new mongoose.Types.ObjectId(updates.assignedTo) : null;
    }
    if (updates.phaseId !== undefined) {
      issue.phaseId = updates.phaseId ? new mongoose.Types.ObjectId(updates.phaseId) : null;
    }
    if (updates.taskId !== undefined) {
      issue.taskId = updates.taskId ? new mongoose.Types.ObjectId(updates.taskId) : null;
    }
    if (updates.dueDate !== undefined) {
      issue.dueDate = updates.dueDate ? new Date(updates.dueDate) : null;
    }
    if (updates.resolutionNotes !== undefined) {
      issue.resolutionNotes = updates.resolutionNotes;
    }

    if (updates.status !== undefined) {
      issue.status = updates.status;
      if ((updates.status === "RESOLVED" || updates.status === "CLOSED") && !issue.resolvedAt) {
        issue.resolvedAt = new Date();
      } else if (updates.status === "OPEN" || updates.status === "IN_PROGRESS") {
        issue.resolvedAt = null;
      }
    }

    await issue.save();
    return await issue.populate([
      { path: "reportedBy", select: "name email role primaryRole" },
      { path: "assignedTo", select: "name email role primaryRole" },
      { path: "phaseId", select: "name code" },
      { path: "taskId", select: "title code" },
    ]);
  }

  async resolveIssue(
    projectId: string,
    issueId: string,
    resolutionNotes: string,
    userId: string
  ): Promise<IIssue> {
    return this.updateIssue(
      projectId,
      issueId,
      {
        status: "RESOLVED",
        resolutionNotes,
      },
      userId
    );
  }

  async closeIssue(projectId: string, issueId: string, userId: string): Promise<IIssue> {
    return this.updateIssue(
      projectId,
      issueId,
      {
        status: "CLOSED",
      },
      userId
    );
  }
}

export const issueService = new IssueService();
