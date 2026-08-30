import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import { procurementService } from "./procurement.service.js";
import ProcurementRequestModel, { IProcurementRequest } from "./procurementRequest.model.js";
import PurchaseOrderModel, { IPurchaseOrder } from "./purchaseOrder.model.js";
import MaterialReceiptModel, { IMaterialReceipt } from "./materialReceipt.model.js";
import VendorModel, { IVendor } from "../vendors/vendor.model.js";
import MaterialModel, { IMaterial } from "../materials/material.model.js";
import inventoryService from "../inventory/inventory.service.js";
import { BadRequestError } from "../../utils/AppError.js";

vi.mock("./procurementRequest.model.js");
vi.mock("./purchaseOrder.model.js");
vi.mock("./materialReceipt.model.js");
vi.mock("../vendors/vendor.model.js");
vi.mock("../materials/material.model.js");
vi.mock("../inventory/inventory.service.js");
vi.mock("../audit/auditLog.model.js", () => ({
  logAuditAction: vi.fn().mockResolvedValue({}),
}));

describe("ProcurementService Unit Tests", () => {
  const projectId = new mongoose.Types.ObjectId().toString();
  const actorId = new mongoose.Types.ObjectId().toString();
  const materialId = new mongoose.Types.ObjectId();
  const vendorId = new mongoose.Types.ObjectId();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createProcurementRequest", () => {
    it("should create procurement request with calculated estimated total", async () => {
      vi.spyOn(ProcurementRequestModel, "countDocuments").mockResolvedValue(0);
      vi.spyOn(MaterialModel, "findById").mockReturnValue({
        exec: vi.fn().mockResolvedValue({
          _id: materialId,
          code: "MAT-001",
          unit: "BAGS",
          unitPrice: 350,
        }),
      } as unknown as ReturnType<typeof MaterialModel.findById>);

      const mockSave = vi.fn().mockResolvedValue(true);
      (ProcurementRequestModel as unknown as vi.Mock).mockImplementation((data: Partial<IProcurementRequest>) => ({
        ...data,
        _id: new mongoose.Types.ObjectId(),
        save: mockSave,
      }));

      const result = await procurementService.createProcurementRequest(
        projectId,
        {
          reason: "Urgent concrete foundation work",
          submitImmediately: true,
          items: [
            {
              materialId: materialId.toString(),
              requestedQuantity: 100,
              estimatedUnitPrice: 350,
              unit: "BAGS",
            },
          ],
        },
        actorId
      );

      expect(result.requestNumber).toBeDefined();
      expect(result.items[0].estimatedTotalPrice).toBe(35000);
      expect(result.status).toBe("SUBMITTED");
      expect(mockSave).toHaveBeenCalled();
    });
  });

  describe("createPurchaseOrder", () => {
    it("should throw error if vendor is blacklisted", async () => {
      vi.spyOn(VendorModel, "findById").mockReturnValue({
        exec: vi.fn().mockResolvedValue({ _id: vendorId, status: "BLACKLISTED" }),
      } as unknown as ReturnType<typeof VendorModel.findById>);

      await expect(
        procurementService.createPurchaseOrder(
          projectId,
          {
            vendorId: vendorId.toString(),
            items: [{ materialId: materialId.toString(), quantity: 10, unit: "BAGS", unitPrice: 350 }],
          },
          actorId
        )
      ).rejects.toThrow(BadRequestError);
    });

    it("should calculate subtotal and total accurately", async () => {
      vi.spyOn(VendorModel, "findById").mockReturnValue({
        exec: vi.fn().mockResolvedValue({ _id: vendorId, status: "ACTIVE" } as unknown as IVendor),
      } as unknown as ReturnType<typeof VendorModel.findById>);
      vi.spyOn(PurchaseOrderModel, "countDocuments").mockResolvedValue(0);
      vi.spyOn(MaterialModel, "findById").mockReturnValue({
        exec: vi.fn().mockResolvedValue({ _id: materialId, unit: "BAGS" } as unknown as IMaterial),
      } as unknown as ReturnType<typeof MaterialModel.findById>);

      const mockSave = vi.fn().mockResolvedValue(true);
      (PurchaseOrderModel as unknown as vi.Mock).mockImplementation((data: Partial<IPurchaseOrder>) => ({
        ...data,
        _id: new mongoose.Types.ObjectId(),
        save: mockSave,
      }));

      const po = await procurementService.createPurchaseOrder(
        projectId,
        {
          vendorId: vendorId.toString(),
          tax: 500,
          submitForApproval: true,
          items: [
            { materialId: materialId.toString(), quantity: 100, unit: "BAGS", unitPrice: 350 },
          ],
        },
        actorId
      );

      expect(po.subtotal).toBe(35000);
      expect(po.tax).toBe(500);
      expect(po.total).toBe(35500);
      expect(po.approvalStatus).toBe("PENDING_APPROVAL");
      expect(mockSave).toHaveBeenCalled();
    });
  });

  describe("recordMaterialReceipt & Inventory Integration", () => {
    it("should validate approved PO, update inventory, increment receivedQuantity, and fulfill PO", async () => {
      const poId = new mongoose.Types.ObjectId();
      const locationId = new mongoose.Types.ObjectId().toString();

      const mockPO = {
        _id: poId,
        poNumber: "PO-2026-0001",
        projectId: new mongoose.Types.ObjectId(projectId),
        vendorId,
        approvalStatus: "APPROVED",
        status: "ISSUED",
        items: [
          {
            materialId,
            quantity: 100,
            receivedQuantity: 0,
            unitPrice: 350,
          },
        ],
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(PurchaseOrderModel, "findById").mockReturnValue({
        exec: vi.fn().mockResolvedValue(mockPO),
      } as unknown as ReturnType<typeof PurchaseOrderModel.findById>);
      vi.spyOn(MaterialReceiptModel, "countDocuments").mockResolvedValue(0);
      vi.spyOn(inventoryService, "receiveMaterials").mockResolvedValue({} as unknown as Awaited<ReturnType<typeof inventoryService.receiveMaterials>>);
      vi.spyOn(VendorModel, "findByIdAndUpdate").mockReturnValue({
        exec: vi.fn().mockResolvedValue(true),
      } as unknown as ReturnType<typeof VendorModel.findByIdAndUpdate>);

      const mockReceiptSave = vi.fn().mockResolvedValue(true);
      (MaterialReceiptModel as unknown as vi.Mock).mockImplementation((data: Partial<IMaterialReceipt>) => ({
        ...data,
        _id: new mongoose.Types.ObjectId(),
        save: mockReceiptSave,
      }));

      const result = await procurementService.recordMaterialReceipt(
        projectId,
        {
          purchaseOrderId: poId.toString(),
          locationId,
          items: [
            {
              materialId: materialId.toString(),
              receivedQuantity: 100,
              acceptedQuantity: 100,
              rejectedQuantity: 0,
            },
          ],
        },
        actorId
      );

      expect(inventoryService.receiveMaterials).toHaveBeenCalledWith(
        expect.objectContaining({
          locationId,
          materialId: materialId.toString(),
          quantity: 100,
          unitCost: 350,
          referenceType: "PURCHASE_ORDER",
        }),
        actorId
      );

      expect(mockPO.items[0].receivedQuantity).toBe(100);
      expect(mockPO.status).toBe("FULFILLED");
      expect(result.receipt).toBeDefined();
    });
  });
});
