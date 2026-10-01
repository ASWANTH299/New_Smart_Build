import { apiClient, ApiResponse } from "./api.js";
import {
  ClientProjectMetadata,
  ClientProjectDetailsResponse,
} from "../types/client.js";

export const clientService = {
  /**
   * Fetch all projects assigned to the logged-in client
   */
  async getClientProjects(): Promise<ApiResponse<ClientProjectMetadata[]>> {
    return apiClient.get<ClientProjectMetadata[]>("/client/projects");
  },

  /**
   * Fetch strictly curated, client-safe project details
   */
  async getClientProjectDetails(
    projectId: string
  ): Promise<ApiResponse<ClientProjectDetailsResponse>> {
    return apiClient.get<ClientProjectDetailsResponse>(`/client/projects/${projectId}`);
  },
};

export default clientService;
