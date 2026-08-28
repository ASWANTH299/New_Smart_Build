import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { UserModel } from "../users/user.model.js";
import { ProjectModel } from "../projects/project.model.js";
import { PhaseModel, IPhase } from "./phase.model.js";
import { TaskModel } from "../tasks/task.model.js";
import { ProjectMembershipModel } from "../auth/projectMembership.model.js";
import { progressService } from "../progress/progress.service.js";
import { AuditLogModel, IAuditLog } from "../audit/auditLog.model.js";
import { generateJwtToken } from "../../utils/jwt.js";

describe("Phases API Integration Tests (Phase 7)", () => {
  const app = createApp();

  const pmToken = generateJwtToken({
    userId: "507f1f77bcf86cd799439011",
    email: "pm@smartbuild.com",
    role: "PROJECT_MANAGER",
  });

  const engineerToken = generateJwtToken({
    userId: "507f1f77bcf86cd799439012",
    email: "engineer@smartbuild.com",
    role: "SITE_ENGINEER",
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should return phases for project member", async () => {
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

    vi.spyOn(PhaseModel, "find").mockReturnValue({
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([
        {
          _id: "507f1f77bcf86cd799439015",
          name: "Substructure",
          sequence: 1,
          progress: 25,
          status: "IN_PROGRESS",
          toObject: () => ({
            _id: "507f1f77bcf86cd799439015",
            name: "Substructure",
            sequence: 1,
            progress: 25,
            status: "IN_PROGRESS",
          }),
        },
      ]),
    } as unknown as ReturnType<typeof PhaseModel.find>);

    vi.spyOn(TaskModel, "find").mockReturnValue({
      select: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([
        { phaseId: "507f1f77bcf86cd799439015", status: "IN_PROGRESS" },
      ]),
    } as unknown as ReturnType<typeof TaskModel.find>);

    const res = await request(app)
      .get("/api/v1/projects/507f1f77bcf86cd799439011/phases")
      .set("Authorization", `Bearer ${engineerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data[0].name).toBe("Substructure");
    expect(res.body.data[0].taskCount).toBe(1);
  });

  it("should allow PM to create phase", async () => {
    vi.spyOn(UserModel, "findById").mockReturnValue({
      exec: vi.fn().mockResolvedValue({
        _id: "507f1f77bcf86cd799439011",
        primaryRole: "PROJECT_MANAGER",
        status: "ACTIVE",
      }),
    } as unknown as ReturnType<typeof UserModel.findById>);

    vi.spyOn(ProjectMembershipModel, "findOne").mockReturnValue({
      exec: vi.fn().mockResolvedValue({
        userId: "507f1f77bcf86cd799439011",
        projectId: "507f1f77bcf86cd799439011",
        assignmentStatus: "ACTIVE",
      }),
    } as unknown as ReturnType<typeof ProjectMembershipModel.findOne>);

    vi.spyOn(ProjectModel, "findById").mockReturnValue({
      exec: vi.fn().mockResolvedValue({ _id: "507f1f77bcf86cd799439011" }),
    } as unknown as ReturnType<typeof ProjectModel.findById>);

    vi.spyOn(PhaseModel, "findOne").mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue(null),
    } as unknown as ReturnType<typeof PhaseModel.findOne>);

    vi.spyOn(PhaseModel, "create").mockResolvedValue({
      _id: "507f1f77bcf86cd799439016",
      name: "Superstructure",
      sequence: 1,
      progress: 0,
      status: "NOT_STARTED",
    } as unknown as IPhase);

    vi.spyOn(progressService, "recalculateProjectProgress").mockResolvedValue(0);
    vi.spyOn(AuditLogModel, "create").mockResolvedValue({} as unknown as IAuditLog);

    const res = await request(app)
      .post("/api/v1/projects/507f1f77bcf86cd799439011/phases")
      .set("Authorization", `Bearer ${pmToken}`)
      .send({
        name: "Superstructure",
        plannedStartDate: "2026-10-01",
        plannedEndDate: "2027-01-01",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("Superstructure");
  });
});
