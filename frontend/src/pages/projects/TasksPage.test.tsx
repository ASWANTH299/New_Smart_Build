import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { TasksPage } from "./TasksPage.js";
import { AuthProvider } from "../../hooks/useAuth.js";
import { ToastProvider } from "../../hooks/useToast.js";
import { taskService } from "../../services/taskService.js";
import { phaseService } from "../../services/phaseService.js";
import { projectService } from "../../services/projectService.js";

const renderComponent = () =>
  render(
    <MemoryRouter initialEntries={["/projects/p-100/tasks"]}>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/projects/:projectId/tasks" element={<TasksPage />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </MemoryRouter>
  );

describe("TasksPage Integration Tests (Phase 7)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders tasks list with planned quantities and opens progress modal", async () => {
    vi.spyOn(phaseService, "getPhases").mockResolvedValue({
      success: true,
      data: [
        {
          _id: "phase-1",
          projectId: "p-100",
          name: "Foundation",
          sequence: 1,
          plannedStartDate: "2026-09-01",
          plannedEndDate: "2026-10-01",
          status: "IN_PROGRESS",
          progress: 50,
          createdAt: "2026-08-01",
          updatedAt: "2026-08-01",
        },
      ],
    });

    vi.spyOn(projectService, "getProjectTeam").mockResolvedValue({
      success: true,
      data: [],
    });

    vi.spyOn(taskService, "getTasks").mockResolvedValue({
      success: true,
      data: [
        {
          _id: "task-1",
          projectId: "p-100",
          phaseId: { _id: "phase-1", name: "Foundation" },
          title: "Footing Concreting",
          priority: "HIGH",
          status: "IN_PROGRESS",
          plannedStartDate: "2026-09-01",
          plannedEndDate: "2026-09-15",
          plannedQuantity: 500,
          unit: "cu.m",
          completedQuantity: 250,
          progress: 50,
          createdAt: "2026-08-01",
          updatedAt: "2026-08-10",
        },
      ],
    });

    renderComponent();

    const taskTitle = await screen.findByText("Footing Concreting");
    expect(taskTitle).toBeInTheDocument();
    expect(screen.getByText(/Scope:/i)).toBeInTheDocument();

    const logProgressBtn = await screen.findByRole("button", { name: /Log Progress/i });
    fireEvent.click(logProgressBtn);

    await waitFor(() => {
      expect(screen.getByText(/Log Progress: Footing Concreting/i)).toBeInTheDocument();
      expect(screen.getByText(/Planned Work Scope:/i)).toBeInTheDocument();
    });
  });
});
