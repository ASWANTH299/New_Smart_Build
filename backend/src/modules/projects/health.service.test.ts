import { describe, it, expect, vi, beforeEach } from "vitest";
import { HealthService } from "./health.service.js";
import { ProjectModel } from "./project.model.js";
import { TaskModel } from "../tasks/task.model.js";
import { MilestoneModel } from "../milestones/milestone.model.js";

describe("HealthService Unit Tests (Phase 7)", () => {
  let healthService: HealthService;

  beforeEach(() => {
    healthService = new HealthService();
    vi.restoreAllMocks();
  });

  it("should evaluate as HEALTHY when tasks and milestones are on schedule", async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 90);

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 10);

    const mockProject = {
      _id: "507f1f77bcf86cd799439011",
      name: "Healthy Project",
      progress: 50,
      plannedStartDate: pastDate,
      plannedEndDate: futureDate,
      health: "HEALTHY",
      healthFactors: [],
      save: vi.fn().mockResolvedValue(true),
    };

    vi.spyOn(ProjectModel, "findById").mockReturnValue({
      exec: vi.fn().mockResolvedValue(mockProject),
    } as unknown as ReturnType<typeof ProjectModel.findById>);

    vi.spyOn(TaskModel, "find")
      .mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue([]), // 0 overdue
      } as unknown as ReturnType<typeof TaskModel.find>)
      .mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue([]), // 0 blocked
      } as unknown as ReturnType<typeof TaskModel.find>);

    vi.spyOn(MilestoneModel, "find").mockReturnValue({
      select: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([]), // 0 missed
    } as unknown as ReturnType<typeof MilestoneModel.find>);

    const result = await healthService.evaluateProjectHealth("507f1f77bcf86cd799439011");

    expect(result.health).toBe("HEALTHY");
    expect(result.healthFactors).toContain("All milestones and tasks on schedule");
    expect(mockProject.save).toHaveBeenCalled();
  });

  it("should evaluate as CRITICAL when urgent tasks are overdue and milestones missed", async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 30);

    const mockProject = {
      _id: "507f1f77bcf86cd799439011",
      name: "Critical Project",
      progress: 10,
      plannedStartDate: pastDate,
      plannedEndDate: new Date(),
      health: "HEALTHY",
      healthFactors: [],
      save: vi.fn().mockResolvedValue(true),
    };

    vi.spyOn(ProjectModel, "findById").mockReturnValue({
      exec: vi.fn().mockResolvedValue(mockProject),
    } as unknown as ReturnType<typeof ProjectModel.findById>);

    vi.spyOn(TaskModel, "find")
      .mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue([{ title: "Critical Foundation", priority: "URGENT" }]), // 1 urgent overdue
      } as unknown as ReturnType<typeof TaskModel.find>)
      .mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue([{ title: "Blocked Pour", priority: "HIGH" }]), // 1 blocked
      } as unknown as ReturnType<typeof TaskModel.find>);

    vi.spyOn(MilestoneModel, "find").mockReturnValue({
      select: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([{ name: "Phase 1 Gate" }, { name: "Phase 2 Gate" }]), // 2 missed
    } as unknown as ReturnType<typeof MilestoneModel.find>);

    const result = await healthService.evaluateProjectHealth("507f1f77bcf86cd799439011");

    expect(result.health).toBe("CRITICAL");
    expect(result.healthFactors.some((f) => f.includes("overdue"))).toBe(true);
    expect(result.healthFactors.some((f) => f.includes("blocked"))).toBe(true);
  });
});
