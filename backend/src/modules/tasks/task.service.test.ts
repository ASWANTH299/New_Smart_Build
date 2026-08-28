import { describe, it, expect, vi, beforeEach } from "vitest";
import { TaskService } from "./task.service.js";
import { TaskModel, ITask } from "./task.model.js";
import { PhaseModel } from "../phases/phase.model.js";
import { progressService } from "../progress/progress.service.js";
import { AuditLogModel, IAuditLog } from "../audit/auditLog.model.js";
import { BadRequestError } from "../../utils/AppError.js";

describe("TaskService & Dependency Validation Tests (Phase 7)", () => {
  let taskService: TaskService;

  beforeEach(() => {
    taskService = new TaskService();
    vi.restoreAllMocks();
  });

  it("should create task with planned quantity and unit", async () => {
    vi.spyOn(PhaseModel, "findOne").mockReturnValue({
      exec: vi.fn().mockResolvedValue({ _id: "507f1f77bcf86cd799439015" }),
    } as unknown as ReturnType<typeof PhaseModel.findOne>);

    const mockTask = {
      _id: "507f1f77bcf86cd799439020",
      title: "Rebar Installation",
      plannedQuantity: 50,
      unit: "tonnes",
      completedQuantity: 0,
      progress: 0,
      status: "TODO",
    };

    vi.spyOn(TaskModel, "create").mockResolvedValue(mockTask as unknown as ITask);
    vi.spyOn(progressService, "recalculatePhaseProgress").mockResolvedValue(0);
    vi.spyOn(progressService, "recalculateProjectProgress").mockResolvedValue(0);
    vi.spyOn(AuditLogModel, "create").mockResolvedValue({} as unknown as IAuditLog);

    const result = await taskService.createTask(
      "507f1f77bcf86cd799439011",
      {
        phaseId: "507f1f77bcf86cd799439015",
        title: "Rebar Installation",
        plannedQuantity: 50,
        unit: "tonnes",
        plannedStartDate: "2026-09-01",
        plannedEndDate: "2026-09-15",
      },
      "507f1f77bcf86cd799439001"
    );

    expect(result.title).toBe("Rebar Installation");
    expect(result.plannedQuantity).toBe(50);
    expect(result.unit).toBe("tonnes");
  });

  it("should enforce Finish-to-Start dependency check when transitioning to IN_PROGRESS", async () => {
    const mockTask = {
      _id: "507f1f77bcf86cd799439020",
      projectId: "507f1f77bcf86cd799439011",
      phaseId: "507f1f77bcf86cd799439015",
      title: "Slab Casting",
      dependencies: ["507f1f77bcf86cd799439019"],
      status: "TODO",
      save: vi.fn().mockResolvedValue(true),
    };

    vi.spyOn(TaskModel, "findOne").mockReturnValue({
      exec: vi.fn().mockResolvedValue(mockTask),
    } as unknown as ReturnType<typeof TaskModel.findOne>);

    // Dependent task is still IN_PROGRESS (not COMPLETED)
    vi.spyOn(TaskModel, "find").mockReturnValue({
      exec: vi.fn().mockResolvedValue([
        {
          _id: "507f1f77bcf86cd799439019",
          title: "Formwork Assembly",
          status: "IN_PROGRESS",
        },
      ]),
    } as unknown as ReturnType<typeof TaskModel.find>);

    await expect(
      taskService.updateTask(
        "507f1f77bcf86cd799439011",
        "507f1f77bcf86cd799439020",
        { status: "IN_PROGRESS" },
        "507f1f77bcf86cd799439001"
      )
    ).rejects.toThrow(BadRequestError);
  });
});
