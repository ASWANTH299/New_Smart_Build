import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { UserModel } from "../users/user.model.js";
import { ProjectModel, IProject } from "./project.model.js";
import { ProjectMembershipModel, IProjectMembership } from "../auth/projectMembership.model.js";
import { AuditLogModel, IAuditLog } from "../audit/auditLog.model.js";
import { generateJwtToken } from "../../utils/jwt.js";

describe("Projects API Tests (Phase 6)", () => {
  const app = createApp();

  const pmToken = generateJwtToken({
    userId: "507f1f77bcf86cd799439011",
    email: "pm@smartbuild.com",
    role: "PROJECT_MANAGER",
  });

  const clientToken = generateJwtToken({
    userId: "507f1f77bcf86cd799439014",
    email: "client@smartbuild.com",
    role: "CLIENT",
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should reject CLIENT from creating a project with 403 Forbidden", async () => {
    vi.spyOn(UserModel, "findById").mockReturnValue({
      exec: vi.fn().mockResolvedValue({
        _id: "507f1f77bcf86cd799439014",
        primaryRole: "CLIENT",
        status: "ACTIVE",
      }),
    } as unknown as ReturnType<typeof UserModel.findById>);

    const res = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${clientToken}`)
      .send({
        code: "PRJ-CLI-01",
        name: "Unauthorized Project",
        location: "Bengaluru",
        plannedStartDate: "2026-09-01",
        plannedEndDate: "2027-09-01",
        projectManagerId: "507f1f77bcf86cd799439011",
      });

    expect(res.status).toBe(403);
  });

  it("should allow PROJECT_MANAGER to create a project and return 201", async () => {
    vi.spyOn(UserModel, "findById").mockReturnValue({
      exec: vi.fn().mockResolvedValue({
        _id: "507f1f77bcf86cd799439011",
        primaryRole: "PROJECT_MANAGER",
        status: "ACTIVE",
      }),
    } as unknown as ReturnType<typeof UserModel.findById>);

    vi.spyOn(ProjectModel, "findOne").mockReturnValue({
      exec: vi.fn().mockResolvedValue(null),
    } as unknown as ReturnType<typeof ProjectModel.findOne>);

    vi.spyOn(ProjectModel, "create").mockResolvedValue({
      _id: "507f1f77bcf86cd799439020",
      code: "PRJ-BLR-001",
      name: "Smart Heights",
      status: "PLANNING",
      health: "HEALTHY",
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as IProject);

    vi.spyOn(ProjectMembershipModel, "insertMany").mockResolvedValue([] as unknown as IProjectMembership[]);
    vi.spyOn(AuditLogModel, "create").mockResolvedValue({} as unknown as IAuditLog);

    const res = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${pmToken}`)
      .send({
        code: "PRJ-BLR-001",
        name: "Smart Heights",
        location: "Bengaluru",
        plannedStartDate: "2026-09-01",
        plannedEndDate: "2027-09-01",
        projectManagerId: "507f1f77bcf86cd799439011",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.code).toBe("PRJ-BLR-001");
  });

  it("should return project overview with 200 when user has membership", async () => {
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
        projectId: "507f1f77bcf86cd799439020",
        assignmentStatus: "ACTIVE",
      }),
    } as unknown as ReturnType<typeof ProjectMembershipModel.findOne>);

    vi.spyOn(ProjectModel, "findById").mockReturnValue({
      populate: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue({
        _id: "507f1f77bcf86cd799439020",
        code: "PRJ-BLR-001",
        name: "Smart Heights",
        plannedStartDate: new Date("2026-09-01"),
        plannedEndDate: new Date("2027-09-01"),
        status: "PLANNING",
        health: "HEALTHY",
        progress: 0,
      }),
    } as unknown as ReturnType<typeof ProjectModel.findById>);

    vi.spyOn(ProjectMembershipModel, "countDocuments").mockReturnValue({
      exec: vi.fn().mockResolvedValue(5),
    } as unknown as ReturnType<typeof ProjectMembershipModel.countDocuments>);

    const res = await request(app)
      .get("/api/v1/projects/507f1f77bcf86cd799439020/overview")
      .set("Authorization", `Bearer ${pmToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("teamCount", 5);
  });
});
