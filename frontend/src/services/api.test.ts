import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiClient, ApiError } from "./api.js";

describe("Frontend API Service Layer", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("should make GET requests with JSON headers and parse response", async () => {
    const mockResponse = {
      success: true,
      data: { message: "Server healthy" },
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValueOnce(mockResponse),
    });

    const result = await apiClient.get("/health");
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ message: "Server healthy" });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/health"),
      expect.objectContaining({ method: "GET" })
    );
  });

  it("should attach Bearer token to request headers when token is stored", async () => {
    localStorage.setItem("smart_build_token", "test-token-12345");

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValueOnce({ success: true }),
    });

    await apiClient.get("/projects");
    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.any(Headers),
      })
    );
  });

  it("should throw ApiError with status and code when response is not ok", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
      json: vi.fn().mockResolvedValueOnce({
        success: false,
        message: "Project not found",
        code: "PROJECT_NOT_FOUND",
      }),
    });

    await expect(apiClient.get("/projects/999")).rejects.toThrow(ApiError);
  });
});
