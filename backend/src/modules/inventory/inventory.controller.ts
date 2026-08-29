import { Request, Response, NextFunction } from "express";
import inventoryService from "./inventory.service.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { InventoryTransactionType } from "./inventoryTransaction.model.js";

export class InventoryController {
  async getLocations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { projectId } = req.query;
      const locations = await inventoryService.getLocations(projectId as string);
      sendSuccess(res, locations, undefined, 200, "Inventory locations retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  async getLocationById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const location = await inventoryService.getLocationById(id);
      sendSuccess(res, location, undefined, 200, "Location details retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  async createLocation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = req.user?._id?.toString();
      const location = await inventoryService.createLocation(req.body, actorId);
      sendSuccess(res, location, undefined, 201, "Inventory location created successfully");
    } catch (error) {
      next(error);
    }
  }

  async getBalances(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { locationId, materialId, projectId, lowStockOnly, page, limit } = req.query;
      const result = await inventoryService.getBalances({
        locationId: locationId as string,
        materialId: materialId as string,
        projectId: projectId as string,
        lowStockOnly: lowStockOnly === "true",
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });
      sendSuccess(res, result.balances, result.pagination, 200, "Inventory balances retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  async getStockAlerts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { projectId } = req.query;
      const alerts = await inventoryService.getStockAlerts(projectId as string);
      sendSuccess(res, alerts, undefined, 200, "Stock threshold alerts retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  async receiveMaterials(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = req.user?._id?.toString() || "";
      const result = await inventoryService.receiveMaterials(req.body, actorId);
      sendSuccess(res, result, undefined, 201, "Materials received into inventory successfully");
    } catch (error) {
      next(error);
    }
  }

  async issueMaterials(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = req.user?._id?.toString() || "";
      const result = await inventoryService.issueMaterials(req.body, actorId);
      sendSuccess(res, result, undefined, 200, "Materials issued successfully");
    } catch (error) {
      next(error);
    }
  }

  async returnMaterials(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = req.user?._id?.toString() || "";
      const result = await inventoryService.returnMaterials(req.body, actorId);
      sendSuccess(res, result, undefined, 201, "Materials returned to store successfully");
    } catch (error) {
      next(error);
    }
  }

  async transferMaterials(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = req.user?._id?.toString() || "";
      const result = await inventoryService.transferMaterials(req.body, actorId);
      sendSuccess(res, result, undefined, 201, "Materials transferred successfully");
    } catch (error) {
      next(error);
    }
  }

  async adjustStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = req.user?._id?.toString() || "";
      const result = await inventoryService.adjustStock(req.body, actorId);
      sendSuccess(res, result, undefined, 200, "Stock adjusted successfully");
    } catch (error) {
      next(error);
    }
  }

  async consumeMaterials(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = req.user?._id?.toString() || "";
      const result = await inventoryService.consumeMaterials(req.body, actorId);
      sendSuccess(res, result, undefined, 201, "Materials consumption recorded successfully");
    } catch (error) {
      next(error);
    }
  }

  async getTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { locationId, materialId, projectId, transactionType, page, limit } = req.query;
      const result = await inventoryService.getTransactions({
        locationId: locationId as string,
        materialId: materialId as string,
        projectId: projectId as string,
        transactionType: transactionType as InventoryTransactionType,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });
      sendSuccess(res, result.transactions, result.pagination, 200, "Inventory transactions retrieved successfully");
    } catch (error) {
      next(error);
    }
  }
}

export const inventoryController = new InventoryController();
export default inventoryController;
