import { Request, Response, NextFunction } from "express";
import vendorService from "./vendor.service.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { VendorStatus } from "./vendor.model.js";

export class VendorController {
  async getVendors(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search, status, materialId, page, limit } = req.query;
      const result = await vendorService.getVendors({
        search: search as string,
        status: status as VendorStatus,
        materialId: materialId as string,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });
      sendSuccess(res, result.vendors, result.pagination, 200, "Vendors retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  async getVendorById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const vendor = await vendorService.getVendorById(id);
      sendSuccess(res, vendor, undefined, 200, "Vendor details retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  async createVendor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = req.user?._id?.toString();
      const vendor = await vendorService.createVendor(req.body, actorId);
      sendSuccess(res, vendor, undefined, 201, "Vendor created successfully");
    } catch (error) {
      next(error);
    }
  }

  async updateVendor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const actorId = req.user?._id?.toString();
      const vendor = await vendorService.updateVendor(id, req.body, actorId);
      sendSuccess(res, vendor, undefined, 200, "Vendor updated successfully");
    } catch (error) {
      next(error);
    }
  }
}

export const vendorController = new VendorController();
export default vendorController;
