import { describe, it, expect, vi, beforeEach } from "vitest";
import { MaterialRequestService } from "./materialRequest.service.js";
import MaterialRequestModel, { IMaterialRequest } from "./materialRequest.model.js";
import MaterialModel from "../materials/material.model.js";
import inventoryService from "../inventory/inventory.service.js";
import { AuditLogModel, IAuditLog } from "../audit/auditLog.model.js";
import { ForbiddenError } from "../../utils/AppError.js";

describe("MaterialRequestService Unit Tests (Phase 8)", () => {
  let requestService: MaterialRequestService;

  beforeEach(() => {
    requestService = new MaterialRequestService();
    vi.restoreAllMocks();
  });

  it("should create a material request in DRAFT status by default", async () => {
    vi.spyOn(MaterialModel, "findById").mockReturnValue({
      exec: vi.fn().mockResolvedValue({ _id: "507f1f77bcf86cd799439002" }),
    } as unknown as ReturnType<typeof MaterialModel.findById>);
    vi.spyOn(MaterialRequestModel, "countDocuments").mockResolvedValue(0);

    const mockRequest = {
      _id: "507f1f77bcf86cd799439010",
      requestNumber: "MR-2026-00001",
      projectId: "507f1f77bcf86cd799439001",
      status: "DRAFT",
      items: [
        {
          materialId: "507f1f77bcf86cd799439002",
          requestedQuantity: 50,
          approvedQuantity: 0,
          issuedQuantity: 0,
          unit: "Bags",
        },
      ],
    };

    vi.spyOn(MaterialRequestModel, "create").mockResolvedValue(mockRequest as unknown as IMaterialRequest);
    vi.spyOn(AuditLogModel, "create").mockResolvedValue({} as unknown as IAuditLog);

    const result = await requestService.createMaterialRequest(
      "507f1f77bcf86cd799439001",
      {
        reason: "Foundation footing concrete pour",
        items: [
          {
            materialId: "507f1f77bcf86cd799439002",
            requestedQuantity: 50,
            unit: "Bags",
          },
        ],
      },
      "507f1f77bcf86cd799439099"
    );

    expect(result.status).toBe("DRAFT");
    expect(result.requestNumber).toBe("MR-2026-00001");
  });

  it("should approve a submitted request and set approved quantities", async () => {
    const mockRequest = {
      _id: "507f1f77bcf86cd799439010",
      requestNumber: "MR-2026-00001",
      projectId: "507f1f77bcf86cd799439001",
      status: "SUBMITTED",
      items: [
        {
          materialId: "507f1f77bcf86cd799439002",
          requestedQuantity: 50,
          approvedQuantity: 0,
          issuedQuantity: 0,
          unit: "Bags",
        },
      ],
      save: vi.fn().mockResolvedValue(true),
    };

    vi.spyOn(requestService, "getMaterialRequestById").mockResolvedValue(mockRequest as unknown as IMaterialRequest);
    vi.spyOn(AuditLogModel, "create").mockResolvedValue({} as unknown as IAuditLog);

    const approved = await requestService.reviewMaterialRequest(
      "507f1f77bcf86cd799439010",
      {
        decision: "APPROVE",
        approvedItems: [
          {
            materialId: "507f1f77bcf86cd799439002",
            approvedQuantity: 40, // PM approves 40 of 50
          },
        ],
      },
      "507f1f77bcf86cd799439099"
    );

    expect(approved.status).toBe("APPROVED");
    expect(approved.items[0].approvedQuantity).toBe(40);
  });

  it("should strictly PROHIBIT issuance if request is in DRAFT or REJECTED status", async () => {
    const mockRequest = {
      _id: "507f1f77bcf86cd799439010",
      requestNumber: "MR-2026-00001",
      status: "DRAFT", // Not approved
      items: [{ materialId: "507f1f77bcf86cd799439002", approvedQuantity: 0, issuedQuantity: 0 }],
    };

    vi.spyOn(requestService, "getMaterialRequestById").mockResolvedValue(mockRequest as unknown as IMaterialRequest);

    await expect(
      requestService.issueMaterialRequest(
        "507f1f77bcf86cd799439010",
        {
          locationId: "507f1f77bcf86cd799439020",
          items: [{ materialId: "507f1f77bcf86cd799439002", quantityToIssue: 10 }],
        },
        "507f1f77bcf86cd799439099"
      )
    ).rejects.toThrow(ForbiddenError);
  });

  it("should issue materials against APPROVED request and update status to ISSUED when complete", async () => {
    const mockRequest = {
      _id: "507f1f77bcf86cd799439010",
      requestNumber: "MR-2026-00001",
      projectId: "507f1f77bcf86cd799439001",
      status: "APPROVED",
      items: [
        {
          materialId: "507f1f77bcf86cd799439002",
          requestedQuantity: 50,
          approvedQuantity: 50,
          issuedQuantity: 0,
          unit: "Bags",
        },
      ],
      save: vi.fn().mockResolvedValue(true),
    };

    vi.spyOn(requestService, "getMaterialRequestById").mockResolvedValue(mockRequest as unknown as IMaterialRequest);
    vi.spyOn(inventoryService, "issueMaterials").mockResolvedValue({} as unknown as Awaited<ReturnType<typeof inventoryService.issueMaterials>>);
    vi.spyOn(AuditLogModel, "create").mockResolvedValue({} as unknown as IAuditLog);

    const result = await requestService.issueMaterialRequest(
      "507f1f77bcf86cd799439010",
      {
        locationId: "507f1f77bcf86cd799439020",
        items: [{ materialId: "507f1f77bcf86cd799439002", quantityToIssue: 50 }],
      },
      "507f1f77bcf86cd799439099"
    );

    expect(result.status).toBe("ISSUED");
    expect(result.items[0].issuedQuantity).toBe(50);
    expect(inventoryService.issueMaterials).toHaveBeenCalledWith(
      expect.objectContaining({
        locationId: "507f1f77bcf86cd799439020",
        materialId: "507f1f77bcf86cd799439002",
        quantity: 50,
      }),
      "507f1f77bcf86cd799439099"
    );
  });
});
