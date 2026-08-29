import mongoose from "mongoose";
import InventoryLocationModel, {
  IInventoryLocation,
  InventoryLocationType,
} from "./inventoryLocation.model.js";
import InventoryBalanceModel, { IInventoryBalance } from "./inventoryBalance.model.js";
import InventoryTransactionModel, {
  IInventoryTransaction,
  InventoryTransactionType,
  InventoryReferenceType,
} from "./inventoryTransaction.model.js";
import MaterialModel from "../materials/material.model.js";
import { NotFoundError, BadRequestError, ConflictError } from "../../utils/AppError.js";
import { logAuditAction } from "../audit/auditLog.model.js";

export interface GetBalancesFilter {
  locationId?: string;
  materialId?: string;
  projectId?: string;
  lowStockOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface StockAlert {
  type: "CRITICAL_LOW_STOCK" | "REORDER_LEVEL_REACHED";
  balanceId: string;
  material: unknown;
  location: unknown;
  availableQuantity: number;
  threshold: number;
  message: string;
}

export interface RawPopulatedBalance {
  _id: mongoose.Types.ObjectId;
  locationId?: { _id: mongoose.Types.ObjectId; name: string; type: string };
  materialId?: { _id: mongoose.Types.ObjectId; name: string; code: string; unit: string; minimumStock?: number; reorderLevel?: number };
  quantity: number;
  reservedQuantity: number;
  availableQuantity?: number;
  averageUnitCost?: number;
}

export interface GetTransactionsFilter {
  locationId?: string;
  materialId?: string;
  projectId?: string;
  transactionType?: InventoryTransactionType;
  page?: number;
  limit?: number;
}

export class InventoryService {
  // Helper to generate transaction number
  private async generateTransactionNumber(): Promise<string> {
    const count = await InventoryTransactionModel.countDocuments();
    const year = new Date().getFullYear();
    return `TXN-${year}-${String(count + 1).padStart(5, "0")}`;
  }

  // --- Location Management ---
  async getLocations(projectId?: string): Promise<IInventoryLocation[]> {
    const query: Record<string, unknown> = { status: "ACTIVE" };
    if (projectId) {
      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new BadRequestError("Invalid project ID format");
      }
      query.$or = [
        { type: "CENTRAL_WAREHOUSE" },
        { projectId: new mongoose.Types.ObjectId(projectId) },
      ];
    }
    return InventoryLocationModel.find(query).sort({ type: 1, name: 1 }).lean() as unknown as IInventoryLocation[];
  }

