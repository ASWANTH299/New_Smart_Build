import { apiClient, ApiResponse } from "./api.js";

export interface Phase {
  _id: string;
  projectId: string;
  name: string;
  description?: string;
  sequence: number;
  plannedStartDate: string;
  plannedEndDate: string;
  actualStartDate?: string | null;
  actualEndDate?: string | null;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "ON_HOLD";
  progress: number;
  dependencies?: Array<{ _id: string; name: string; sequence: number; status: string }>;
  taskCount?: number;
  completedTaskCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePhasePayload {
  name: string;
  description?: string;
  sequence?: number;
  plannedStartDate: string;
  plannedEndDate: string;
  dependencies?: string[];
}

export const phaseService = {
  async getPhases(projectId: string): Promise<ApiResponse<Phase[]>> {
    return await apiClient.get<Phase[]>(`/projects/${projectId}/phases`);
  },

  async getPhaseById(projectId: string, phaseId: string): Promise<ApiResponse<Phase>> {
    return await apiClient.get<Phase>(`/projects/${projectId}/phases/${phaseId}`);
  },

  async createPhase(
    projectId: string,
    payload: CreatePhasePayload
  ): Promise<ApiResponse<Phase>> {
    return await apiClient.post<Phase>(`/projects/${projectId}/phases`, payload);
  },

  async updatePhase(
    projectId: string,
    phaseId: string,
    payload: Partial<CreatePhasePayload> & { status?: Phase["status"] }
  ): Promise<ApiResponse<Phase>> {
    return await apiClient.put<Phase>(
      `/projects/${projectId}/phases/${phaseId}`,
      payload
    );
  },

  async deletePhase(
    projectId: string,
    phaseId: string
  ): Promise<ApiResponse<{ message: string }>> {
    return await apiClient.delete<{ message: string }>(
      `/projects/${projectId}/phases/${phaseId}`
    );
  },
};

export default phaseService;
