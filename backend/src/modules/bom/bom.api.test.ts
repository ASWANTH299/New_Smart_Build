import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { UserModel } from "../users/user.model.js";
import { ProjectMembershipModel } from "../auth/projectMembership.model.js";
import BOMModel from "./bom.model.js";
import BOMItemModel from "./bomItem.model.js";
import { generateJwtToken } from "../../utils/jwt.js";

describe("BOM API Integration Tests (Phase 8)", () => {
  const app = createApp();

  const pmToken = generateJwtToken({
    userId: "507f1f77bcf86cd799439011",
    email: "pm@smartbuild.com",
    role: "PROJECT_MANAGER",
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should retrieve project BOMs for assigned project manager", async () => {
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
        projectId: "507f1f77bcf86cd799439001",
        assignmentStatus: "ACTIVE",
      }),
    } as unknown as ReturnType<typeof ProjectMembershipModel.findOne>);

    vi.spyOn(BOMModel, "find").mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      populate: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([
        {
          _id: "507f1f77bcf86cd799439030",
          projectId: "507f1f77bcf86cd799439001",
          version: 1,
          status: "ACTIVE",
          approvalStatus: "APPROVED",
        },
      ]),
    } as unknown as ReturnType<typeof BOMModel.find>);

    const res = await request(app)
      .get("/api/v1/projects/507f1f77bcf86cd799439001/bom")
      .set("Authorization", `Bearer ${pmToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data[0].version).toBe(1);
  });

  it("should allow PM to view single BOM and its items", async () => {
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
        projectId: "507f1f77bcf86cd799439001",
        assignmentStatus: "ACTIVE",
      }),
    } as unknown as ReturnType<typeof ProjectMembershipModel.findOne>);

    vi.spyOn(BOMModel, "findById").mockReturnValue({
      populate: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue({
        _id: "507f1f77bcf86cd799439030",
        projectId: "507f1f77bcf86cd799439001",
        version: 1,
        status: "ACTIVE",
      }),
    } as unknown as ReturnType<typeof BOMModel.findById>);

    vi.spyOn(BOMItemModel, "find").mockReturnValue({
      populate: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([
        {
          _id: "507f1f77bcf86cd799439060",
          bomId: "507f1f77bcf86cd799439030",
          plannedQuantity: 100,
          remainingQuantity: 100,
        },
      ]),
    } as unknown as ReturnType<typeof BOMItemModel.find>);

    const res = await request(app)
      .get("/api/v1/projects/507f1f77bcf86cd799439001/bom/507f1f77bcf86cd799439030")
      .set("Authorization", `Bearer ${pmToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.bom._id).toBe("507f1f77bcf86cd799439030");
    expect(res.body.data.items.length).toBe(1);
  });
});
