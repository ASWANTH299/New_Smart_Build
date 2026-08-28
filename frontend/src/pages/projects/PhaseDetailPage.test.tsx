import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { PhaseDetailPage } from "./PhaseDetailPage.js";
import { AuthProvider } from "../../hooks/useAuth.js";
import { ToastProvider } from "../../hooks/useToast.js";
import { phaseService } from "../../services/phaseService.js";
import { taskService } from "../../services/taskService.js";
import { projectService } from "../../services/projectService.js";

describe("PhaseDetailPage Integration Tests", () => {
  const projectId = "507f1f77bcf86cd799439011";
  const phaseId = "507f1f77bcf86cd799439015";

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

  it("successfully loads and renders existing phase details and child tasks", async () => {
    vi.spyOn(phaseService, "getPhaseById").mockResolvedValue({
      success: true,
      data: {
        _id: phaseId,
        projectId,
        name: "Superstructure Frame",
        sequence: 2,
        plannedStartDate: "2026-05-01",
        plannedEndDate: "2026-12-31",
        status: "IN_PROGRESS",
        progress: 45,
        dependencies: [],
        createdAt: "2026-01-01",
        updatedAt: "2026-01-15",
      },
    });

    vi.spyOn(taskService, "getTasks").mockResolvedValue({
      success: true,
      data: [
        {
          _id: "507f1f77bcf86cd799439020",
          projectId,
          phaseId,
          title: "Columns & Level 5 Slab Casting",
          plannedQuantity: 2500,
          completedQuantity: 1125,
          unit: "cu.m",
          progress: 45,
          priority: "URGENT",
          status: "IN_PROGRESS",
          plannedStartDate: "2026-05-01",
          plannedEndDate: "2026-09-30",
          dependencies: [],
          createdAt: "2026-01-01",
          updatedAt: "2026-01-15",
        },
      ],
    });

    vi.spyOn(projectService, "getProjectTeam").mockResolvedValue({
      success: true,
      data: [
        {
          membershipId: "mem-1",
          user: {
            id: "507f1f77bcf86cd799439002",
            name: "Rajesh PM",
            email: "pm@smartbuild.com",
            primaryRole: "PROJECT_MANAGER",
          },
          assignedAt: "2026-01-01",
        },
      ],
    });

    render(
      <MemoryRouter initialEntries={[`/projects/${projectId}/phases/${phaseId}`]}>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route
                path="/projects/:projectId/phases/:phaseId"
                element={<PhaseDetailPage />}
              />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText("Loading phase details...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Phase 2: Superstructure Frame/i)).toBeInTheDocument();
      expect(screen.getByText("Columns & Level 5 Slab Casting")).toBeInTheDocument();
      expect(screen.getByText("Scope: 1125 / 2500 cu.m")).toBeInTheDocument();
    });

    expect(screen.queryByText("Phase Not Found")).not.toBeInTheDocument();
  });

  it("renders Phase Not Found EmptyState when phase does not exist (404)", async () => {
    vi.spyOn(phaseService, "getPhaseById").mockResolvedValue({
      success: false,
      message: "Phase not found in this project.",
    });

    vi.spyOn(taskService, "getTasks").mockResolvedValue({
      success: true,
      data: [],
    });

    vi.spyOn(projectService, "getProjectTeam").mockResolvedValue({
      success: true,
      data: [],
    });

    render(
      <MemoryRouter initialEntries={[`/projects/${projectId}/phases/non-existent-phase`]}>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route
                path="/projects/:projectId/phases/:phaseId"
                element={<PhaseDetailPage />}
              />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Phase Not Found")).toBeInTheDocument();
      expect(screen.getByText("The requested phase does not exist.")).toBeInTheDocument();
    });
  });
});
