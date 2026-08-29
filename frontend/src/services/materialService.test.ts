import { describe, it, expect, vi, beforeEach } from "vitest";
import materialService from "./materialService";
import { apiClient } from "./api";

describe("Frontend materialService Unit Tests (Phase 8)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should get materials catalog list with filters", async () => {
    const mockResponse = {
      success: true,
      data: [
        {
          _id: "mat-1",
          code: "MAT-CON-001",
          name: "Portland Cement",
          category: "Cement",
          unit: "Bags",
          minimumStock: 50,
          reorderLevel: 100,
          unitPrice: 12,
          status: "ACTIVE" as const,
        },
      ],
    };

    vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockResponse);

    const result = await materialService.getMaterials({
      search: "cement",
      category: "Cement",
      status: "ACTIVE",
    });

    expect(apiClient.get).toHaveBeenCalledWith(
      "/materials?search=cement&category=Cement&status=ACTIVE"
    );
    expect(result.data?.[0].code).toBe("MAT-CON-001");
  });

  it("should create a material in catalog", async () => {
    const mockResponse = {
      success: true,
      data: {
        _id: "mat-2",
        code: "MAT-STL-001",
        name: "Steel Rebar",
        category: "Steel",
        unit: "Tons",
        minimumStock: 10,
        reorderLevel: 25,
        unitPrice: 850,
        status: "ACTIVE" as const,
      },
    };

    vi.spyOn(apiClient, "post").mockResolvedValueOnce(mockResponse);

    const result = await materialService.createMaterial({
      code: "MAT-STL-001",
      name: "Steel Rebar",
      category: "Steel",
      unit: "Tons",
    });

    expect(apiClient.post).toHaveBeenCalledWith("/materials", {
      code: "MAT-STL-001",
      name: "Steel Rebar",
      category: "Steel",
      unit: "Tons",
    });
    expect(result.data?.code).toBe("MAT-STL-001");
  });

  it("should fetch project BOM versions and details", async () => {
    const mockBOMRes = {
      success: true,
      data: {
        bom: {
          _id: "bom-1",
          projectId: "proj-1",
          version: 1,
          status: "ACTIVE" as const,
          approvalStatus: "APPROVED" as const,
        },
        items: [
          {
            _id: "item-1",
            bomId: "bom-1",
            materialId: "mat-1",
            plannedQuantity: 500,
            usedQuantity: 100,
            remainingQuantity: 400,
            variance: -400,
            unit: "Bags",
            unitCost: 10,
          },
        ],
      },
    };

    vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockBOMRes);

    const result = await materialService.getBOMById("proj-1", "bom-1");
    expect(apiClient.get).toHaveBeenCalledWith("/projects/proj-1/bom/bom-1");
    expect(result.data?.bom.version).toBe(1);
    expect(result.data?.items[0].plannedQuantity).toBe(500);
  });

  it("should submit and issue material requests", async () => {
    const mockIssueRes = {
      success: true,
      data: {
        _id: "req-1",
        requestNumber: "MR-2026-00001",
        projectId: "proj-1",
        status: "ISSUED" as const,
        reason: "Foundation pour",
        items: [],
      },
    };

    vi.spyOn(apiClient, "post").mockResolvedValueOnce(mockIssueRes);

    const result = await materialService.issueMaterialRequest("proj-1", "req-1", {
      locationId: "loc-1",
      items: [{ materialId: "mat-1", quantityToIssue: 50 }],
    });

    expect(apiClient.post).toHaveBeenCalledWith(
      "/projects/proj-1/material-requests/req-1/issue",
      {
        locationId: "loc-1",
        items: [{ materialId: "mat-1", quantityToIssue: 50 }],
      }
    );
    expect(result.data?.status).toBe("ISSUED");
  });

  it("should fetch inventory balances and stock alerts", async () => {
    const mockAlerts = {
      success: true,
      data: [
        {
          type: "CRITICAL_LOW_STOCK" as const,
          balanceId: "bal-1",
          material: { _id: "mat-1", name: "Cement", code: "MAT-CON-001", minimumStock: 50 } as unknown as import("../types/material").Material,
          location: { _id: "loc-1", name: "Central Warehouse" } as unknown as import("../types/material").InventoryLocation,
          availableQuantity: 10,
          threshold: 50,
          message: "Critical low stock for Cement",
        },
      ],
    };

    vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockAlerts);

    const result = await materialService.getStockAlerts();
    expect(apiClient.get).toHaveBeenCalledWith("/inventory/alerts");
    expect(result.data?.[0].type).toBe("CRITICAL_LOW_STOCK");
  });
});
