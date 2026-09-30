import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { EquipmentListPage } from "./EquipmentListPage.js";
import { EquipmentDetailPage } from "./EquipmentDetailPage.js";
import { ProjectEquipmentPage } from "../projects/ProjectEquipmentPage.js";
import { equipmentService } from "../../services/equipmentService.js";
import { procurementService } from "../../services/procurementService.js";
import { taskService } from "../../services/taskService.js";

vi.mock("../../services/equipmentService.js");
vi.mock("../../services/procurementService.js");
vi.mock("../../services/taskService.js");
vi.mock("../../hooks/useAuth.js", () => ({
  useAuth: () => ({
    user: { id: "u-1", primaryRole: "ADMIN", name: "Admin User", email: "admin@smartbuild.com" },
    isAuthenticated: true,
  }),
  usePermissions: () => ({
    userRole: "ADMIN",
    isAdmin: true,
    isProjectManager: false,
    isSiteEngineer: false,
    isStoreManager: false,
    isContractor: false,
    isClient: false,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("../../hooks/useToast.js", () => ({
  useToast: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
  }),
  ToastProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("../../hooks/useProjectContext.js", () => ({
  useProjectContext: () => ({
    activeProject: { id: "p-1", code: "PRJ-001", name: "Metro Heights" },
    setActiveProject: vi.fn(),
  }),
  ProjectProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe("Equipment & Asset Management Integration Tests (Phase 11)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("EquipmentListPage", () => {
    it("renders equipment fleet and register button", async () => {
      vi.spyOn(equipmentService, "getEquipmentList").mockResolvedValue({
        success: true,
        data: [
          {
            _id: "eq-1",
            code: "EQ-EXC-001",
            name: "CAT 320 Hydraulic Excavator",
            category: "EARTHMOVING",
            ownershipType: "OWNED",
            status: "AVAILABLE",
            hourlyRate: 2500,
            currentLocation: "Main Equipment Yard",
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
        <MemoryRouter initialEntries={["/equipment"]}>
          <Routes>
            <Route path="/equipment" element={<EquipmentListPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Equipment & Asset Fleet Management")).toBeInTheDocument();
        expect(screen.getAllByText("CAT 320 Hydraulic Excavator")[0]).toBeInTheDocument();
        expect(screen.getAllByText("EQ-EXC-001")[0]).toBeInTheDocument();
        expect(screen.getByText("+ Register Equipment")).toBeInTheDocument();
      });
    });
  });

  describe("EquipmentDetailPage", () => {
    it("renders equipment specifications and action buttons", async () => {
      vi.spyOn(equipmentService, "getEquipmentById").mockResolvedValue({
        success: true,
        data: {
          equipment: {
            _id: "eq-1",
            code: "EQ-EXC-001",
            name: "CAT 320 Hydraulic Excavator",
            category: "EARTHMOVING",
            ownershipType: "OWNED",
            status: "AVAILABLE",
            make: "Caterpillar",
            modelNumber: "320D",
            serialNumber: "CAT320D88910",
            hourlyRate: 2500,
            currentLocation: "Main Yard",
            notes: "Heavy excavator",
            createdAt: "2026-09-02",
            updatedAt: "2026-09-02",
          },
          activeAssignments: [],
          assignmentHistory: [],
          maintenanceRecords: [],
          inspections: [],
        },
      });

      render(
        <MemoryRouter initialEntries={["/equipment/eq-1"]}>
          <Routes>
            <Route path="/equipment/:equipmentId" element={<EquipmentDetailPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getAllByText("CAT 320 Hydraulic Excavator")[0]).toBeInTheDocument();
        expect(screen.getAllByText("EQ-EXC-001")[0]).toBeInTheDocument();
        expect(screen.getByText("Report Breakdown")).toBeInTheDocument();
        expect(screen.getByText("Schedule Service")).toBeInTheDocument();
        expect(screen.getByText("Safety Inspection")).toBeInTheDocument();
      });
    });
  });

  describe("ProjectEquipmentPage", () => {
    it("renders project machinery roster and deployment actions", async () => {
      vi.spyOn(equipmentService, "getProjectEquipment").mockResolvedValue({
        success: true,
        data: [
          {
            _id: "ea-1",
            equipmentId: {
              _id: "eq-1",
              code: "EQ-EXC-001",
              name: "CAT 320 Hydraulic Excavator",
              category: "EARTHMOVING",
              status: "ASSIGNED",
              hourlyRate: 2500,
              ownershipType: "OWNED",
              createdAt: "2026-09-02",
              updatedAt: "2026-09-02",
            },
            projectId: "p-1",
            startDate: "2026-09-10",
            endDate: "2026-09-20",
            status: "ACTIVE",
            createdBy: { _id: "u-1", name: "Admin", email: "admin@smartbuild.com" },
            createdAt: "2026-09-02",
            updatedAt: "2026-09-02",
          },
        ],
      });

      vi.spyOn(equipmentService, "getEquipmentList").mockResolvedValue({
        success: true,
        data: [],
      });
      vi.spyOn(taskService, "getTasks").mockResolvedValue({ success: true, data: [] });

      render(
        <MemoryRouter initialEntries={["/projects/p-1/equipment"]}>
          <Routes>
            <Route path="/projects/:projectId/equipment" element={<ProjectEquipmentPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Site Equipment & Heavy Machinery")).toBeInTheDocument();
        expect(screen.getAllByText("CAT 320 Hydraulic Excavator")[0]).toBeInTheDocument();
        expect(screen.getByText("+ Deploy Equipment")).toBeInTheDocument();
      });
    });
  });
});
