import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DashboardPage } from "./DashboardPage.js";
import { AuthProvider } from "../../hooks/useAuth.js";
import { projectService } from "../../services/projectService.js";

describe("DashboardPage Real Data Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.setItem(
      "smart_build_user",
      JSON.stringify({
        id: "507f1f77bcf86cd799439001",
        name: "System Administrator",
        email: "admin@smartbuild.com",
        primaryRole: "ADMIN",
        status: "ACTIVE",
      })
    );
    localStorage.setItem("smart_build_token", "test-token");
  });

  it("renders dashboard metrics and real project directory without demo placeholders", async () => {
    vi.spyOn(projectService, "getProjects").mockResolvedValue({
      success: true,
      data: [
        {
          _id: "507f1f77bcf86cd799439011",
          code: "PRJ-2026-001",
          name: "Apex Horizon Tower",
          location: "Sector 62, Metro Corridor",
          status: "ACTIVE",
          health: "HEALTHY",
          healthFactors: [],
          progress: 45,
          plannedStartDate: "2026-01-01",
          plannedEndDate: "2027-06-30",
          projectManagerId: {
            _id: "507f1f77bcf86cd799439002",
            name: "Rajesh Mukherjee",
            email: "pm@smartbuild.com",
            primaryRole: "PROJECT_MANAGER",
          },
          createdAt: "2026-01-01",
          updatedAt: "2026-01-15",
        },
      ],
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText("Operations Dashboard")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("PRJ-2026-001")).toBeInTheDocument();
      expect(screen.getByText("Apex Horizon Tower")).toBeInTheDocument();
      expect(screen.getByText("Sector 62, Metro Corridor")).toBeInTheDocument();
    });

    // Check that fake PRJ-001/PRJ-002 demo placeholders are NOT rendered
    expect(screen.queryByText("PRJ-001")).not.toBeInTheDocument();
    expect(screen.queryByText("3892% completion rate")).not.toBeInTheDocument();
  });
});
