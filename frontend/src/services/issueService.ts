import { apiClient } from "./api.js";
import {
  Issue,
  CreateIssueInput,
  UpdateIssueInput,
  IssueStatus,
  IssuePriority,
  IssueCategory,
} from "../types/issue.js";

export const issueService = {
  /**
   * Get paginated issues for a project with optional filters
   */
  async getIssues(
    projectId: string,
    params?: {
      status?: IssueStatus | string;
      priority?: IssuePriority | string;
      category?: IssueCategory | string;
      assignedTo?: string;
      search?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{
    success: boolean;
    data: Issue[];
    meta: { total: number; page: number; totalPages: number };
  }> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append("status", params.status);
    if (params?.priority) searchParams.append("priority", params.priority);
    if (params?.category) searchParams.append("category", params.category);
    if (params?.assignedTo) searchParams.append("assignedTo", params.assignedTo);
    if (params?.search) searchParams.append("search", params.search);
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());

    const qs = searchParams.toString();
    const endpoint = `/projects/${projectId}/issues${qs ? `?${qs}` : ""}`;
    const res = await apiClient.get<Issue[]>(endpoint);
    return {
      success: res.success,
      data: res.data || [],
      meta: (res.meta as any) || { total: 0, page: 1, totalPages: 1 },
    };
  },

  /**
   * Get issue detail
   */
  async getIssueById(
    projectId: string,
    issueId: string
  ): Promise<{ success: boolean; data: Issue }> {
    const res = await apiClient.get<Issue>(`/projects/${projectId}/issues/${issueId}`);
    return {
      success: res.success,
      data: res.data as Issue,
    };
  },

  /**
   * Report a new site issue
   */
  async createIssue(
    projectId: string,
    payload: CreateIssueInput
  ): Promise<{ success: boolean; message?: string; data: Issue }> {
    const res = await apiClient.post<Issue>(`/projects/${projectId}/issues`, payload);
    return {
      success: res.success,
      message: res.message,
      data: res.data as Issue,
    };
  },

  /**
   * Update issue fields (status, priority, assignee, etc.)
   */
  async updateIssue(
    projectId: string,
    issueId: string,
    payload: UpdateIssueInput
  ): Promise<{ success: boolean; message?: string; data: Issue }> {
    const res = await apiClient.patch<Issue>(
      `/projects/${projectId}/issues/${issueId}`,
      payload
    );
    return {
      success: res.success,
      message: res.message,
      data: res.data as Issue,
    };
  },

  /**
   * Mark issue as resolved with resolution notes
   */
  async resolveIssue(
    projectId: string,
    issueId: string,
    resolutionNotes: string
  ): Promise<{ success: boolean; message?: string; data: Issue }> {
    const res = await apiClient.patch<Issue>(
      `/projects/${projectId}/issues/${issueId}/resolve`,
      { resolutionNotes }
    );
    return {
      success: res.success,
      message: res.message,
      data: res.data as Issue,
    };
  },

  /**
   * Mark issue as closed
   */
  async closeIssue(
    projectId: string,
    issueId: string
  ): Promise<{ success: boolean; message?: string; data: Issue }> {
    const res = await apiClient.patch<Issue>(
      `/projects/${projectId}/issues/${issueId}/close`
    );
    return {
      success: res.success,
      message: res.message,
      data: res.data as Issue,
    };
  },
};
