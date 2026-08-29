import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { UserModel } from "../users/user.model.js";
import InventoryLocationModel from "./inventoryLocation.model.js";
import InventoryBalanceModel from "./inventoryBalance.model.js";
import MaterialModel from "../materials/material.model.js";
import InventoryTransactionModel, { IInventoryTransaction } from "./inventoryTransaction.model.js";
import { AuditLogModel, IAuditLog } from "../audit/auditLog.model.js";
import { generateJwtToken } from "../../utils/jwt.js";

describe("Inventory API Integration Tests (Phase 8)", () => {
  const app = createApp();

  const storeManagerToken = generateJwtToken({
    userId: "507f1f77bcf86cd799439011",
    email: "store@smartbuild.com",
    role: "STORE_MANAGER",
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should return inventory balances for store manager", async () => {
    vi.spyOn(UserModel, "findById").mockReturnValue({
      exec: vi.fn().mockResolvedValue({
        _id: "507f1f77bcf86cd799439011",
        primaryRole: "STORE_MANAGER",
        status: "ACTIVE",
      }),
    } as unknown as ReturnType<typeof UserModel.findById>);

    vi.spyOn(InventoryBalanceModel, "find").mockReturnValue({
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([
        {
          _id: "507f1f77bcf86cd799439001",
          quantity: 250,
          reservedQuantity: 0,
          availableQuantity: 250,
          averageUnitCost: 15,
          materialId: { name: "Concrete Mix", unit: "Bags", minimumStock: 50 },
          locationId: { name: "Central Warehouse" },
        },
      ]),
    } as unknown as ReturnType<typeof InventoryBalanceModel.find>);

    vi.spyOn(InventoryBalanceModel, "countDocuments").mockResolvedValue(1);

    const res = await request(app)
      .get("/api/v1/inventory/balances")
      .set("Authorization", `Bearer ${storeManagerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data[0].quantity).toBe(250);
  });

  it("should process receipt of materials and update inventory", async () => {
    vi.spyOn(UserModel, "findById").mockReturnValue({
      exec: vi.fn().mockResolvedValue({
        _id: "507f1f77bcf86cd799439011",
        primaryRole: "STORE_MANAGER",
        status: "ACTIVE",
      }),
    } as unknown as ReturnType<typeof UserModel.findById>);

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
        name: "Concrete Mix",
        unit: "Bags",
        unitPrice: 15,
      }),
    } as unknown as ReturnType<typeof MaterialModel.findById>);

    const mockBalance = {
      _id: "507f1f77bcf86cd799439003",
      locationId: "507f1f77bcf86cd799439001",
      materialId: "507f1f77bcf86cd799439002",
      quantity: 50,
      reservedQuantity: 0,
      availableQuantity: 50,
      averageUnitCost: 15,
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

    const res = await request(app)
      .post("/api/v1/inventory/receive")
      .set("Authorization", `Bearer ${storeManagerToken}`)
      .send({
        locationId: "507f1f77bcf86cd799439001",
        materialId: "507f1f77bcf86cd799439002",
        quantity: 50,
        unitCost: 15,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.balance.quantity).toBe(100);
  });
});
