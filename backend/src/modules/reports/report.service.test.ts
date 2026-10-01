import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import { reportService } from "./report.service.js";
import { ProjectModel } from "../projects/project.model.js";
import { PhaseModel } from "../phases/phase.model.js";
import { TaskModel } from "../tasks/task.model.js";
import { MilestoneModel } from "../milestones/milestone.model.js";
import { Budget } from "../budget/budget.model.js";
import { Expense } from "../budget/expense.model.js";
import { BOMItemModel } from "../bom/bomItem.model.js";
import { WorkforceAssignment } from "../workforce/workforceAssignment.model.js";
import { Attendance } from "../attendance/attendance.model.js";
import { Issue } from "../issues/issue.model.js";

vi.mock("../projects/project.model.js");
vi.mock("../phases/phase.model.js");
vi.mock("../tasks/task.model.js");
vi.mock("../milestones/milestone.model.js");
vi.mock("../budget/budget.model.js");
vi.mock("../budget/expense.model.js");
vi.mock("../bom/bomItem.model.js");
vi.mock("../workforce/workforceAssignment.model.js");
vi.mock("../attendance/attendance.model.js");
vi.mock("../issues/issue.model.js");

describe("ReportService Unit Tests (Phase 18)", () => {
  const projectId = new mongoose.Types.ObjectId().toString();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getProjectAnalytics", () => {
    it("should compute and aggregate analytics across operational domains", async () => {
      const mockProject = {
        _id: new mongoose.Types.ObjectId(projectId),
        code: "PRJ-2026-001",
        name: "Skyline Commercial Complex",
        status: "ACTIVE",
        health: "HEALTHY",
        location: "Bengaluru, India",
        plannedStartDate: new Date("2026-01-01"),
        plannedEndDate: new Date("2026-12-31"),
        progress: 45,
      };

      vi.spyOn(ProjectModel, "findById").mockResolvedValue(mockProject as any);

      // Phases
      vi.spyOn(PhaseModel, "find").mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          { _id: new mongoose.Types.ObjectId(), name: "Substructure", status: "COMPLETED" },
          { _id: new mongoose.Types.ObjectId(), name: "Superstructure", status: "IN_PROGRESS" },
        ]),
      } as any);

      // Tasks
      vi.spyOn(TaskModel, "find").mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          {
            _id: new mongoose.Types.ObjectId(),
            title: "Foundation Footing",
            status: "COMPLETED",
            plannedEndDate: new Date("2026-03-01"),
          },
          {
            _id: new mongoose.Types.ObjectId(),
            title: "Column Pouring",
            status: "IN_PROGRESS",
            plannedEndDate: new Date("2026-11-01"),
          },
          {
            _id: new mongoose.Types.ObjectId(),
            title: "Plinth Beam",
            status: "TODO",
            plannedEndDate: new Date("2026-02-01"), // Delayed
          },
        ]),
      } as any);

      // Milestones
      vi.spyOn(MilestoneModel, "find").mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          { _id: new mongoose.Types.ObjectId(), title: "Excavation Done", status: "ACHIEVED" },
          { _id: new mongoose.Types.ObjectId(), title: "Ground Floor Slab", status: "PENDING" },
        ]),
      } as any);

      // Budget
      vi.spyOn(Budget, "findOne").mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          totalAmount: 500000,
          actualAmount: 150000,
          categories: [
            { category: "MATERIAL", plannedAmount: 300000, actualAmount: 100000 },
            { category: "LABOR", plannedAmount: 200000, actualAmount: 50000 },
          ],
        }),
      } as any);

      // Expenses
      vi.spyOn(Expense, "find").mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          { category: "MATERIAL", amount: 100000, status: "APPROVED" },
          { category: "LABOR", amount: 50000, status: "APPROVED" },
        ]),
      } as any);

      // BOM Items
      vi.spyOn(BOMItemModel, "find").mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          { quantityRequired: 100, quantityProcured: 100 },
          { quantityRequired: 50, quantityProcured: 20 }, // Low stock
        ]),
      } as any);

      // Workforce
      vi.spyOn(WorkforceAssignment, "find").mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          { _id: new mongoose.Types.ObjectId(), status: "ACTIVE" },
          { _id: new mongoose.Types.ObjectId(), status: "ACTIVE" },
        ]),
      } as any);

      // Attendance
      vi.spyOn(Attendance, "find").mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          { date: "2026-09-28", status: "PRESENT" },
          { date: "2026-09-29", status: "PRESENT" },
        ]),
      } as any);

      vi.spyOn(Attendance, "countDocuments").mockResolvedValue(2 as any);

      // Issues
      vi.spyOn(Issue, "find").mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          { _id: new mongoose.Types.ObjectId(), priority: "CRITICAL", status: "OPEN" },
          { _id: new mongoose.Types.ObjectId(), priority: "MEDIUM", status: "RESOLVED" },
        ]),
      } as any);

      const result = await reportService.getProjectAnalytics(projectId);

      // Progress Assertions
      expect(result.progress.totalTasks).toBe(3);
      expect(result.progress.completedTasks).toBe(1);
      expect(result.progress.delayedTasks).toBe(1);
      expect(result.milestones.totalMilestones).toBe(2);
      expect(result.milestones.achievedMilestones).toBe(1);
      expect(result.milestones.milestoneHealth).toBe(50);

      // Budget Assertions
      expect(result.budget.totalPlanned).toBe(500000);
      expect(result.budget.totalActual).toBe(150000);
      expect(result.budget.remainingBalance).toBe(350000);
      expect(result.budget.burnRate).toBe(30);

      // Materials & Workforce Assertions
      expect(result.materials.totalItems).toBe(2);
      expect(result.materials.lowStockCount).toBe(1);
      expect(result.workforce.totalWorkers).toBe(2);

      // Issues Assertions
      expect(result.issues.totalIssues).toBe(2);
      expect(result.issues.openIssues).toBe(1);
      expect(result.issues.resolvedIssues).toBe(1);
      expect(result.issues.criticalHazardCount).toBe(1);
    });

    it("should throw 404 when project does not exist", async () => {
      vi.spyOn(ProjectModel, "findById").mockResolvedValue(null);

      await expect(reportService.getProjectAnalytics(projectId)).rejects.toThrow(
        "Project not found"
      );
    });

    it("should throw 400 when invalid projectId passed", async () => {
      await expect(reportService.getProjectAnalytics("invalid-id")).rejects.toThrow(
        "Invalid project ID"
      );
    });
  });

  describe("generateProjectSummaryReport", () => {
    it("should export report as CSV formatted string", async () => {
      const mockProject = {
        _id: new mongoose.Types.ObjectId(projectId),
        code: "PRJ-2026-001",
        name: "Skyline Commercial Complex",
        status: "ACTIVE",
        health: "HEALTHY",
        location: "Bengaluru, India",
        plannedStartDate: new Date("2026-01-01"),
        plannedEndDate: new Date("2026-12-31"),
        progress: 45,
      };

      vi.spyOn(ProjectModel, "findById").mockResolvedValue(mockProject as any);
      vi.spyOn(PhaseModel, "find").mockReturnValue({ lean: vi.fn().mockResolvedValue([]) } as any);
      vi.spyOn(TaskModel, "find").mockReturnValue({ lean: vi.fn().mockResolvedValue([]) } as any);
      vi.spyOn(MilestoneModel, "find").mockReturnValue({ lean: vi.fn().mockResolvedValue([]) } as any);
      vi.spyOn(Budget, "findOne").mockReturnValue({ lean: vi.fn().mockResolvedValue(null) } as any);
      vi.spyOn(Expense, "find").mockReturnValue({ lean: vi.fn().mockResolvedValue([]) } as any);
      vi.spyOn(BOMItemModel, "find").mockReturnValue({ lean: vi.fn().mockResolvedValue([]) } as any);
      vi.spyOn(WorkforceAssignment, "find").mockReturnValue({ lean: vi.fn().mockResolvedValue([]) } as any);
      vi.spyOn(Attendance, "find").mockReturnValue({ lean: vi.fn().mockResolvedValue([]) } as any);
      vi.spyOn(Attendance, "countDocuments").mockResolvedValue(0 as any);
      vi.spyOn(Issue, "find").mockReturnValue({ lean: vi.fn().mockResolvedValue([]) } as any);

      const result = await reportService.generateProjectSummaryReport(projectId, "csv");

      expect(result.format).toBe("csv");
      expect(result.csv).toBeDefined();
      expect(result.csv).toContain("SMART BUILD - PROJECT OPERATIONAL SUMMARY REPORT");
      expect(result.csv).toContain("PRJ-2026-001");
      expect(result.csv).toContain("PROGRESS & SCHEDULE");
      expect(result.csv).toContain("FINANCIAL & BUDGET BREAKDOWN");
      expect(result.csv).toContain("WORKFORCE & ATTENDANCE");
      expect(result.csv).toContain("ISSUES & SITE HAZARDS");
    });
  });
});
