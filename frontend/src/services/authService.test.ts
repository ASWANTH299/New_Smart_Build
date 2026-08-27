import { describe, it, expect, vi, beforeEach } from "vitest";
import authService from "./authService.js";
import { apiClient } from "./api.js";

describe("Frontend authService Unit Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should call apiClient.post for login", async () => {
    const mockResponse = {
      success: true,
      data: {
        token: "jwt-token-xyz",
        user: {
          id: "1",
          name: "Test User",
          email: "test@smartbuild.com",
          primaryRole: "ADMIN" as const,
          additionalPermissions: [],
          status: "ACTIVE" as const,
        },
      },
    };

    vi.spyOn(apiClient, "post").mockResolvedValueOnce(mockResponse);

    const result = await authService.login("test@smartbuild.com", "pass123");
    expect(apiClient.post).toHaveBeenCalledWith("/auth/login", {
      email: "test@smartbuild.com",
      password: "pass123",
    });
    expect(result.data?.token).toBe("jwt-token-xyz");
  });

  it("should call apiClient.post for forgot-password", async () => {
    vi.spyOn(apiClient, "post").mockResolvedValueOnce({
      success: true,
      data: { message: "Dispatched" },
    });

    const result = await authService.forgotPassword("user@smartbuild.com");
    expect(apiClient.post).toHaveBeenCalledWith("/auth/forgot-password", {
      email: "user@smartbuild.com",
    });
    expect(result.success).toBe(true);
  });

  it("should call apiClient.post for reset-password", async () => {
    vi.spyOn(apiClient, "post").mockResolvedValueOnce({
      success: true,
      data: { message: "Updated" },
    });

    const result = await authService.resetPassword("tok-123", "NewPass123!");
    expect(apiClient.post).toHaveBeenCalledWith("/auth/reset-password", {
      token: "tok-123",
      password: "NewPass123!",
    });
    expect(result.success).toBe(true);
  });

  it("should call apiClient.post for activate-account", async () => {
    vi.spyOn(apiClient, "post").mockResolvedValueOnce({
      success: true,
      data: { message: "Activated" },
    });

    const result = await authService.activateAccount("act-123", "NewPass123!");
    expect(apiClient.post).toHaveBeenCalledWith("/auth/activate-account", {
      token: "act-123",
      password: "NewPass123!",
    });
    expect(result.success).toBe(true);
  });
});
