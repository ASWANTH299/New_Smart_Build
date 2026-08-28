import { apiClient, ApiResponse } from "./api.js";

export interface ProgressRecord {
  _id: string;
  projectId: string;
  taskId: { _id: string; title: string; unit: string; plannedQuantity: number };
  phaseId: { _id: string; name: string; sequence: number };
  enteredBy: { _id: string; name: string; email: string; primaryRole: string };
  date: string;
  completedQuantity: number;
  unit: string;
  notes?: string;
  source: "WEB" | "MOBILE";
  createdAt: string;
}

export interface ProjectHealthAssessment {
  health: "HEALTHY" | "AT_RISK" | "CRITICAL";
  healthFactors: string[];
  metrics: {
    progress: number;
    overdueTasksCount: number;
    blockedTasksCount: number;
    missedMilestonesCount: number;
    daysToDeadline: number;
    expectedProgress: number;
  };
}

export const progressService = {
  async getProgressHistory(
    projectId: string,
    params?: { taskId?: string; phaseId?: string; limit?: number }
  ): Promise<ApiResponse<ProgressRecord[]>> {
    const query = new URLSearchParams();
    if (params?.taskId) query.set("taskId", params.taskId);
    if (params?.phaseId) query.set("phaseId", params.phaseId);
    if (params?.limit) query.set("limit", params.limit.toString());

    const qs = query.toString() ? `?${query.toString()}` : "";
    return await apiClient.get<ProgressRecord[]>(`/projects/${projectId}/progress${qs}`);
  },

  async getProjectHealth(projectId: string): Promise<ApiResponse<ProjectHealthAssessment>> {
    return await apiClient.get<ProjectHealthAssessment>(`/projects/${projectId}/health`);
  },
};

export default progressService;
