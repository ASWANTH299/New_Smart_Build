import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { MilestonesPage } from "./MilestonesPage.js";
import { AuthProvider } from "../../hooks/useAuth.js";
import { ToastProvider } from "../../hooks/useToast.js";
import { milestoneService } from "../../services/milestoneService.js";
import { phaseService } from "../../services/phaseService.js";
import { projectService } from "../../services/projectService.js";

const renderComponent = () =>
  render(
    <MemoryRouter initialEntries={["/projects/p-100/milestones"]}>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/projects/:projectId/milestones" element={<MilestonesPage />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </MemoryRouter>
  );

describe("MilestonesPage Integration Tests (Phase 7)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders milestones cards with target dates and status badges", async () => {
    vi.spyOn(phaseService, "getPhases").mockResolvedValue({
      success: true,
      data: [],
    });

    vi.spyOn(projectService, "getProjectTeam").mockResolvedValue({
      success: true,
      data: [],
    });

    vi.spyOn(milestoneService, "getMilestones").mockResolvedValue({
      success: true,
      data: [
        {
          _id: "m-1",
          projectId: "p-100",
          name: "Substructure Completion Gate",
          description: "All foundation columns completed",
          plannedDate: "2026-11-30",
          status: "PENDING",
          clientVisible: true,
          createdAt: "2026-08-01",
          updatedAt: "2026-08-01",
        },
      ],
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Substructure Completion Gate")).toBeInTheDocument();
      expect(screen.getByText("All foundation columns completed")).toBeInTheDocument();
      expect(screen.getByText(/Pending/i)).toBeInTheDocument();
    });
  });
});
