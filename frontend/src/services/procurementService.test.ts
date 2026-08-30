import { describe, it, expect, vi, beforeEach } from "vitest";
import { procurementService } from "./procurementService.js";
import apiClient from "./api.js";

vi.mock("./api.js");

describe("procurementService Client Tests (Phase 9)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch vendors with filter parameters", async () => {
    const mockData = {
      success: true,
      data: [{ _id: "v1", code: "VEN-001", name: "Apex Steel Ltd", status: "ACTIVE" }],
    };

    vi.spyOn(apiClient, "get").mockResolvedValue(mockData as any);

    const result = await procurementService.getVendors({ search: "Apex", status: "ACTIVE" });

    expect(apiClient.get).toHaveBeenCalledWith("/vendors?search=Apex&status=ACTIVE");
    expect(result.data).toHaveLength(1);
    expect(result.data![0].code).toBe("VEN-001");
  });

  it("should fetch project procurement requests", async () => {
    const mockData = {
      success: true,
      data: [{ _id: "pr1", requestNumber: "PR-2026-0001", status: "SUBMITTED" }],
    };

    vi.spyOn(apiClient, "get").mockResolvedValue(mockData as any);

    const result = await procurementService.getProcurementRequests("p1", { status: "SUBMITTED" });

    expect(apiClient.get).toHaveBeenCalledWith("/projects/p1/procurement-requests?status=SUBMITTED");
    expect(result.data![0].requestNumber).toBe("PR-2026-0001");
  });

  it("should create a purchase order", async () => {
    const mockData = {
      success: true,
      data: { _id: "po1", poNumber: "PO-2026-0001", total: 5000 },
    };

    vi.spyOn(apiClient, "post").mockResolvedValue(mockData as any);

    const payload = {
      vendorId: "v1",
      items: [{ materialId: "m1", quantity: 10, unit: "Tons", unitPrice: 500 }],
    };

    const result = await procurementService.createPurchaseOrder("p1", payload);

    expect(apiClient.post).toHaveBeenCalledWith("/projects/p1/purchase-orders", payload);
    expect(result.data!.poNumber).toBe("PO-2026-0001");
  });

  it("should record material receipt and inventory receiving", async () => {
    const mockData = {
      success: true,
      data: {
        receipt: { _id: "mr1", receiptNumber: "MR-2026-0001" },
        purchaseOrder: { _id: "po1", status: "FULFILLED" },
      },
    };

    vi.spyOn(apiClient, "post").mockResolvedValue(mockData as any);

    const payload = {
      purchaseOrderId: "po1",
      locationId: "loc1",
      items: [{ materialId: "m1", receivedQuantity: 10, acceptedQuantity: 10, rejectedQuantity: 0 }],
    };

    const result = await procurementService.recordMaterialReceipt("p1", payload);

    expect(apiClient.post).toHaveBeenCalledWith("/projects/p1/receiving", payload);
    expect(result.data!.receipt.receiptNumber).toBe("MR-2026-0001");
  });
});
