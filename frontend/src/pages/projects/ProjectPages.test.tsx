import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter, MemoryRouter, Routes, Route } from "react-router-dom";
import { ProjectsPage } from "./ProjectsPage.js";
import { CreateProjectPage } from "./CreateProjectPage.js";
import { ProjectOverviewPage } from "./ProjectOverviewPage.js";
import { AuthProvider } from "../../hooks/useAuth.js";
import { ToastProvider } from "../../hooks/useToast.js";
import { ProjectProvider } from "../../hooks/useProjectContext.js";
import { projectService } from "../../services/projectService.js";
import { phaseService } from "../../services/phaseService.js";
import { milestoneService } from "../../services/milestoneService.js";
import { userService } from "../../services/userService.js";

describe("Project Pages Integration Tests (Phase 6)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("ProjectsPage", () => {
    it("renders project directory and displays loaded project cards", async () => {
      vi.spyOn(projectService, "getProjects").mockResolvedValueOnce({
        success: true,
        data: [
          {
            _id: "p-1",
            code: "PRJ-BLR-001",
            name: "Metro Station Phase 2",
            location: "MG Road, Bengaluru",
            plannedStartDate: "2026-09-01",
            plannedEndDate: "2027-12-31",
            projectManagerId: {
              _id: "pm-1",
              name: "Anand Sen",
              email: "anand@smartbuild.com",
              primaryRole: "PROJECT_MANAGER",
            },
            status: "ACTIVE",
            health: "HEALTHY",
            healthFactors: [],
            progress: 45,
            createdAt: "2026-08-01",
            updatedAt: "2026-08-20",
          },
        ],
      });

      render(
        <BrowserRouter>
          <AuthProvider>
            <ToastProvider>
              <ProjectProvider>
                <ProjectsPage />
              </ProjectProvider>
            </ToastProvider>
          </AuthProvider>
        </BrowserRouter>
      );

      expect(screen.getByText(/Projects Directory/i)).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByText("Metro Station Phase 2")).toBeInTheDocument();
        expect(screen.getByText("PRJ-BLR-001")).toBeInTheDocument();
      });
    });
  });

  describe("CreateProjectPage", () => {
    it("renders project creation form and submits payload", async () => {
      vi.spyOn(projectService, "getProjectTypes").mockResolvedValue({
        success: true,
        data: [{ _id: "t-1", name: "Commercial", code: "COMMERCIAL" }],
      });
      vi.spyOn(projectService, "getProjectTemplates").mockResolvedValue({
        success: true,
        data: [],
      });
      vi.spyOn(userService, "getUsers").mockResolvedValue({
        success: true,
        data: [
          {
            id: "pm-1",
            name: "Anand Sen",
            email: "anand@smartbuild.com",
            primaryRole: "PROJECT_MANAGER",
            additionalPermissions: [],
            status: "ACTIVE",
          },
        ],
      });

      vi.spyOn(projectService, "createProject").mockResolvedValueOnce({
        success: true,
        data: {
          _id: "p-new",
          code: "PRJ-NEW-01",
          name: "Titan Complex",
          location: "Whitefield",
          plannedStartDate: "2026-09-01",
          plannedEndDate: "2027-09-01",
          projectManagerId: {
            _id: "pm-1",
            name: "Anand Sen",
            email: "anand@smartbuild.com",
            primaryRole: "PROJECT_MANAGER",
          },
          status: "PLANNING",
          health: "HEALTHY",
          healthFactors: [],
          progress: 0,
          createdAt: "2026-08-27",
          updatedAt: "2026-08-27",
        },
      });

      render(
        <BrowserRouter>
          <AuthProvider>
            <ToastProvider>
              <CreateProjectPage />
            </ToastProvider>
          </AuthProvider>
        </BrowserRouter>
      );

      expect(screen.getByText(/Initialize Capital Project/i)).toBeInTheDocument();

      // Wait for async selects to populate
      await screen.findByText("Commercial (COMMERCIAL)");

      fireEvent.change(screen.getByLabelText(/Project Code/i), {
        target: { value: "PRJ-NEW-01" },
      });
      fireEvent.change(screen.getByLabelText(/^Project Name/i), {
        target: { value: "Titan Complex" },
      });
      fireEvent.change(screen.getByLabelText(/Site Location/i), {
        target: { value: "Whitefield" },
      });
      fireEvent.change(screen.getByLabelText(/Planned Start Date/i), {
        target: { value: "2026-09-01" },
      });
      fireEvent.change(screen.getByLabelText(/Planned End Date/i), {
        target: { value: "2027-09-01" },
      });

      const submitBtn = screen.getByRole("button", { name: /Create & Initialize Project/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(projectService.createProject).toHaveBeenCalledWith(
          expect.objectContaining({
            code: "PRJ-NEW-01",
            name: "Titan Complex",
            location: "Whitefield",
          })
        );
      });
    });
  });

  describe("ProjectOverviewPage", () => {
    it("renders project metrics and team roster", async () => {
      vi.spyOn(projectService, "getProjectOverview").mockResolvedValueOnce({
        success: true,
        data: {
          project: {
            _id: "p-100",
            code: "PRJ-100",
            name: "Green Valley",
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
            progress: 30,
            createdAt: "2026-08-01",
            updatedAt: "2026-08-20",
          },
          teamCount: 4,
          daysRemaining: 250,
        },
      });

      vi.spyOn(projectService, "getProjectTeam").mockResolvedValueOnce({
        success: true,
        data: [
          {
            membershipId: "m-1",
            user: {
              id: "u-1",
              name: "Rahul Roy",
              email: "rahul@smartbuild.com",
              primaryRole: "SITE_ENGINEER",
            },
            assignedAt: "2026-08-01",
          },
        ],
      });

      vi.spyOn(phaseService, "getPhases").mockResolvedValue({
        success: true,
        data: [],
      });

      vi.spyOn(milestoneService, "getMilestones").mockResolvedValue({
        success: true,
        data: [],
      });

      render(
        <MemoryRouter initialEntries={["/projects/p-100"]}>
          <AuthProvider>
            <ToastProvider>
              <ProjectProvider>
                <Routes>
                  <Route path="/projects/:projectId" element={<ProjectOverviewPage />} />
                </Routes>
              </ProjectProvider>
            </ToastProvider>
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Green Valley (PRJ-100)")).toBeInTheDocument();
        expect(screen.getByText("Rahul Roy")).toBeInTheDocument();
        expect(screen.getByText("250 Days")).toBeInTheDocument();
      });
    });
  });
});
