import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { PhasesPage } from "./PhasesPage.js";
import { AuthProvider } from "../../hooks/useAuth.js";
import { ToastProvider } from "../../hooks/useToast.js";
import { phaseService } from "../../services/phaseService.js";
import { projectService } from "../../services/projectService.js";

const renderComponent = () =>
  render(
    <MemoryRouter initialEntries={["/projects/p-100/phases"]}>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/projects/:projectId/phases" element={<PhasesPage />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </MemoryRouter>
  );

describe("PhasesPage Integration Tests (Phase 7)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders phases list with progression indicators and sequence numbers", async () => {
    vi.spyOn(projectService, "getProjectById").mockResolvedValue({
      success: true,
      data: {
        _id: "p-100",
        code: "PRJ-100",
        name: "Grand Horizon",
        location: "Koramangala",
        plannedStartDate: "2026-09-01",
        plannedEndDate: "2027-09-01",
        projectManagerId: {
          _id: "pm-1",
          name: "Anand Sen",
          email: "anand@smartbuild.com",
          primaryRole: "PROJECT_MANAGER",
        },
        status: "ACTIVE",
        health: "HEALTHY",
        healthFactors: [],
        progress: 35,
        createdAt: "2026-08-01",
        updatedAt: "2026-08-20",
      },
    });

    vi.spyOn(phaseService, "getPhases").mockResolvedValue({
      success: true,
      data: [
        {
          _id: "phase-1",
          projectId: "p-100",
          name: "Substructure & Foundation",
          description: "Excavation, footing, plinth",
          sequence: 1,
          plannedStartDate: "2026-09-01",
          plannedEndDate: "2026-11-30",
          status: "IN_PROGRESS",
          progress: 70,
          taskCount: 4,
          completedTaskCount: 2,
          createdAt: "2026-08-01",
          updatedAt: "2026-08-20",
        },
      ],
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Substructure & Foundation")).toBeInTheDocument();
      expect(screen.getByText("Phase Progress")).toBeInTheDocument();
      expect(screen.getByText("Excavation, footing, plinth")).toBeInTheDocument();
    });
  });
});
