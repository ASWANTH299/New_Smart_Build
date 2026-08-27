import { apiClient, ApiResponse } from "./api.js";
import { User, UserRole } from "../types/index.js";

export interface CreateUserData {
  name: string;
  email: string;
  primaryRole: UserRole;
  password?: string;
  additionalPermissions?: string[];
  projectIds?: string[];
}

export interface UserDetailResponse {
  user: User;
  projectMemberships: Array<{ projectId: string; assignmentStatus: string; assignedAt: string }>;
  recentLogins: Array<{ success: boolean; ipAddress: string; timestamp: string }>;
}

export const userService = {
  async getUsers(params?: {
    search?: string;
    role?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<User[]>> {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.role) query.set("role", params.role);
    if (params?.status) query.set("status", params.status);
    if (params?.page) query.set("page", params.page.toString());
    if (params?.limit) query.set("limit", params.limit.toString());

    const qs = query.toString() ? `?${query.toString()}` : "";
    return await apiClient.get<User[]>(`/users${qs}`);
  },

  async getUserById(userId: string): Promise<ApiResponse<UserDetailResponse>> {
    return await apiClient.get<UserDetailResponse>(`/users/${userId}`);
  },

  async createUser(data: CreateUserData): Promise<ApiResponse<{ user: User; activationToken?: string }>> {
    return await apiClient.post<{ user: User; activationToken?: string }>("/users", data);
  },

  async updateUser(userId: string, data: Partial<CreateUserData>): Promise<ApiResponse<User>> {
    return await apiClient.put<User>(`/users/${userId}`, data);
  },

  async updateUserStatus(
    userId: string,
    status: "ACTIVE" | "DEACTIVATED",
    reason?: string
  ): Promise<ApiResponse<User>> {
    return await apiClient.put<User>(`/users/${userId}/status`, { status, reason });
  },

  async updateUserPermissions(
    userId: string,
    additionalPermissions: string[]
  ): Promise<ApiResponse<User>> {
    return await apiClient.put<User>(`/users/${userId}/permissions`, { additionalPermissions });
  },

  async assignProject(userId: string, projectId: string): Promise<ApiResponse<{ message: string }>> {
    return await apiClient.post<{ message: string }>(`/users/${userId}/projects`, { projectId });
  },

  async removeProjectAssignment(
    userId: string,
    projectId: string
  ): Promise<ApiResponse<{ message: string }>> {
    return await apiClient.delete<{ message: string }>(`/users/${userId}/projects/${projectId}`);
  },
};

export default userService;
