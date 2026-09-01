import { describe, it, expect, vi, beforeEach } from "vitest";
import { PhaseService } from "./phase.service.js";
import { PhaseModel, IPhase } from "./phase.model.js";
import { TaskModel } from "../tasks/task.model.js";
import { ProjectModel } from "../projects/project.model.js";
import { progressService } from "../progress/progress.service.js";
import { AuditLogModel, IAuditLog } from "../audit/auditLog.model.js";
import { BadRequestError, NotFoundError } from "../../utils/AppError.js";

describe("PhaseService Unit Tests (Phase 7)", () => {
  let phaseService: PhaseService;

  beforeEach(() => {
    phaseService = new PhaseService();
    vi.restoreAllMocks();
  });

  it("should create phase and auto-increment sequence", async () => {
    vi.spyOn(ProjectModel, "findById").mockReturnValue({
      exec: vi.fn().mockResolvedValue({ _id: "507f1f77bcf86cd799439011" }),
    } as unknown as ReturnType<typeof ProjectModel.findById>);

    vi.spyOn(PhaseModel, "findOne").mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue({ sequence: 2 }),
    } as unknown as ReturnType<typeof PhaseModel.findOne>);

    const mockPhase = {
      _id: "507f1f77bcf86cd799439015",
      name: "Superstructure",
      sequence: 3,
      progress: 0,
      status: "NOT_STARTED",
    };

    vi.spyOn(PhaseModel, "create").mockResolvedValue(mockPhase as unknown as IPhase);
    vi.spyOn(progressService, "recalculateProjectProgress").mockResolvedValue(0);
    vi.spyOn(AuditLogModel, "create").mockResolvedValue({} as unknown as IAuditLog);

    const result = await phaseService.createPhase(
      "507f1f77bcf86cd799439011",
      {
        name: "Superstructure",
        plannedStartDate: "2026-10-01",
        plannedEndDate: "2027-01-01",
      },
      "507f1f77bcf86cd799439001"
    );

    expect(result.name).toBe("Superstructure");
    expect(result.sequence).toBe(3);
    expect(AuditLogModel.create).toHaveBeenCalled();
  });

  it("should initialize default construction phases when none exist", async () => {
    vi.spyOn(ProjectModel, "findById").mockReturnValue({
      exec: vi.fn().mockResolvedValue({
        _id: "507f1f77bcf86cd799439011",
        plannedStartDate: new Date("2026-01-01"),
        plannedEndDate: new Date("2026-12-31"),
      }),
    } as unknown as ReturnType<typeof ProjectModel.findById>);

    vi.spyOn(PhaseModel, "find").mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([]),
    } as unknown as ReturnType<typeof PhaseModel.find>);

    vi.spyOn(PhaseModel, "create").mockImplementation(async (doc: any) => ({
      _id: "phase-" + doc.sequence,
      ...doc,
    }) as any);

    vi.spyOn(progressService, "recalculateProjectProgress").mockResolvedValue(0);
    vi.spyOn(AuditLogModel, "create").mockResolvedValue({} as unknown as IAuditLog);

    const phases = await phaseService.initializeDefaultPhases(
      "507f1f77bcf86cd799439011",
      "507f1f77bcf86cd799439001"
    );

    expect(phases.length).toBe(4);
    expect(phases[0].name).toBe("Substructure & Deep Foundation");
    expect(phases[1].name).toBe("Superstructure Concrete Frame");
    expect(phases[2].name).toBe("Finishing, Facade & MEP Works");
    expect(phases[3].name).toBe("Testing, Commissioning & Handover");
  });

  it("should retrieve existing phase by valid projectId and phaseId", async () => {
    const mockPhase = {
      _id: "507f1f77bcf86cd799439015",
      projectId: "507f1f77bcf86cd799439011",
      name: "Substructure",
      sequence: 1,
      status: "COMPLETED",
      progress: 100,
    };

    vi.spyOn(PhaseModel, "findOne").mockReturnValue({
      populate: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue(mockPhase),
    } as unknown as ReturnType<typeof PhaseModel.findOne>);

    const result = await phaseService.getPhaseById(
      "507f1f77bcf86cd799439011",
      "507f1f77bcf86cd799439015"
    );

    expect(result._id).toBe("507f1f77bcf86cd799439015");
    expect(result.name).toBe("Substructure");
  });

  it("should throw NotFoundError when phase does not exist or belongs to another project", async () => {
    vi.spyOn(PhaseModel, "findOne").mockReturnValue({
      populate: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue(null),
    } as unknown as ReturnType<typeof PhaseModel.findOne>);

    await expect(
      phaseService.getPhaseById("507f1f77bcf86cd799439011", "507f1f77bcf86cd799439099")
    ).rejects.toThrow(NotFoundError);
  });

  it("should prevent phase deletion if child tasks exist", async () => {
    vi.spyOn(TaskModel, "countDocuments").mockReturnValue({
      exec: vi.fn().mockResolvedValue(4),
    } as unknown as ReturnType<typeof TaskModel.countDocuments>);

    await expect(
      phaseService.deletePhase(
        "507f1f77bcf86cd799439011",
        "507f1f77bcf86cd799439015",
        "507f1f77bcf86cd799439001"
      )
    ).rejects.toThrow(BadRequestError);
  });
});
