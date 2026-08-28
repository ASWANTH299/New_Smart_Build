import { apiClient, ApiResponse } from "./api.js";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "BLOCKED" | "COMPLETED";

export interface Task {
  _id: string;
  projectId: string;
  phaseId: { _id: string; name: string; sequence?: number } | string;
  title: string;
  description?: string;
  assigneeId?: { _id: string; name: string; email: string; primaryRole: string } | null;
  contractorId?: { _id: string; name: string; email: string } | null;
  priority: TaskPriority;
  status: TaskStatus;
  plannedStartDate: string;
  plannedEndDate: string;
  actualStartDate?: string | null;
  actualEndDate?: string | null;
  plannedQuantity: number;
  unit: string;
  completedQuantity: number;
  progress: number;
  dependencies?: Array<{ _id: string; title: string; status: string; progress: number }>;
  attachments?: string[];
  createdBy?: { _id: string; name: string; email: string };
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
}

export interface CreateTaskPayload {
  phaseId: string;
  title: string;
  description?: string;
  assigneeId?: string;
  contractorId?: string;
  priority?: TaskPriority;
  plannedStartDate: string;
  plannedEndDate: string;
  plannedQuantity: number;
  unit?: string;
  dependencies?: string[];
}

export interface LogProgressPayload {
  completedQuantity: number;
  date?: string;
  notes?: string;
  source?: "WEB" | "MOBILE";
}

export const taskService = {
  async getTasks(
    projectId: string,
    params?: {
      phaseId?: string;
      assigneeId?: string;
      status?: string;
      priority?: string;
      search?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<ApiResponse<Task[]>> {
    const query = new URLSearchParams();
    if (params?.phaseId) query.set("phaseId", params.phaseId);
    if (params?.assigneeId) query.set("assigneeId", params.assigneeId);
    if (params?.status) query.set("status", params.status);
    if (params?.priority) query.set("priority", params.priority);
    if (params?.search) query.set("search", params.search);
    if (params?.page) query.set("page", params.page.toString());
    if (params?.limit) query.set("limit", params.limit.toString());

    const qs = query.toString() ? `?${query.toString()}` : "";
    return await apiClient.get<Task[]>(`/projects/${projectId}/tasks${qs}`);
  },

  async getTaskById(projectId: string, taskId: string): Promise<ApiResponse<Task>> {
    return await apiClient.get<Task>(`/projects/${projectId}/tasks/${taskId}`);
  },

  async createTask(
    projectId: string,
    payload: CreateTaskPayload
  ): Promise<ApiResponse<Task>> {
    return await apiClient.post<Task>(`/projects/${projectId}/tasks`, payload);
  },

  async updateTask(
    projectId: string,
    taskId: string,
    payload: Partial<CreateTaskPayload> & { status?: TaskStatus }
  ): Promise<ApiResponse<Task>> {
    return await apiClient.put<Task>(`/projects/${projectId}/tasks/${taskId}`, payload);
  },

  async updateTaskStatus(
    projectId: string,
    taskId: string,
    status: TaskStatus,
    reason?: string
  ): Promise<ApiResponse<Task>> {
    return await apiClient.put<Task>(`/projects/${projectId}/tasks/${taskId}/status`, {
      status,
      reason,
    });
  },

  async logProgress(
    projectId: string,
    taskId: string,
    payload: LogProgressPayload
  ): Promise<ApiResponse<{ task: Task; progressRecord: unknown }>> {
    return await apiClient.put<{ task: Task; progressRecord: unknown }>(
      `/projects/${projectId}/tasks/${taskId}/progress`,
      payload
    );
  },

  async deleteTask(
    projectId: string,
    taskId: string
  ): Promise<ApiResponse<{ message: string }>> {
    return await apiClient.delete<{ message: string }>(
      `/projects/${projectId}/tasks/${taskId}`
    );
  },
};

export default taskService;
