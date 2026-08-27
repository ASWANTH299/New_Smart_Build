import { apiClient, ApiResponse } from "./api.js";
import { ProjectContextType } from "../types/index.js";

export interface ProjectType {
  _id: string;
  name: string;
  code: string;
  description?: string;
}

export interface ProjectTemplate {
  _id: string;
  name: string;
  description: string;
  defaultPhases: Array<{ name: string; sequence: number; description?: string }>;
  defaultBudgetCategories: string[];
}

export interface ProjectDetail {
  _id: string;
  code: string;
  name: string;
  typeId?: { _id: string; name: string; code: string };
  clientUserId?: { _id: string; name: string; email: string };
  location: string;
  description?: string;
  plannedStartDate: string;
  plannedEndDate: string;
  actualStartDate?: string | null;
  actualEndDate?: string | null;
  projectManagerId: { _id: string; name: string; email: string; primaryRole: string };
  status: "DRAFT" | "PLANNING" | "ACTIVE" | "ON_HOLD" | "COMPLETED" | "ARCHIVED";
  health: "HEALTHY" | "AT_RISK" | "CRITICAL";
  healthFactors: string[];
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectPayload {
  code: string;
  name: string;
  typeId?: string;
  templateId?: string;
  clientUserId?: string;
  location: string;
  description?: string;
  plannedStartDate: string;
  plannedEndDate: string;
  projectManagerId: string;
  teamUserIds?: string[];
  health?: "HEALTHY" | "AT_RISK" | "CRITICAL";
  progress?: number;
}

export interface ProjectOverviewData {
  project: ProjectDetail;
  teamCount: number;
  daysRemaining: number;
}

export const projectService = {
  async getProjects(params?: {
    search?: string;
    status?: string;
    health?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<ProjectDetail[]>> {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.status) query.set("status", params.status);
    if (params?.health) query.set("health", params.health);
    if (params?.page) query.set("page", params.page.toString());
    if (params?.limit) query.set("limit", params.limit.toString());

    const qs = query.toString() ? `?${query.toString()}` : "";
    return await apiClient.get<ProjectDetail[]>(`/projects${qs}`);
  },

  async getProjectById(projectId: string): Promise<ApiResponse<ProjectDetail>> {
    return await apiClient.get<ProjectDetail>(`/projects/${projectId}`);
  },

  async createProject(data: CreateProjectPayload): Promise<ApiResponse<ProjectDetail>> {
    return await apiClient.post<ProjectDetail>("/projects", data);
  },

  async updateProject(
    projectId: string,
    data: Partial<CreateProjectPayload>
  ): Promise<ApiResponse<ProjectDetail>> {
    return await apiClient.put<ProjectDetail>(`/projects/${projectId}`, data);
  },

  async updateProjectStatus(
    projectId: string,
    status: ProjectContextType["status"],
    reason?: string
  ): Promise<ApiResponse<ProjectDetail>> {
    return await apiClient.put<ProjectDetail>(`/projects/${projectId}/status`, { status, reason });
  },

  async getProjectOverview(projectId: string): Promise<ApiResponse<ProjectOverviewData>> {
    return await apiClient.get<ProjectOverviewData>(`/projects/${projectId}/overview`);
  },

  async getProjectTeam(projectId: string): Promise<
    ApiResponse<
      Array<{
        membershipId: string;
        user: { id: string; name: string; email: string; primaryRole: string };
        assignedAt: string;
      }>
    >
  > {
    return await apiClient.get(`/projects/${projectId}/team`);
  },

  async getProjectTypes(): Promise<ApiResponse<ProjectType[]>> {
    return await apiClient.get<ProjectType[]>("/project-types");
  },

  async getProjectTemplates(): Promise<ApiResponse<ProjectTemplate[]>> {
    return await apiClient.get<ProjectTemplate[]>("/project-templates");
  },
};

export default projectService;
