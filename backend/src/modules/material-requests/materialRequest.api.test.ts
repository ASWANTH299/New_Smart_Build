import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { UserModel } from "../users/user.model.js";
import { ProjectMembershipModel } from "../auth/projectMembership.model.js";
import MaterialRequestModel, { IMaterialRequest } from "./materialRequest.model.js";
import MaterialModel from "../materials/material.model.js";
import inventoryService from "../inventory/inventory.service.js";
import { AuditLogModel, IAuditLog } from "../audit/auditLog.model.js";
import { generateJwtToken } from "../../utils/jwt.js";

describe("Material Requests API Integration Tests (Phase 8)", () => {
  const app = createApp();

  const engineerToken = generateJwtToken({
    userId: "507f1f77bcf86cd799439012",
    email: "engineer@smartbuild.com",
    role: "SITE_ENGINEER",
  });

  const pmToken = generateJwtToken({
    userId: "507f1f77bcf86cd799439011",
    email: "pm@smartbuild.com",
    role: "PROJECT_MANAGER",
  });

  const storeManagerToken = generateJwtToken({
    userId: "507f1f77bcf86cd799439013",
    email: "store@smartbuild.com",
    role: "STORE_MANAGER",
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should allow Site Engineer to create a material request", async () => {
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
        projectId: "507f1f77bcf86cd799439001",
        assignmentStatus: "ACTIVE",
      }),
    } as unknown as ReturnType<typeof ProjectMembershipModel.findOne>);

    vi.spyOn(MaterialModel, "findById").mockReturnValue({
      exec: vi.fn().mockResolvedValue({ _id: "507f1f77bcf86cd799439002" }),
    } as unknown as ReturnType<typeof MaterialModel.findById>);

    vi.spyOn(MaterialRequestModel, "countDocuments").mockResolvedValue(0);

    const mockRequest = {
      _id: "507f1f77bcf86cd799439010",
      requestNumber: "MR-2026-00001",
      projectId: "507f1f77bcf86cd799439001",
      status: "SUBMITTED",
      reason: "Masonry blocks for Level 2 wall",
      items: [
        {
          materialId: "507f1f77bcf86cd799439002",
          requestedQuantity: 500,
          approvedQuantity: 0,
          issuedQuantity: 0,
          unit: "Pieces",
        },
      ],
    };

    vi.spyOn(MaterialRequestModel, "create").mockResolvedValue(mockRequest as unknown as IMaterialRequest);
    vi.spyOn(AuditLogModel, "create").mockResolvedValue({} as unknown as IAuditLog);

    const res = await request(app)
      .post("/api/v1/projects/507f1f77bcf86cd799439001/material-requests")
      .set("Authorization", `Bearer ${engineerToken}`)
      .send({
        reason: "Masonry blocks for Level 2 wall",
        submitImmediately: true,
        items: [
          {
            materialId: "507f1f77bcf86cd799439002",
            requestedQuantity: 500,
            unit: "Pieces",
          },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.requestNumber).toBe("MR-2026-00001");
  });

  it("should allow PM to approve a submitted material request", async () => {
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

    const mockRequest = {
      _id: "507f1f77bcf86cd799439010",
      requestNumber: "MR-2026-00001",
      projectId: "507f1f77bcf86cd799439001",
      status: "SUBMITTED",
      items: [
        {
          materialId: "507f1f77bcf86cd799439002",
          requestedQuantity: 500,
          approvedQuantity: 0,
          issuedQuantity: 0,
          unit: "Pieces",
        },
      ],
      save: vi.fn().mockResolvedValue(true),
    };

    vi.spyOn(MaterialRequestModel, "findById").mockReturnValue({
      populate: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue(mockRequest),
    } as unknown as ReturnType<typeof MaterialRequestModel.findById>);

    vi.spyOn(AuditLogModel, "create").mockResolvedValue({} as unknown as IAuditLog);

    const res = await request(app)
      .put("/api/v1/projects/507f1f77bcf86cd799439001/material-requests/507f1f77bcf86cd799439010/approve")
      .set("Authorization", `Bearer ${pmToken}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("APPROVED");
  });

  it("should allow Store Manager to issue materials against APPROVED request", async () => {
    vi.spyOn(UserModel, "findById").mockReturnValue({
      exec: vi.fn().mockResolvedValue({
        _id: "507f1f77bcf86cd799439013",
        primaryRole: "STORE_MANAGER",
        status: "ACTIVE",
      }),
    } as unknown as ReturnType<typeof UserModel.findById>);

    const mockRequest = {
      _id: "507f1f77bcf86cd799439010",
      requestNumber: "MR-2026-00001",
      projectId: "507f1f77bcf86cd799439001",
      status: "APPROVED",
      items: [
        {
          materialId: "507f1f77bcf86cd799439002",
          requestedQuantity: 500,
          approvedQuantity: 500,
          issuedQuantity: 0,
          unit: "Pieces",
        },
      ],
      save: vi.fn().mockResolvedValue(true),
    };

    vi.spyOn(MaterialRequestModel, "findById").mockReturnValue({
      populate: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue(mockRequest),
    } as unknown as ReturnType<typeof MaterialRequestModel.findById>);

    vi.spyOn(inventoryService, "issueMaterials").mockResolvedValue({} as unknown as Awaited<ReturnType<typeof inventoryService.issueMaterials>>);
    vi.spyOn(AuditLogModel, "create").mockResolvedValue({} as unknown as IAuditLog);

    const res = await request(app)
      .post("/api/v1/projects/507f1f77bcf86cd799439001/material-requests/507f1f77bcf86cd799439010/issue")
      .set("Authorization", `Bearer ${storeManagerToken}`)
      .send({
        locationId: "507f1f77bcf86cd799439020",
        items: [
          {
            materialId: "507f1f77bcf86cd799439002",
            quantityToIssue: 500,
          },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("ISSUED");
  });
});
