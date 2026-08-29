import { describe, it, expect, vi, beforeEach } from "vitest";
import { BOMService } from "./bom.service.js";
import BOMModel, { IBOM } from "./bom.model.js";
import BOMItemModel, { IBOMItem } from "./bomItem.model.js";
import MaterialModel, { IMaterial } from "../materials/material.model.js";
import { AuditLogModel, IAuditLog } from "../audit/auditLog.model.js";
import { BadRequestError } from "../../utils/AppError.js";

describe("BOMService Unit Tests (Phase 8)", () => {
  let bomService: BOMService;

  beforeEach(() => {
    bomService = new BOMService();
    vi.restoreAllMocks();
  });

  it("should create a new BOM version with correct sequence", async () => {
    vi.spyOn(BOMModel, "findOne").mockReturnValue({
      sort: vi.fn().mockResolvedValue({ version: 2 }),
    } as unknown as ReturnType<typeof BOMModel.findOne>);

    const mockBOM = {
      _id: "507f1f77bcf86cd799439030",
      projectId: "507f1f77bcf86cd799439001",
      version: 3,
      status: "DRAFT",
      approvalStatus: "DRAFT",
    };

    vi.spyOn(BOMModel, "create").mockResolvedValue(mockBOM as unknown as IBOM);
    vi.spyOn(AuditLogModel, "create").mockResolvedValue({} as unknown as IAuditLog);

    const result = await bomService.createBOM(
      "507f1f77bcf86cd799439001",
      { notes: "Revision for Phase 2 foundation" },
      "507f1f77bcf86cd799439099"
    );

    expect(result.bom.version).toBe(3);
    expect(result.bom.status).toBe("DRAFT");
  });

  it("should calculate remaining quantity and variance on item addition", async () => {
    vi.spyOn(BOMModel, "findById").mockReturnValue({
      exec: vi.fn().mockResolvedValue({
        _id: "507f1f77bcf86cd799439030",
        projectId: "507f1f77bcf86cd799439001",
        approvalStatus: "DRAFT",
      }),
    } as unknown as ReturnType<typeof BOMModel.findById>);

    vi.spyOn(MaterialModel, "findById").mockReturnValue({
      exec: vi.fn().mockResolvedValue({
        _id: "507f1f77bcf86cd799439050",
        unit: "Tons",
        unitPrice: 750,
      }),
    } as unknown as ReturnType<typeof MaterialModel.findById>);

    const mockItem = {
      _id: "507f1f77bcf86cd799439060",
      bomId: "507f1f77bcf86cd799439030",
      materialId: "507f1f77bcf86cd799439050",
      plannedQuantity: 100,
      usedQuantity: 0,
      remainingQuantity: 100,
      variance: -100,
      unit: "Tons",
    };

    vi.spyOn(BOMItemModel, "create").mockResolvedValue(mockItem as unknown as IBOMItem);
    vi.spyOn(AuditLogModel, "create").mockResolvedValue({} as unknown as IAuditLog);

    const result = await bomService.addBOMItem(
      "507f1f77bcf86cd799439030",
      {
        materialId: "507f1f77bcf86cd799439050",
        plannedQuantity: 100,
        unit: "Tons",
      },
      "507f1f77bcf86cd799439099"
    );

    expect(result.plannedQuantity).toBe(100);
    expect(result.remainingQuantity).toBe(100);
    expect(result.variance).toBe(-100);
  });

  it("should prevent modification of an APPROVED BOM", async () => {
    vi.spyOn(BOMModel, "findById").mockReturnValue({
      exec: vi.fn().mockResolvedValue({
        _id: "507f1f77bcf86cd799439030",
        approvalStatus: "APPROVED",
      }),
    } as unknown as ReturnType<typeof BOMModel.findById>);

    vi.spyOn(MaterialModel, "findById").mockReturnValue({
      exec: vi.fn().mockResolvedValue({
        _id: "507f1f77bcf86cd799439050",
        unit: "Tons",
      } as unknown as IMaterial),
    } as unknown as ReturnType<typeof MaterialModel.findById>);

    await expect(
      bomService.addBOMItem(
        "507f1f77bcf86cd799439030",
        {
          materialId: "507f1f77bcf86cd799439050",
          plannedQuantity: 50,
          unit: "Tons",
        }
      )
    ).rejects.toThrow(BadRequestError);
  });

  it("should approve BOM and supersede previously active versions", async () => {
    const mockBOM = {
      _id: "507f1f77bcf86cd799439030",
      projectId: "507f1f77bcf86cd799439001",
      version: 2,
      approvalStatus: "DRAFT",
      status: "DRAFT",
      save: vi.fn().mockResolvedValue(true),
    };

    vi.spyOn(BOMModel, "findById").mockReturnValue({
      exec: vi.fn().mockResolvedValue(mockBOM),
    } as unknown as ReturnType<typeof BOMModel.findById>);

    vi.spyOn(BOMModel, "updateMany").mockResolvedValue({
      acknowledged: true,
      matchedCount: 1,
      modifiedCount: 1,
      upsertedCount: 0,
      upsertedId: null,
    });
    vi.spyOn(AuditLogModel, "create").mockResolvedValue({} as unknown as IAuditLog);

    const approved = await bomService.approveBOM(
      "507f1f77bcf86cd799439030",
      "507f1f77bcf86cd799439099",
      "Approved for procurement"
    );

    expect(approved.approvalStatus).toBe("APPROVED");
    expect(approved.status).toBe("ACTIVE");
    expect(BOMModel.updateMany).toHaveBeenCalledWith(
      { projectId: mockBOM.projectId, _id: { $ne: mockBOM._id }, status: "ACTIVE" },
      { status: "SUPERSEDED" }
    );
  });
});
