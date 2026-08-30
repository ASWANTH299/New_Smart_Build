import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import { createApp } from "../../app.js";
import procurementService from "./procurement.service.js";
import { UserModel } from "../users/user.model.js";
import { ProjectMembershipModel } from "../auth/projectMembership.model.js";
import { generateJwtToken } from "../../utils/jwt.js";
import { IProcurementRequest } from "./procurementRequest.model.js";
import { IPurchaseOrder } from "./purchaseOrder.model.js";
import { IMaterialReceipt } from "./materialReceipt.model.js";

vi.mock("./procurement.service.js");
vi.mock("../auth/projectMembership.model.js");

describe("Procurement API Integration Tests (Phase 9)", () => {
  const app = createApp();
  const adminId = "507f1f77bcf86cd799439011";
  const projectId = "507f1f77bcf86cd799439015";
  const adminToken = generateJwtToken({
    userId: adminId,
    email: "admin@smartbuild.com",
    role: "ADMIN",
  });

  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(UserModel, "findById").mockReturnValue({
      exec: vi.fn().mockResolvedValue({
        _id: adminId,
        primaryRole: "ADMIN",
        status: "ACTIVE",
      }),
    } as unknown as ReturnType<typeof UserModel.findById>);

    vi.spyOn(ProjectMembershipModel, "findOne").mockReturnValue({
      exec: vi.fn().mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        projectId,
        userId: adminId,
        role: "ADMIN",
      }),
    } as unknown as ReturnType<typeof ProjectMembershipModel.findOne>);
  });

  it("GET /api/v1/projects/:projectId/procurement-requests - should list procurement requests", async () => {
    vi.spyOn(procurementService, "getProcurementRequests").mockResolvedValue({
      requests: [
        {
          _id: new mongoose.Types.ObjectId(),
          requestNumber: "PR-2026-0001",
          reason: "Concrete shortage",
          status: "APPROVED",
        } as unknown as IProcurementRequest,
      ],
      pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });

    const res = await request(app)
      .get(`/api/v1/projects/${projectId}/procurement-requests`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].requestNumber).toBe("PR-2026-0001");
  });

  it("POST /api/v1/projects/:projectId/purchase-orders - should create a purchase order", async () => {
    const mockPO = {
      _id: new mongoose.Types.ObjectId(),
      poNumber: "PO-2026-0001",
      vendorId: new mongoose.Types.ObjectId(),
      projectId: new mongoose.Types.ObjectId(projectId),
      total: 10000,
      approvalStatus: "DRAFT",
    };

    vi.spyOn(procurementService, "createPurchaseOrder").mockResolvedValue(mockPO as unknown as IPurchaseOrder);

    const res = await request(app)
      .post(`/api/v1/projects/${projectId}/purchase-orders`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        vendorId: new mongoose.Types.ObjectId().toString(),
        items: [
          {
            materialId: new mongoose.Types.ObjectId().toString(),
            quantity: 50,
            unit: "BAGS",
            unitPrice: 200,
          },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.poNumber).toBe("PO-2026-0001");
  });

  it("POST /api/v1/projects/:projectId/receiving - should record material receipt", async () => {
    const mockReceipt = {
      receiptNumber: "MR-2026-0001",
      purchaseOrderId: new mongoose.Types.ObjectId(),
      locationId: new mongoose.Types.ObjectId(),
    };

    vi.spyOn(procurementService, "recordMaterialReceipt").mockResolvedValue({
      receipt: mockReceipt as unknown as IMaterialReceipt,
      purchaseOrder: { status: "FULFILLED" } as unknown as IPurchaseOrder,
    });

    const res = await request(app)
      .post(`/api/v1/projects/${projectId}/receiving`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        purchaseOrderId: new mongoose.Types.ObjectId().toString(),
        locationId: new mongoose.Types.ObjectId().toString(),
        items: [
          {
            materialId: new mongoose.Types.ObjectId().toString(),
            receivedQuantity: 50,
            acceptedQuantity: 50,
            rejectedQuantity: 0,
          },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.receipt.receiptNumber).toBe("MR-2026-0001");
  });
});