  async getLocationById(id: string): Promise<IInventoryLocation> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError("Invalid location ID format");
    }
    const location = await InventoryLocationModel.findById(id).exec();
    if (!location) {
      throw new NotFoundError("Inventory location not found");
    }
    return location;
  }

  async createLocation(
    data: {
      name: string;
      code: string;
      type: InventoryLocationType;
      projectId?: string;
      address?: string;
      status?: "ACTIVE" | "INACTIVE";
      managerId?: string;
    },
    actorId?: string
  ): Promise<IInventoryLocation> {
    const normalizedCode = data.code.trim().toUpperCase();
    const existing = await InventoryLocationModel.findOne({ code: normalizedCode });
    if (existing) {
      throw new ConflictError(`Inventory location with code '${normalizedCode}' already exists`);
    }

    const location = await InventoryLocationModel.create({
      ...data,
      code: normalizedCode,
      projectId: data.projectId ? new mongoose.Types.ObjectId(data.projectId) : null,
      managerId: data.managerId ? new mongoose.Types.ObjectId(data.managerId) : null,
    });

    await logAuditAction({
      actorUserId: actorId,
      action: "INVENTORY_LOCATION_CREATED",
      entityType: "InventoryLocation",
      entityId: location._id.toString(),
      projectId: data.projectId || null,
      metadata: { code: location.code, name: location.name, type: location.type },
    });

    return location;
  }

  // --- Balance Queries & Stock Checks ---
  async getBalances(filter: GetBalancesFilter = {}): Promise<{
    balances: Array<IInventoryBalance & { material?: unknown; location?: unknown; isLowStock?: boolean; isReorderNeeded?: boolean }>;
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(filter.limit) || 20));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};

    if (filter.locationId) {
      if (!mongoose.Types.ObjectId.isValid(filter.locationId)) {
        throw new BadRequestError("Invalid location ID format");
      }
      query.locationId = new mongoose.Types.ObjectId(filter.locationId);
    }

    if (filter.materialId) {
      if (!mongoose.Types.ObjectId.isValid(filter.materialId)) {
        throw new BadRequestError("Invalid material ID format");
      }
      query.materialId = new mongoose.Types.ObjectId(filter.materialId);
    }

    const [rawBalances, total] = await Promise.all([
      InventoryBalanceModel.find(query)
        .populate("materialId")
        .populate("locationId")
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      InventoryBalanceModel.countDocuments(query),
    ]);

    const enrichedBalances = (rawBalances as unknown as RawPopulatedBalance[]).map((b) => {
      const minStock = b.materialId?.minimumStock || 0;
      const reorderLvl = b.materialId?.reorderLevel || 0;
      const avail = b.availableQuantity ?? Math.max(0, b.quantity - (b.reservedQuantity || 0));

      return {
        ...b,
        material: b.materialId,
        location: b.locationId,
        availableQuantity: avail,
        isLowStock: avail <= minStock && minStock > 0,
        isReorderNeeded: avail <= reorderLvl && reorderLvl > 0,
      };
    });

    const finalBalances = filter.lowStockOnly
      ? enrichedBalances.filter((b) => b.isLowStock || b.isReorderNeeded)
      : enrichedBalances;

    return {
      balances: finalBalances as unknown as Array<IInventoryBalance & { material?: unknown; location?: unknown; isLowStock?: boolean; isReorderNeeded?: boolean }>,
      pagination: {
        total: filter.lowStockOnly ? finalBalances.length : total,
        page,
        limit,
        totalPages: Math.ceil((filter.lowStockOnly ? finalBalances.length : total) / limit) || 1,
      },
    };
  }

  async getStockAlerts(projectId?: string): Promise<StockAlert[]> {
    let locationIds: mongoose.Types.ObjectId[] = [];
    if (projectId && mongoose.Types.ObjectId.isValid(projectId)) {
      const locations = await InventoryLocationModel.find({
        $or: [{ projectId }, { type: "CENTRAL_WAREHOUSE" }],
      }).select("_id");
      locationIds = locations.map((l) => l._id);
    }

    const query: Record<string, unknown> = {};
    if (locationIds.length > 0) {
      query.locationId = { $in: locationIds };
    }

    const balances = await InventoryBalanceModel.find(query)
      .populate("materialId")
      .populate("locationId")
      .lean();

    const alerts: StockAlert[] = [];

    for (const b of balances as unknown as RawPopulatedBalance[]) {
      if (!b.materialId) continue;
      const minStock = b.materialId.minimumStock || 0;
      const reorderLvl = b.materialId.reorderLevel || 0;
      const avail = b.availableQuantity ?? Math.max(0, b.quantity - (b.reservedQuantity || 0));

      if (minStock > 0 && avail <= minStock) {
        alerts.push({
          type: "CRITICAL_LOW_STOCK",
          balanceId: b._id.toString(),
          material: b.materialId,
          location: b.locationId,
          availableQuantity: avail,
          threshold: minStock,
          message: `Stock for ${b.materialId.name} (${avail} ${b.materialId.unit}) is at or below minimum threshold (${minStock}).`,
        });
      } else if (reorderLvl > 0 && avail <= reorderLvl) {
        alerts.push({
          type: "REORDER_LEVEL_REACHED",
          balanceId: b._id.toString(),
          material: b.materialId,
          location: b.locationId,
          availableQuantity: avail,
          threshold: reorderLvl,
          message: `Stock for ${b.materialId.name} (${avail} ${b.materialId.unit}) reached reorder level (${reorderLvl}).`,
        });
      }
    }

    return alerts;
  }

  // --- Transactions & Balance Ledger Processing ---
  async receiveMaterials(
    params: {
      locationId: string;
      materialId: string;
      quantity: number;
      unitCost?: number;
      referenceType?: InventoryReferenceType;
      referenceId?: string;
      projectId?: string;
      reason?: string;
    },
    actorId: string
  ): Promise<{ transaction: IInventoryTransaction; balance: IInventoryBalance }> {
    const qty = Number(params.quantity);
    if (qty <= 0) {
      throw new BadRequestError("Received quantity must be positive");
    }

    const [location, material] = await Promise.all([
      this.getLocationById(params.locationId),
      MaterialModel.findById(params.materialId).exec(),
    ]);

    if (!material) {
      throw new NotFoundError("Material not found");
    }

    // Find or create balance record
    let balance = await InventoryBalanceModel.findOne({
      locationId: location._id,
      materialId: material._id,
    }).exec();

    const unitCost = Number(params.unitCost) || material.unitPrice || 0;
    const totalCost = qty * unitCost;

    if (!balance) {
      balance = new InventoryBalanceModel({
        locationId: location._id,
        materialId: material._id,
        quantity: qty,
        reservedQuantity: 0,
        availableQuantity: qty,
        averageUnitCost: unitCost,
      });
    } else {
      const currentTotalCost = balance.quantity * balance.averageUnitCost;
      const newTotalQuantity = balance.quantity + qty;
      const newAverageUnitCost =
        newTotalQuantity > 0 ? (currentTotalCost + totalCost) / newTotalQuantity : unitCost;

      balance.quantity = newTotalQuantity;
      balance.averageUnitCost = Number(newAverageUnitCost.toFixed(2));
      balance.availableQuantity = Math.max(0, balance.quantity - balance.reservedQuantity);
    }

    await balance.save();

    const transactionNumber = await this.generateTransactionNumber();
    const transaction = await InventoryTransactionModel.create({
      transactionNumber,
      projectId: params.projectId ? new mongoose.Types.ObjectId(params.projectId) : location.projectId,
      locationId: location._id,
      materialId: material._id,
      transactionType: "RECEIPT",
      quantity: qty,
      unitCost,
      totalCost,
      referenceType: params.referenceType || "DIRECT_RECEIPT",
      referenceId: params.referenceId ? new mongoose.Types.ObjectId(params.referenceId) : null,
      performedBy: new mongoose.Types.ObjectId(actorId),
      reason: params.reason || "Material received into inventory location",
      timestamp: new Date(),
    });

    await logAuditAction({
      actorUserId: actorId,
      action: "INVENTORY_RECEIPT",
      entityType: "InventoryTransaction",
      entityId: transaction._id.toString(),
      projectId: params.projectId || (location.projectId ? location.projectId.toString() : null),
      metadata: {
        locationId: location._id,
        materialId: material._id,
        quantity: qty,
        newBalance: balance.quantity,
      },
    });

    return { transaction, balance };
  }

  async issueMaterials(
    params: {
      locationId: string;
      materialId: string;
      quantity: number;
      referenceType?: InventoryReferenceType;
      referenceId?: string;
      projectId?: string;
      reason?: string;
    },
    actorId: string
  ): Promise<{ transaction: IInventoryTransaction; balance: IInventoryBalance }> {
    const qty = Number(params.quantity);
    if (qty <= 0) {
      throw new BadRequestError("Issued quantity must be positive");
    }

    const [location, material] = await Promise.all([
      this.getLocationById(params.locationId),
      MaterialModel.findById(params.materialId).exec(),
    ]);

    if (!material) {
      throw new NotFoundError("Material not found");
    }

    const balance = await InventoryBalanceModel.findOne({
      locationId: location._id,
      materialId: material._id,
    }).exec();

    const currentAvail = balance ? balance.availableQuantity : 0;
    if (!balance || currentAvail < qty) {
      throw new BadRequestError(
        `Insufficient available stock for '${material.name}'. Available: ${currentAvail} ${material.unit}, Requested to issue: ${qty} ${material.unit}`
      );
    }

    // Negative stock prevention
    balance.quantity -= qty;
    balance.availableQuantity = Math.max(0, balance.quantity - balance.reservedQuantity);
    await balance.save();

    const unitCost = balance.averageUnitCost || material.unitPrice || 0;
    const totalCost = qty * unitCost;

    const transactionNumber = await this.generateTransactionNumber();
    const transaction = await InventoryTransactionModel.create({
      transactionNumber,
      projectId: params.projectId ? new mongoose.Types.ObjectId(params.projectId) : location.projectId,
      locationId: location._id,
      materialId: material._id,
      transactionType: "ISSUE",
      quantity: qty,
      unitCost,
      totalCost,
      referenceType: params.referenceType || "MATERIAL_REQUEST",
      referenceId: params.referenceId ? new mongoose.Types.ObjectId(params.referenceId) : null,
      performedBy: new mongoose.Types.ObjectId(actorId),
      reason: params.reason || "Material issued from inventory store",
      timestamp: new Date(),
    });

    await logAuditAction({
      actorUserId: actorId,
      action: "INVENTORY_ISSUE",
      entityType: "InventoryTransaction",
      entityId: transaction._id.toString(),
      projectId: params.projectId || (location.projectId ? location.projectId.toString() : null),
      metadata: {
        locationId: location._id,
        materialId: material._id,
        quantity: qty,
        remainingBalance: balance.quantity,
      },
    });

    return { transaction, balance };
  }

  async returnMaterials(
    params: {
      locationId: string;
      materialId: string;
      quantity: number;
      referenceType?: InventoryReferenceType;
      referenceId?: string;
      projectId?: string;
      reason?: string;
    },
    actorId: string
  ): Promise<{ transaction: IInventoryTransaction; balance: IInventoryBalance }> {
    const qty = Number(params.quantity);
    if (qty <= 0) {
      throw new BadRequestError("Return quantity must be positive");
    }

    const [location, material] = await Promise.all([
      this.getLocationById(params.locationId),
      MaterialModel.findById(params.materialId).exec(),
    ]);

    if (!material) {
      throw new NotFoundError("Material not found");
    }

    let balance = await InventoryBalanceModel.findOne({
      locationId: location._id,
      materialId: material._id,
    }).exec();

    const unitCost = material.unitPrice || 0;

    if (!balance) {
      balance = new InventoryBalanceModel({
        locationId: location._id,
        materialId: material._id,
        quantity: qty,
        reservedQuantity: 0,
        availableQuantity: qty,
        averageUnitCost: unitCost,
      });
    } else {
      balance.quantity += qty;
      balance.availableQuantity = Math.max(0, balance.quantity - balance.reservedQuantity);
    }

    await balance.save();

    const transactionNumber = await this.generateTransactionNumber();
    const transaction = await InventoryTransactionModel.create({
      transactionNumber,
      projectId: params.projectId ? new mongoose.Types.ObjectId(params.projectId) : location.projectId,
      locationId: location._id,
      materialId: material._id,
      transactionType: "RETURN",
      quantity: qty,
      unitCost: balance.averageUnitCost,
      totalCost: qty * balance.averageUnitCost,
      referenceType: params.referenceType || "MATERIAL_REQUEST",
      referenceId: params.referenceId ? new mongoose.Types.ObjectId(params.referenceId) : null,
      performedBy: new mongoose.Types.ObjectId(actorId),
      reason: params.reason || "Material returned to inventory store",
      timestamp: new Date(),
    });

    await logAuditAction({
      actorUserId: actorId,
      action: "INVENTORY_RETURN",
      entityType: "InventoryTransaction",
      entityId: transaction._id.toString(),
      projectId: params.projectId || null,
      metadata: { locationId: location._id, materialId: material._id, quantity: qty },
    });

    return { transaction, balance };
  }

  async transferMaterials(
    params: {
      fromLocationId: string;
      toLocationId: string;
      materialId: string;
      quantity: number;
      projectId?: string;
      reason?: string;
    },
    actorId: string
  ): Promise<{
    outTransaction: IInventoryTransaction;
    inTransaction: IInventoryTransaction;
    fromBalance: IInventoryBalance;
    toBalance: IInventoryBalance;
  }> {
    if (params.fromLocationId === params.toLocationId) {
      throw new BadRequestError("Source and destination locations cannot be the same");
    }

    const qty = Number(params.quantity);
    if (qty <= 0) {
      throw new BadRequestError("Transfer quantity must be positive");
    }

    const [fromLoc, toLoc, material] = await Promise.all([
      this.getLocationById(params.fromLocationId),
      this.getLocationById(params.toLocationId),
      MaterialModel.findById(params.materialId).exec(),
    ]);

    if (!material) {
      throw new NotFoundError("Material not found");
    }

    // Check source location stock
    const fromBalance = await InventoryBalanceModel.findOne({
      locationId: fromLoc._id,
      materialId: material._id,
    }).exec();

    const available = fromBalance ? fromBalance.availableQuantity : 0;
    if (!fromBalance || available < qty) {
      throw new BadRequestError(
        `Insufficient available stock in ${fromLoc.name} for transfer. Available: ${available} ${material.unit}, Requested: ${qty} ${material.unit}`
      );
    }

    // Decrement fromBalance
    fromBalance.quantity -= qty;
    fromBalance.availableQuantity = Math.max(0, fromBalance.quantity - fromBalance.reservedQuantity);
    await fromBalance.save();

    // Increment toBalance
    let toBalance = await InventoryBalanceModel.findOne({
      locationId: toLoc._id,
      materialId: material._id,
    }).exec();

    const transferUnitCost = fromBalance.averageUnitCost || material.unitPrice || 0;
    const transferTotalCost = qty * transferUnitCost;

    if (!toBalance) {
      toBalance = new InventoryBalanceModel({
        locationId: toLoc._id,
        materialId: material._id,
        quantity: qty,
        reservedQuantity: 0,
        availableQuantity: qty,
        averageUnitCost: transferUnitCost,
      });
    } else {
      const currentToTotalCost = toBalance.quantity * toBalance.averageUnitCost;
      const newToQty = toBalance.quantity + qty;
      const newToAvgCost =
        newToQty > 0 ? (currentToTotalCost + transferTotalCost) / newToQty : transferUnitCost;

      toBalance.quantity = newToQty;
      toBalance.averageUnitCost = Number(newToAvgCost.toFixed(2));
      toBalance.availableQuantity = Math.max(0, toBalance.quantity - toBalance.reservedQuantity);
    }

    await toBalance.save();

    // Create dual transactions
    const txnNum1 = await this.generateTransactionNumber();
    const outTransaction = await InventoryTransactionModel.create({
      transactionNumber: `${txnNum1}-OUT`,
      projectId: params.projectId ? new mongoose.Types.ObjectId(params.projectId) : fromLoc.projectId,
      locationId: fromLoc._id,
      materialId: material._id,
      transactionType: "TRANSFER_OUT",
      quantity: qty,
      unitCost: transferUnitCost,
      totalCost: transferTotalCost,
      referenceType: "SITE_TRANSFER",
      fromLocationId: fromLoc._id,
      toLocationId: toLoc._id,
      performedBy: new mongoose.Types.ObjectId(actorId),
      reason: params.reason || `Transfer to ${toLoc.name}`,
      timestamp: new Date(),
    });

    const txnNum2 = await this.generateTransactionNumber();
    const inTransaction = await InventoryTransactionModel.create({
      transactionNumber: `${txnNum2}-IN`,
      projectId: params.projectId ? new mongoose.Types.ObjectId(params.projectId) : toLoc.projectId,
      locationId: toLoc._id,
      materialId: material._id,
      transactionType: "TRANSFER_IN",
      quantity: qty,
      unitCost: transferUnitCost,
      totalCost: transferTotalCost,
      referenceType: "SITE_TRANSFER",
      fromLocationId: fromLoc._id,
      toLocationId: toLoc._id,
      performedBy: new mongoose.Types.ObjectId(actorId),
      reason: params.reason || `Transfer from ${fromLoc.name}`,
      timestamp: new Date(),
    });

    await logAuditAction({
      actorUserId: actorId,
      action: "INVENTORY_TRANSFER",
      entityType: "InventoryTransaction",
      entityId: outTransaction._id.toString(),
      projectId: params.projectId || null,
      metadata: {
        fromLocationId: fromLoc._id,
        toLocationId: toLoc._id,
        materialId: material._id,
        quantity: qty,
      },
    });

    return { outTransaction, inTransaction, fromBalance, toBalance };
  }

  async adjustStock(
    params: {
      locationId: string;
      materialId: string;
      adjustedQuantity: number;
      adjustmentType?: "DELTA" | "SET_TOTAL";
      reason: string;
      projectId?: string;
    },
    actorId: string
  ): Promise<{ transaction: IInventoryTransaction; balance: IInventoryBalance }> {
    const [location, material] = await Promise.all([
      this.getLocationById(params.locationId),
      MaterialModel.findById(params.materialId).exec(),
    ]);

    if (!material) {
      throw new NotFoundError("Material not found");
    }

    let balance = await InventoryBalanceModel.findOne({
      locationId: location._id,
      materialId: material._id,
    }).exec();

    const unitCost = material.unitPrice || 0;
    const oldQty = balance ? balance.quantity : 0;
    let newQty = 0;
    let delta = 0;

    if (params.adjustmentType === "SET_TOTAL") {
      newQty = Number(params.adjustedQuantity);
      if (newQty < 0) {
        throw new BadRequestError("Total adjusted quantity cannot be negative");
      }
      delta = newQty - oldQty;
    } else {
      delta = Number(params.adjustedQuantity);
      newQty = oldQty + delta;
      if (newQty < 0) {
        throw new BadRequestError(
          `Adjustment of ${delta} would cause negative inventory balance (${newQty})`
        );
      }
    }

    if (!balance) {
      balance = new InventoryBalanceModel({
        locationId: location._id,
        materialId: material._id,
        quantity: newQty,
        reservedQuantity: 0,
        availableQuantity: newQty,
        averageUnitCost: unitCost,
      });
    } else {
      balance.quantity = newQty;
      balance.availableQuantity = Math.max(0, balance.quantity - balance.reservedQuantity);
    }

    await balance.save();

    const transactionNumber = await this.generateTransactionNumber();
    const transaction = await InventoryTransactionModel.create({
      transactionNumber,
      projectId: params.projectId ? new mongoose.Types.ObjectId(params.projectId) : location.projectId,
      locationId: location._id,
      materialId: material._id,
      transactionType: "ADJUSTMENT",
      quantity: delta,
      unitCost: balance.averageUnitCost,
      totalCost: Math.abs(delta) * balance.averageUnitCost,
      referenceType: "STOCK_ADJUSTMENT",
      performedBy: new mongoose.Types.ObjectId(actorId),
      reason: params.reason,
      timestamp: new Date(),
    });

    await logAuditAction({
      actorUserId: actorId,
      action: "INVENTORY_ADJUSTMENT",
      entityType: "InventoryTransaction",
      entityId: transaction._id.toString(),
      projectId: params.projectId || null,
      metadata: {
        locationId: location._id,
        materialId: material._id,
        oldQuantity: oldQty,
        newQuantity: newQty,
        delta,
        reason: params.reason,
      },
    });

    return { transaction, balance };
  }

  async consumeMaterials(
    params: {
      locationId: string;
      materialId: string;
      quantity: number;
      projectId: string;
      taskId?: string;
      reason?: string;
    },
    actorId: string
  ): Promise<{ transaction: IInventoryTransaction; balance: IInventoryBalance }> {
    const qty = Number(params.quantity);
    if (qty <= 0) {
      throw new BadRequestError("Consumed quantity must be positive");
    }

    const [location, material] = await Promise.all([
      this.getLocationById(params.locationId),
      MaterialModel.findById(params.materialId).exec(),
    ]);

    if (!material) {
      throw new NotFoundError("Material not found");
    }

    const balance = await InventoryBalanceModel.findOne({
      locationId: location._id,
      materialId: material._id,
    }).exec();

    const available = balance ? balance.availableQuantity : 0;
    if (!balance || available < qty) {
      throw new BadRequestError(
        `Insufficient available stock in ${location.name}. Available: ${available} ${material.unit}, Requested consumption: ${qty} ${material.unit}`
      );
    }

    balance.quantity -= qty;
    balance.availableQuantity = Math.max(0, balance.quantity - balance.reservedQuantity);
    await balance.save();

    const transactionNumber = await this.generateTransactionNumber();
    const transaction = await InventoryTransactionModel.create({
      transactionNumber,
      projectId: new mongoose.Types.ObjectId(params.projectId),
      locationId: location._id,
      materialId: material._id,
      transactionType: "CONSUMPTION",
      quantity: qty,
      unitCost: balance.averageUnitCost,
      totalCost: qty * balance.averageUnitCost,
      referenceType: "TASK_CONSUMPTION",
      referenceId: params.taskId ? new mongoose.Types.ObjectId(params.taskId) : null,
      performedBy: new mongoose.Types.ObjectId(actorId),
      reason: params.reason || "Direct material consumption on site task",
      timestamp: new Date(),
    });

    await logAuditAction({
      actorUserId: actorId,
      action: "INVENTORY_CONSUMPTION",
      entityType: "InventoryTransaction",
      entityId: transaction._id.toString(),
      projectId: params.projectId,
      metadata: {
        locationId: location._id,
        materialId: material._id,
        quantity: qty,
        taskId: params.taskId,
      },
    });

    return { transaction, balance };
  }

  async getTransactions(filter: GetTransactionsFilter = {}): Promise<{
    transactions: IInventoryTransaction[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(filter.limit) || 20));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};

    if (filter.locationId) {
      query.locationId = new mongoose.Types.ObjectId(filter.locationId);
    }
    if (filter.materialId) {
      query.materialId = new mongoose.Types.ObjectId(filter.materialId);
    }
    if (filter.projectId) {
      query.projectId = new mongoose.Types.ObjectId(filter.projectId);
    }
    if (filter.transactionType) {
      query.transactionType = filter.transactionType;
    }

    const [transactions, total] = await Promise.all([
      InventoryTransactionModel.find(query)
        .populate("materialId", "code name category unit")
        .populate("locationId", "name code type")
        .populate("fromLocationId", "name code")
        .populate("toLocationId", "name code")
        .populate("performedBy", "firstName lastName email")
        .sort({ timestamp: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      InventoryTransactionModel.countDocuments(query),
    ]);

    return {
      transactions: transactions as unknown as IInventoryTransaction[],
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }
}

export const inventoryService = new InventoryService();
export default inventoryService;
