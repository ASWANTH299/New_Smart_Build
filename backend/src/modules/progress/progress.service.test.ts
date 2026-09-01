import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProgressService } from "./progress.service.js";
import { TaskModel } from "../tasks/task.model.js";
import { PhaseModel } from "../phases/phase.model.js";
import { ProjectModel } from "../projects/project.model.js";
import { ProgressRecordModel, IProgressRecord } from "./progressRecord.model.js";
import { healthService } from "../projects/health.service.js";
import { AuditLogModel, IAuditLog } from "../audit/auditLog.model.js";
import { BadRequestError } from "../../utils/AppError.js";

describe("ProgressService Unit & Rollup Tests (Phase 7 & Fixes)", () => {
  let progressService: ProgressService;

  beforeEach(() => {
    progressService = new ProgressService();
    vi.restoreAllMocks();
  });

  describe("Quantity-based Task Progress Calculation", () => {
    it("should calculate exact percentage (e.g. 6500 / 10000 = 65%)", () => {
      const result = progressService.calculateTaskProgress(10000, 6500);
      expect(result).toBe(65);
    });

    it("should handle decimal quantities with 2-decimal precision (e.g. 33.333 / 100)", () => {
      const result = progressService.calculateTaskProgress(100, 33.333);
      expect(result).toBe(33.33);
    });

    it("should return 0 when completed quantity is 0", () => {
      const result = progressService.calculateTaskProgress(500, 0);
      expect(result).toBe(0);
    });

    it("should cap at 100% when completed equals planned (e.g. 100.01 / 100.01)", () => {
      const result = progressService.calculateTaskProgress(100.01, 100.01);
      expect(result).toBe(100);
    });

    it("should return 100% when plannedQuantity is 0 and status is COMPLETED", () => {
      const result = progressService.calculateTaskProgress(0, 0, "COMPLETED");
      expect(result).toBe(100);
    });
  });

  describe("Hierarchical Progress Rollup & Progress Logging", () => {
    it("should log progress, create immutable record, update task, and roll up through phase and project", async () => {
      const mockTask = {
        _id: "507f1f77bcf86cd799439020",
        projectId: "507f1f77bcf86cd799439011",
        phaseId: "507f1f77bcf86cd799439015",
        title: "Excavation",
        plannedQuantity: 1000,
        unit: "cu.m",
        completedQuantity: 0,
        progress: 0,
        status: "TODO",
        actualStartDate: null as Date | null,
        actualEndDate: null as Date | null,
        completedAt: null as Date | null,
        save: vi.fn().mockResolvedValue(true),
      };

      const mockPhase = {
        _id: "507f1f77bcf86cd799439015",
        projectId: "507f1f77bcf86cd799439011",
        name: "Substructure",
        status: "NOT_STARTED",
        progress: 0,
        actualStartDate: null as Date | null,
        actualEndDate: null as Date | null,
        save: vi.fn().mockResolvedValue(true),
      };

      const mockProject = {
        _id: "507f1f77bcf86cd799439011",
        name: "Project A",
        progress: 0,
        health: "HEALTHY",
        healthFactors: [],
        plannedStartDate: new Date("2026-09-01"),
        plannedEndDate: new Date("2027-09-01"),
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(TaskModel, "findOne").mockReturnValue({
        exec: vi.fn().mockResolvedValue(mockTask),
      } as unknown as ReturnType<typeof TaskModel.findOne>);

      vi.spyOn(ProgressRecordModel, "create").mockResolvedValue({
        _id: "507f1f77bcf86cd799439099",
        completedQuantity: 500,
      } as unknown as IProgressRecord);

      vi.spyOn(PhaseModel, "findById").mockReturnValue({
        exec: vi.fn().mockResolvedValue(mockPhase),
      } as unknown as ReturnType<typeof PhaseModel.findById>);

      vi.spyOn(TaskModel, "find").mockReturnValue({
        select: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue([{ progress: 50 }]),
      } as unknown as ReturnType<typeof TaskModel.find>);

      vi.spyOn(ProjectModel, "findById").mockReturnValue({
        exec: vi.fn().mockResolvedValue(mockProject),
      } as unknown as ReturnType<typeof ProjectModel.findById>);

      vi.spyOn(PhaseModel, "find").mockReturnValue({
        select: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue([{ progress: 50 }]),
      } as unknown as ReturnType<typeof PhaseModel.find>);

      vi.spyOn(healthService, "evaluateProjectHealth").mockResolvedValue({
        health: "HEALTHY",
        healthFactors: [],
        metrics: {
          progress: 50,
          overdueTasksCount: 0,
          blockedTasksCount: 0,
          missedMilestonesCount: 0,
          daysToDeadline: 90,
          expectedProgress: 50,
        },
      });

      vi.spyOn(AuditLogModel, "create").mockResolvedValue({} as unknown as IAuditLog);

      const result = await progressService.logProgress(
        "507f1f77bcf86cd799439011",
        "507f1f77bcf86cd799439020",
        { completedQuantity: 500, notes: "Half excavation done" },
        "507f1f77bcf86cd799439001"
      );

      expect(result.task.completedQuantity).toBe(500);
      expect(result.task.progress).toBe(50);
      expect(result.task.status).toBe("IN_PROGRESS");
      expect(mockPhase.progress).toBe(50);
      expect(mockPhase.status).toBe("IN_PROGRESS");
      expect(mockProject.progress).toBe(50);
      expect(ProgressRecordModel.create).toHaveBeenCalled();
    });

    it("should auto-reconcile status to COMPLETED when 100% quantity is logged", async () => {
      const mockTask = {
        _id: "507f1f77bcf86cd799439020",
        projectId: "507f1f77bcf86cd799439011",
        phaseId: "507f1f77bcf86cd799439015",
        title: "Slab Casting",
        plannedQuantity: 100.01,
        unit: "sq.ft",
        completedQuantity: 50,
        progress: 50,
        status: "IN_PROGRESS",
        actualStartDate: new Date("2026-09-01"),
        actualEndDate: null as Date | null,
        completedAt: null as Date | null,
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(TaskModel, "findOne").mockReturnValue({
        exec: vi.fn().mockResolvedValue(mockTask),
      } as unknown as ReturnType<typeof TaskModel.findOne>);

      vi.spyOn(ProgressRecordModel, "create").mockResolvedValue({} as any);
      vi.spyOn(PhaseModel, "findById").mockReturnValue({
        exec: vi.fn().mockResolvedValue(null),
      } as unknown as ReturnType<typeof PhaseModel.findById>);
      vi.spyOn(ProjectModel, "findById").mockReturnValue({
        exec: vi.fn().mockResolvedValue(null),
      } as unknown as ReturnType<typeof ProjectModel.findById>);
      vi.spyOn(AuditLogModel, "create").mockResolvedValue({} as any);

      const result = await progressService.logProgress(
        "507f1f77bcf86cd799439011",
        "507f1f77bcf86cd799439020",
        { completedQuantity: 100.01 },
        "507f1f77bcf86cd799439001"
      );

      expect(result.task.completedQuantity).toBe(100.01);
      expect(result.task.progress).toBe(100);
      expect(result.task.status).toBe("COMPLETED");
      expect(result.task.completedAt).not.toBeNull();
    });

    it("should reject negative completed quantity with BadRequestError", async () => {
      const mockTask = {
        _id: "507f1f77bcf86cd799439020",
        plannedQuantity: 1000,
        unit: "cu.m",
      };

      vi.spyOn(TaskModel, "findOne").mockReturnValue({
        exec: vi.fn().mockResolvedValue(mockTask),
      } as unknown as ReturnType<typeof TaskModel.findOne>);

      await expect(
        progressService.logProgress(
          "507f1f77bcf86cd799439011",
          "507f1f77bcf86cd799439020",
          { completedQuantity: -50 },
          "507f1f77bcf86cd799439001"
        )
      ).rejects.toThrow(BadRequestError);
    });

    it("should reject completed quantity exceeding planned quantity with BadRequestError", async () => {
      const mockTask = {
        _id: "507f1f77bcf86cd799439020",
        plannedQuantity: 100,
        unit: "sq.ft",
      };

      vi.spyOn(TaskModel, "findOne").mockReturnValue({
        exec: vi.fn().mockResolvedValue(mockTask),
      } as unknown as ReturnType<typeof TaskModel.findOne>);

      await expect(
        progressService.logProgress(
          "507f1f77bcf86cd799439011",
          "507f1f77bcf86cd799439020",
          { completedQuantity: 150 },
          "507f1f77bcf86cd799439001"
        )
      ).rejects.toThrow(BadRequestError);
    });
  });
});
