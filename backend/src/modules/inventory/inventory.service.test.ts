import { describe, it, expect, vi, beforeEach } from "vitest";
import { InventoryService } from "./inventory.service.js";
import InventoryLocationModel from "./inventoryLocation.model.js";
import InventoryBalanceModel from "./inventoryBalance.model.js";
import InventoryTransactionModel, { IInventoryTransaction } from "./inventoryTransaction.model.js";
import MaterialModel from "../materials/material.model.js";
import { AuditLogModel, IAuditLog } from "../audit/auditLog.model.js";
import { BadRequestError } from "../../utils/AppError.js";

describe("InventoryService Unit Tests (Phase 8)", () => {
  let inventoryService: InventoryService;

  beforeEach(() => {
    inventoryService = new InventoryService();
    vi.restoreAllMocks();
  });

  it("should receive materials, increase balance, update average unit cost, and record RECEIPT transaction", async () => {
    vi.spyOn(InventoryLocationModel, "findById").mockReturnValue({
      exec: vi.fn().mockResolvedValue({
        _id: "507f1f77bcf86cd799439001",
        name: "Central Warehouse",
        type: "CENTRAL_WAREHOUSE",
      }),
    } as unknown as ReturnType<typeof InventoryLocationModel.findById>);

    vi.spyOn(MaterialModel, "findById").mockReturnValue({
      exec: vi.fn().mockResolvedValue({
        _id: "507f1f77bcf86cd799439002",
        name: "Portland Cement",
        unit: "Bags",
        unitPrice: 10,
      }),
    } as unknown as ReturnType<typeof MaterialModel.findById>);

    const mockBalance = {
      _id: "507f1f77bcf86cd799439003",
      locationId: "507f1f77bcf86cd799439001",
      materialId: "507f1f77bcf86cd799439002",
      quantity: 100,
      reservedQuantity: 0,
      availableQuantity: 100,
      averageUnitCost: 10,
      save: vi.fn().mockResolvedValue(true),
    };

    vi.spyOn(InventoryBalanceModel, "findOne").mockReturnValue({
      exec: vi.fn().mockResolvedValue(mockBalance),
    } as unknown as ReturnType<typeof InventoryBalanceModel.findOne>);

    vi.spyOn(InventoryTransactionModel, "countDocuments").mockResolvedValue(0);
    vi.spyOn(InventoryTransactionModel, "create").mockResolvedValue({
      _id: "507f1f77bcf86cd799439004",
      transactionNumber: "TXN-2026-00001",
      transactionType: "RECEIPT",
      quantity: 50,
    } as unknown as IInventoryTransaction);

    vi.spyOn(AuditLogModel, "create").mockResolvedValue({} as unknown as IAuditLog);

    const result = await inventoryService.receiveMaterials(
      {
        locationId: "507f1f77bcf86cd799439001",
        materialId: "507f1f77bcf86cd799439002",
        quantity: 50,
        unitCost: 16,
      },
      "507f1f77bcf86cd799439099"
    );

    // Initial total cost: 100 * 10 = 1000. New receipt: 50 * 16 = 800. Total = 1800 / 150 = 12
    expect(result.balance.quantity).toBe(150);
    expect(result.balance.averageUnitCost).toBe(12);
    expect(result.transaction.transactionType).toBe("RECEIPT");
  });

  it("should prevent issuance exceeding available stock (Negative Stock Protection)", async () => {
    vi.spyOn(InventoryLocationModel, "findById").mockReturnValue({
      exec: vi.fn().mockResolvedValue({
        _id: "507f1f77bcf86cd799439001",
        name: "Project Store",
      }),
    } as unknown as ReturnType<typeof InventoryLocationModel.findById>);

    vi.spyOn(MaterialModel, "findById").mockReturnValue({
      exec: vi.fn().mockResolvedValue({
        _id: "507f1f77bcf86cd799439002",
        name: "Portland Cement",
        unit: "Bags",
      }),
    } as unknown as ReturnType<typeof MaterialModel.findById>);

    vi.spyOn(InventoryBalanceModel, "findOne").mockReturnValue({
      exec: vi.fn().mockResolvedValue({
        quantity: 20,
        reservedQuantity: 5,
        availableQuantity: 15,
      }),
    } as unknown as ReturnType<typeof InventoryBalanceModel.findOne>);

    await expect(
      inventoryService.issueMaterials(
        {
          locationId: "507f1f77bcf86cd799439001",
          materialId: "507f1f77bcf86cd799439002",
          quantity: 25, // Available is only 15
        },
        "507f1f77bcf86cd799439099"
      )
    ).rejects.toThrow(BadRequestError);
  });

  it("should issue materials, reduce balance, and record ISSUE transaction", async () => {
    vi.spyOn(InventoryLocationModel, "findById").mockReturnValue({
      exec: vi.fn().mockResolvedValue({
        _id: "507f1f77bcf86cd799439001",
        name: "Project Store",
      }),
    } as unknown as ReturnType<typeof InventoryLocationModel.findById>);

    vi.spyOn(MaterialModel, "findById").mockReturnValue({
      exec: vi.fn().mockResolvedValue({
        _id: "507f1f77bcf86cd799439002",
        name: "Portland Cement",
        unit: "Bags",
      }),
    } as unknown as ReturnType<typeof MaterialModel.findById>);

    const mockBalance = {
      quantity: 100,
      reservedQuantity: 0,
      availableQuantity: 100,
      averageUnitCost: 10,
      save: vi.fn().mockResolvedValue(true),
    };

    vi.spyOn(InventoryBalanceModel, "findOne").mockReturnValue({
      exec: vi.fn().mockResolvedValue(mockBalance),
    } as unknown as ReturnType<typeof InventoryBalanceModel.findOne>);

    vi.spyOn(InventoryTransactionModel, "countDocuments").mockResolvedValue(1);
    vi.spyOn(InventoryTransactionModel, "create").mockResolvedValue({
      _id: "507f1f77bcf86cd799439005",
      transactionNumber: "TXN-2026-00002",
      transactionType: "ISSUE",
      quantity: 30,
    } as unknown as IInventoryTransaction);

    vi.spyOn(AuditLogModel, "create").mockResolvedValue({} as unknown as IAuditLog);

    const result = await inventoryService.issueMaterials(
      {
        locationId: "507f1f77bcf86cd799439001",
        materialId: "507f1f77bcf86cd799439002",
        quantity: 30,
      },
      "507f1f77bcf86cd799439099"
    );

    expect(result.balance.quantity).toBe(70);
    expect(result.transaction.transactionType).toBe("ISSUE");
  });

  it("should perform dual-entry transfer between locations", async () => {
    vi.spyOn(InventoryLocationModel, "findById")
      .mockReturnValueOnce({
        exec: vi.fn().mockResolvedValue({
          _id: "507f1f77bcf86cd799439001",
          name: "Central Warehouse",
        }),
      } as unknown as ReturnType<typeof InventoryLocationModel.findById>)
      .mockReturnValueOnce({
        exec: vi.fn().mockResolvedValue({
          _id: "507f1f77bcf86cd799439002",
          name: "Site Store Alpha",
        }),
      } as unknown as ReturnType<typeof InventoryLocationModel.findById>);

    vi.spyOn(MaterialModel, "findById").mockReturnValue({
      exec: vi.fn().mockResolvedValue({
        _id: "507f1f77bcf86cd799439010",
        name: "Steel Rebar",
        unit: "Tons",
        unitPrice: 800,
      }),
    } as unknown as ReturnType<typeof MaterialModel.findById>);

    const mockFromBalance = {
      quantity: 50,
      reservedQuantity: 0,
      availableQuantity: 50,
      averageUnitCost: 800,
      save: vi.fn().mockResolvedValue(true),
    };

    const mockToBalance = {
      quantity: 10,
      reservedQuantity: 0,
      availableQuantity: 10,
      averageUnitCost: 800,
      save: vi.fn().mockResolvedValue(true),
    };

    vi.spyOn(InventoryBalanceModel, "findOne")
      .mockReturnValueOnce({
        exec: vi.fn().mockResolvedValue(mockFromBalance),
      } as unknown as ReturnType<typeof InventoryBalanceModel.findOne>)
      .mockReturnValueOnce({
        exec: vi.fn().mockResolvedValue(mockToBalance),
      } as unknown as ReturnType<typeof InventoryBalanceModel.findOne>);

    vi.spyOn(InventoryTransactionModel, "countDocuments").mockResolvedValue(2);
    vi.spyOn(InventoryTransactionModel, "create")
      .mockResolvedValueOnce({
        _id: "507f1f77bcf86cd799439090",
        transactionType: "TRANSFER_OUT",
        quantity: 15,
      } as unknown as IInventoryTransaction)
      .mockResolvedValueOnce({
        _id: "507f1f77bcf86cd799439091",
        transactionType: "TRANSFER_IN",
        quantity: 15,
      } as unknown as IInventoryTransaction);

    vi.spyOn(AuditLogModel, "create").mockResolvedValue({} as unknown as IAuditLog);

    const result = await inventoryService.transferMaterials(
      {
        fromLocationId: "507f1f77bcf86cd799439001",
        toLocationId: "507f1f77bcf86cd799439002",
        materialId: "507f1f77bcf86cd799439010",
        quantity: 15,
      },
      "507f1f77bcf86cd799439099"
    );

    expect(result.fromBalance.quantity).toBe(35);
    expect(result.toBalance.quantity).toBe(25);
    expect(result.outTransaction.transactionType).toBe("TRANSFER_OUT");
    expect(result.inTransaction.transactionType).toBe("TRANSFER_IN");
  });

  it("should trigger low stock alerts when available stock drops below threshold", async () => {
    vi.spyOn(InventoryBalanceModel, "find").mockReturnValue({
      populate: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([
        {
          _id: "507f1f77bcf86cd799439001",
          quantity: 15,
          reservedQuantity: 5,
          availableQuantity: 10,
          materialId: {
            name: "Portland Cement",
            unit: "Bags",
            minimumStock: 20, // Threshold is 20, available is 10 -> Low stock alert
            reorderLevel: 50,
          },
          locationId: { name: "Central Store" },
        },
      ]),
    } as unknown as ReturnType<typeof InventoryBalanceModel.find>);

    const alerts = await inventoryService.getStockAlerts();
    expect(alerts.length).toBe(1);
    expect(alerts[0].type).toBe("CRITICAL_LOW_STOCK");
    expect(alerts[0].availableQuantity).toBe(10);
  });
});
