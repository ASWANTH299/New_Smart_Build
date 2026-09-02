import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { WorkerListPage } from "./WorkerListPage.js";
import { WorkerDetailPage } from "./WorkerDetailPage.js";
import { ProjectWorkforcePage } from "../projects/ProjectWorkforcePage.js";
import { AttendancePage } from "../projects/AttendancePage.js";
import { workforceService } from "../../services/workforceService.js";
import { procurementService } from "../../services/procurementService.js";
import { phaseService } from "../../services/phaseService.js";
import { taskService } from "../../services/taskService.js";
import { AuthProvider } from "../../hooks/useAuth.js";
import { ToastProvider } from "../../hooks/useToast.js";
import { ProjectProvider } from "../../hooks/useProjectContext.js";

vi.mock("../../services/workforceService.js");
vi.mock("../../services/procurementService.js");
vi.mock("../../services/phaseService.js");
vi.mock("../../services/taskService.js");

describe("Workforce & Attendance Integration Tests (Phase 10)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem(
      "smartbuild_auth_user",
      JSON.stringify({
        id: "u-1",
        name: "Admin User",
        email: "admin@smartbuild.com",
        primaryRole: "ADMIN",
        additionalRoles: [],
        effectivePermissions: ["all"],
      })
    );
    localStorage.setItem("smartbuild_auth_token", "fake-jwt-token");
  });

  describe("WorkerListPage", () => {
    it("renders worker catalog and register button", async () => {
      vi.spyOn(workforceService, "getWorkers").mockResolvedValue({
        success: true,
        data: [
          {
            _id: "w-1",
            name: "Ramesh Kumar",
            trade: "MASON",
            workerType: "DIRECT",
            status: "ACTIVE",
            contact: { phone: "+91 9876543210" },
            createdAt: "2026-09-02",
            updatedAt: "2026-09-02",
          },
        ],
      });

      vi.spyOn(procurementService, "getVendors").mockResolvedValue({
        success: true,
        data: [],
      });

      render(
        <MemoryRouter initialEntries={["/workforce"]}>
          <AuthProvider>
            <ToastProvider>
              <Routes>
                <Route path="/workforce" element={<WorkerListPage />} />
              </Routes>
            </ToastProvider>
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Workforce & Labor Management")).toBeInTheDocument();
        expect(screen.getByText("Ramesh Kumar")).toBeInTheDocument();
        expect(screen.getByText("Mason")).toBeInTheDocument();
        expect(screen.getByText("+ Register Worker")).toBeInTheDocument();
      });
    });
  });

  describe("WorkerDetailPage", () => {
    it("renders worker profile and assignment history", async () => {
      vi.spyOn(workforceService, "getWorkerById").mockResolvedValue({
        success: true,
        data: {
          worker: {
            _id: "w-1",
            name: "Ramesh Kumar",
            trade: "MASON",
            workerType: "DIRECT",
            status: "ACTIVE",
            contact: { phone: "+91 9876543210", email: "ramesh@example.com" },
            notes: "Master bricklayer",
            createdAt: "2026-09-02",
            updatedAt: "2026-09-02",
          },
          activeAssignments: [
            {
              _id: "a-1",
              projectId: { _id: "p-1", name: "Metro Heights", code: "PRJ-001" },
              workerId: "w-1",
              assignedBy: { email: "admin@smartbuild.com" },
              startDate: "2026-09-01",
              status: "ACTIVE",
              createdAt: "2026-09-01",
              updatedAt: "2026-09-01",
            },
          ],
          assignmentHistory: [],
        },
      });

      vi.spyOn(procurementService, "getVendors").mockResolvedValue({
        success: true,
        data: [],
      });

      render(
        <MemoryRouter initialEntries={["/workforce/w-1"]}>
          <AuthProvider>
            <ToastProvider>
              <Routes>
                <Route path="/workforce/:workerId" element={<WorkerDetailPage />} />
              </Routes>
            </ToastProvider>
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Ramesh Kumar")).toBeInTheDocument();
        expect(screen.getByText("Mason")).toBeInTheDocument();
        expect(screen.getByText("Metro Heights (PRJ-001)")).toBeInTheDocument();
      });
    });
  });

  describe("ProjectWorkforcePage", () => {
    it("renders project workforce assignments", async () => {
      vi.spyOn(workforceService, "getProjectWorkforce").mockResolvedValue({
        success: true,
        data: [
          {
            _id: "a-1",
            projectId: "p-1",
            workerId: {
              _id: "w-1",
              name: "Ramesh Kumar",
              trade: "MASON",
              workerType: "DIRECT",
              status: "ACTIVE",
              createdAt: "2026-09-01",
              updatedAt: "2026-09-01",
            },
            assignedBy: { email: "admin@smartbuild.com" },
            startDate: "2026-09-01",
            status: "ACTIVE",
            createdAt: "2026-09-01",
            updatedAt: "2026-09-01",
          },
        ],
      });

      vi.spyOn(workforceService, "getWorkers").mockResolvedValue({
        success: true,
        data: [],
      });
      vi.spyOn(phaseService, "getPhases").mockResolvedValue({ success: true, data: [] });
      vi.spyOn(taskService, "getTasks").mockResolvedValue({ success: true, data: [] });

      render(
        <MemoryRouter initialEntries={["/projects/p-1/workforce"]}>
          <AuthProvider>
            <ToastProvider>
              <ProjectProvider>
                <Routes>
                  <Route path="/projects/:projectId/workforce" element={<ProjectWorkforcePage />} />
                </Routes>
              </ProjectProvider>
            </ToastProvider>
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Project Workforce & Trade Assignments")).toBeInTheDocument();
        expect(screen.getByText("Ramesh Kumar")).toBeInTheDocument();
      });
    });
  });

  describe("AttendancePage", () => {
    it("renders daily attendance sheet grid and saves attendance", async () => {
      vi.spyOn(workforceService, "getProjectWorkforce").mockResolvedValue({
        success: true,
        data: [
          {
            _id: "a-1",
            projectId: "p-1",
            workerId: {
              _id: "w-1",
              name: "Ramesh Kumar",
              trade: "MASON",
              workerType: "DIRECT",
              status: "ACTIVE",
              createdAt: "2026-09-01",
              updatedAt: "2026-09-01",
            },
            assignedBy: { email: "admin@smartbuild.com" },
            startDate: "2026-09-01",
            status: "ACTIVE",
            createdAt: "2026-09-01",
            updatedAt: "2026-09-01",
          },
        ],
      });

      vi.spyOn(workforceService, "getProjectAttendance").mockResolvedValue({
        success: true,
        data: [
          {
            _id: "att-1",
            projectId: "p-1",
            workerId: "w-1",
            date: "2026-09-02",
            status: "PRESENT",
            workingHours: 8,
            overtimeHours: 0,
            recordedBy: { email: "admin@smartbuild.com" },
            createdAt: "2026-09-02",
            updatedAt: "2026-09-02",
          },
        ],
      });

      render(
        <MemoryRouter initialEntries={["/projects/p-1/attendance"]}>
          <AuthProvider>
            <ToastProvider>
              <ProjectProvider>
                <Routes>
                  <Route path="/projects/:projectId/attendance" element={<AttendancePage />} />
                </Routes>
              </ProjectProvider>
            </ToastProvider>
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Daily Site Attendance & Time Tracking")).toBeInTheDocument();
        expect(screen.getByText("Ramesh Kumar")).toBeInTheDocument();
        expect(screen.getByText("8 hrs")).toBeInTheDocument();
      });
    });
  });
});
