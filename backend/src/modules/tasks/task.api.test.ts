import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { UserModel } from "../users/user.model.js";
import { PhaseModel } from "../phases/phase.model.js";
import { TaskModel, ITask } from "./task.model.js";
import { ProgressRecordModel, IProgressRecord } from "../progress/progressRecord.model.js";
import { ProjectMembershipModel } from "../auth/projectMembership.model.js";
import { progressService } from "../progress/progress.service.js";
import { AuditLogModel, IAuditLog } from "../audit/auditLog.model.js";
import { generateJwtToken } from "../../utils/jwt.js";

describe("Tasks & Progress API Tests (Phase 7)", () => {
  const app = createApp();

  const engineerToken = generateJwtToken({
    userId: "507f1f77bcf86cd799439012",
    email: "engineer@smartbuild.com",
    role: "SITE_ENGINEER",
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should allow SITE_ENGINEER to create task and return 201", async () => {
    vi.spyOn(UserModel, "findById").mockReturnValue({
      exec: vi.fn().mockResolvedValue({
        _id: "507f1f77bcf86cd799439012",
        primaryRole: "SITE_ENGINEER",
        status: "ACTIVE",
      }),
    } as unknown as ReturnType<typeof UserModel.findById>);

    vi.spyOn(ProjectMembershipModel, "findOne").mockReturnValue({
      exec: vi.fn().mockResolvedValue({
        userId: "507f1f77bcf86cd799439012",
        projectId: "507f1f77bcf86cd799439011",
        assignmentStatus: "ACTIVE",
      }),
    } as unknown as ReturnType<typeof ProjectMembershipModel.findOne>);

    vi.spyOn(PhaseModel, "findOne").mockReturnValue({
      exec: vi.fn().mockResolvedValue({ _id: "507f1f77bcf86cd799439015" }),
    } as unknown as ReturnType<typeof PhaseModel.findOne>);

    vi.spyOn(TaskModel, "create").mockResolvedValue({
      _id: "507f1f77bcf86cd799439020",
      title: "Piling Work",
      plannedQuantity: 50,
      unit: "points",
      completedQuantity: 0,
      progress: 0,
      status: "TODO",
    } as unknown as ITask);

    vi.spyOn(progressService, "recalculatePhaseProgress").mockResolvedValue(0);
    vi.spyOn(progressService, "recalculateProjectProgress").mockResolvedValue(0);
    vi.spyOn(AuditLogModel, "create").mockResolvedValue({} as unknown as IAuditLog);

    const res = await request(app)
      .post("/api/v1/projects/507f1f77bcf86cd799439011/tasks")
      .set("Authorization", `Bearer ${engineerToken}`)
      .send({
        phaseId: "507f1f77bcf86cd799439015",
        title: "Piling Work",
        plannedQuantity: 50,
        unit: "points",
        plannedStartDate: "2026-09-01",
        plannedEndDate: "2026-09-20",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe("Piling Work");
  });

  it("should allow progress logging via PUT /:taskId/progress", async () => {
    vi.spyOn(UserModel, "findById").mockReturnValue({
      exec: vi.fn().mockResolvedValue({
        _id: "507f1f77bcf86cd799439012",
        primaryRole: "SITE_ENGINEER",
        status: "ACTIVE",
      }),
    } as unknown as ReturnType<typeof UserModel.findById>);

    vi.spyOn(ProjectMembershipModel, "findOne").mockReturnValue({
      exec: vi.fn().mockResolvedValue({
        userId: "507f1f77bcf86cd799439012",
        projectId: "507f1f77bcf86cd799439011",
        assignmentStatus: "ACTIVE",
      }),
    } as unknown as ReturnType<typeof ProjectMembershipModel.findOne>);

    const mockTask = {
      _id: "507f1f77bcf86cd799439020",
      projectId: "507f1f77bcf86cd799439011",
      phaseId: "507f1f77bcf86cd799439015",
      title: "Piling Work",
      plannedQuantity: 50,
      unit: "points",
      completedQuantity: 0,
      progress: 0,
      status: "TODO",
      save: vi.fn().mockResolvedValue(true),
    };

    vi.spyOn(TaskModel, "findOne").mockReturnValue({
      exec: vi.fn().mockResolvedValue(mockTask),
    } as unknown as ReturnType<typeof TaskModel.findOne>);

    vi.spyOn(ProgressRecordModel, "create").mockResolvedValue({
      _id: "507f1f77bcf86cd799439088",
      completedQuantity: 25,
    } as unknown as IProgressRecord);

    vi.spyOn(progressService, "recalculatePhaseProgress").mockResolvedValue(50);
    vi.spyOn(progressService, "recalculateProjectProgress").mockResolvedValue(50);
    vi.spyOn(AuditLogModel, "create").mockResolvedValue({} as unknown as IAuditLog);

    const res = await request(app)
      .put("/api/v1/projects/507f1f77bcf86cd799439011/tasks/507f1f77bcf86cd799439020/progress")
      .set("Authorization", `Bearer ${engineerToken}`)
      .send({
        completedQuantity: 25,
        notes: "25 points driven",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.task.progress).toBe(50);
  });
});
