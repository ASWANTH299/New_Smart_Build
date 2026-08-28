import { apiClient, ApiResponse } from "./api.js";

export type MilestoneStatus = "PENDING" | "ACHIEVED" | "MISSED";

export interface Milestone {
  _id: string;
  projectId: string;
  phaseId?: { _id: string; name: string } | null;
  name: string;
  description?: string;
  plannedDate: string;
  actualDate?: string | null;
  status: MilestoneStatus;
  responsibleUserId?: { _id: string; name: string; email: string } | null;
  relatedTaskIds?: Array<{ _id: string; title: string; status: string; progress: number }>;
  clientVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMilestonePayload {
  phaseId?: string;
  name: string;
  description?: string;
  plannedDate: string;
  responsibleUserId?: string;
  relatedTaskIds?: string[];
  clientVisible?: boolean;
}

export const milestoneService = {
  async getMilestones(projectId: string): Promise<ApiResponse<Milestone[]>> {
    return await apiClient.get<Milestone[]>(`/projects/${projectId}/milestones`);
  },

  async getMilestoneById(
    projectId: string,
    milestoneId: string
  ): Promise<ApiResponse<Milestone>> {
    return await apiClient.get<Milestone>(
      `/projects/${projectId}/milestones/${milestoneId}`
    );
  },

  async createMilestone(
    projectId: string,
    payload: CreateMilestonePayload
  ): Promise<ApiResponse<Milestone>> {
    return await apiClient.post<Milestone>(
      `/projects/${projectId}/milestones`,
      payload
    );
  },

  async updateMilestone(
    projectId: string,
    milestoneId: string,
    payload: Partial<CreateMilestonePayload> & {
      status?: MilestoneStatus;
      actualDate?: string | null;
    }
  ): Promise<ApiResponse<Milestone>> {
    return await apiClient.put<Milestone>(
      `/projects/${projectId}/milestones/${milestoneId}`,
      payload
    );
  },

  async deleteMilestone(
    projectId: string,
    milestoneId: string
  ): Promise<ApiResponse<{ message: string }>> {
    return await apiClient.delete<{ message: string }>(
      `/projects/${projectId}/milestones/${milestoneId}`
    );
  },
};

export default milestoneService;
