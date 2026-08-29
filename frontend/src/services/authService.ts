import { apiClient, ApiResponse } from "./api.js";
import { User } from "../types/index.js";

export interface LoginResponseData {
  token: string;
  user: User;
}

export interface MessageResponseData {
  message: string;
  resetToken?: string;
}

export const authService = {
  async login(email: string, pass: string): Promise<ApiResponse<LoginResponseData>> {
    return await apiClient.post<LoginResponseData>("/auth/login", {
      email,
      password: pass,
    });
  },

  async requestAccess(data: {
    name: string;
    email: string;
    requestedRole: string;
    organization?: string;
    reason?: string;
  }): Promise<ApiResponse<{ message: string }>> {
    return await apiClient.post<{ message: string }>("/auth/request-access", data);
  },

  async logout(): Promise<ApiResponse<MessageResponseData>> {
    return await apiClient.post<MessageResponseData>("/auth/logout");
  },

  async forgotPassword(email: string): Promise<ApiResponse<MessageResponseData>> {
    return await apiClient.post<MessageResponseData>("/auth/forgot-password", {
      email,
    });
  },

  async resetPassword(token: string, newPass: string): Promise<ApiResponse<MessageResponseData>> {
    return await apiClient.post<MessageResponseData>("/auth/reset-password", {
      token,
      password: newPass,
    });
  },

  async activateAccount(token: string, newPass: string): Promise<ApiResponse<MessageResponseData>> {
    return await apiClient.post<MessageResponseData>("/auth/activate-account", {
      token,
      password: newPass,
    });
  },

  async changePassword(
    currentPass: string,
    newPass: string
  ): Promise<ApiResponse<MessageResponseData>> {
    return await apiClient.put<MessageResponseData>("/auth/change-password", {
      currentPassword: currentPass,
      newPassword: newPass,
    });
  },

  async getMe(): Promise<ApiResponse<{ user: User }>> {
    return await apiClient.get<{ user: User }>("/auth/me");
  },
};

export default authService;
