import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { UserModel } from "../users/user.model.js";
import { MilestoneModel, IMilestone } from "./milestone.model.js";
import { ProjectMembershipModel } from "../auth/projectMembership.model.js";
import { ProjectModel } from "../projects/project.model.js";
import { AuditLogModel, IAuditLog } from "../audit/auditLog.model.js";
import { generateJwtToken } from "../../utils/jwt.js";

describe("Milestones API Tests (Phase 7)", () => {
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

  it("should filter milestones by clientVisible for CLIENT role", async () => {
    vi.spyOn(UserModel, "findById").mockReturnValue({
      exec: vi.fn().mockResolvedValue({
        _id: "507f1f77bcf86cd799439014",
        primaryRole: "CLIENT",
        status: "ACTIVE",
      }),
    } as unknown as ReturnType<typeof UserModel.findById>);

    vi.spyOn(ProjectMembershipModel, "findOne").mockReturnValue({
      exec: vi.fn().mockResolvedValue({
        userId: "507f1f77bcf86cd799439014",
        projectId: "507f1f77bcf86cd799439011",
        assignmentStatus: "ACTIVE",
      }),
    } as unknown as ReturnType<typeof ProjectMembershipModel.findOne>);

    vi.spyOn(MilestoneModel, "find").mockImplementation(((query: Record<string, unknown>) => {
      expect(query.clientVisible).toBe(true);
      return {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue([
          {
            _id: "507f1f77bcf86cd799439030",
            name: "Plinth Level Complete",
            clientVisible: true,
            status: "ACHIEVED",
          },
        ]),
      };
    }) as unknown as typeof MilestoneModel.find);

    const res = await request(app)
      .get("/api/v1/projects/507f1f77bcf86cd799439011/milestones")
      .set("Authorization", `Bearer ${clientToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data[0].name).toBe("Plinth Level Complete");
  });

  it("should allow PM to create milestone", async () => {
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

    vi.spyOn(MilestoneModel, "create").mockResolvedValue({
      _id: "507f1f77bcf86cd799439030",
      name: "Roof Slab Cast",
      status: "PENDING",
    } as unknown as IMilestone);

    vi.spyOn(AuditLogModel, "create").mockResolvedValue({} as unknown as IAuditLog);

    const res = await request(app)
      .post("/api/v1/projects/507f1f77bcf86cd799439011/milestones")
      .set("Authorization", `Bearer ${pmToken}`)
      .send({
        name: "Roof Slab Cast",
        plannedDate: "2026-11-30",
        clientVisible: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("Roof Slab Cast");
  });
});
