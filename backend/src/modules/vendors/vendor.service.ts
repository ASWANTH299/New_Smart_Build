import mongoose from "mongoose";
import VendorModel, { IVendor, VendorStatus } from "./vendor.model.js";
import { NotFoundError, ConflictError, BadRequestError } from "../../utils/AppError.js";
import { logAuditAction } from "../audit/auditLog.model.js";

export interface GetVendorsFilter {
  search?: string;
  status?: VendorStatus;
  materialId?: string;
  page?: number;
  limit?: number;
}

export class VendorService {
  async getVendors(filter: GetVendorsFilter = {}): Promise<{
    vendors: IVendor[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filter.limit) || 20));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};

    if (filter.status) {
      query.status = filter.status;
    }

    if (filter.materialId && mongoose.Types.ObjectId.isValid(filter.materialId)) {
      query.materialsSupplied = new mongoose.Types.ObjectId(filter.materialId);
    }

    if (filter.search && filter.search.trim()) {
      const searchRegex = new RegExp(filter.search.trim(), "i");
      query.$or = [
        { name: searchRegex },
        { code: searchRegex },
        { "contact.name": searchRegex },
        { "contact.email": searchRegex },
        { "address.city": searchRegex },
      ];
    }

    const [vendors, total] = await Promise.all([
      VendorModel.find(query)
        .populate("materialsSupplied", "code name category unit unitPrice")
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      VendorModel.countDocuments(query),
    ]);

    return {
      vendors,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getVendorById(id: string): Promise<IVendor> {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError("Invalid vendor ID");
    }

    const vendor = await VendorModel.findById(id)
      .populate("materialsSupplied", "code name category unit unitPrice minimumStock reorderLevel")
      .exec();

    if (!vendor) {
      throw new NotFoundError("Vendor not found");
    }

    return vendor;
  }

  async createVendor(data: Partial<IVendor>, actorId?: string): Promise<IVendor> {
    const code = (data.code || "").trim().toUpperCase();
    if (!code) {
      throw new BadRequestError("Vendor code is required");
    }

    const existing = await VendorModel.findOne({ code }).exec();
    if (existing) {
      throw new ConflictError(`Vendor code '${code}' already exists`);
    }

    const vendor = new VendorModel({
      ...data,
      code,
    });

    await vendor.save();

    if (actorId) {
      await logAuditAction({
        action: "VENDOR_CREATED",
        entityType: "Vendor",
        entityId: vendor._id.toString(),
        actorUserId: actorId,
        metadata: { code: vendor.code, name: vendor.name },
      });
    }

    return vendor;
  }

  async updateVendor(
    id: string,
    data: Partial<IVendor>,
    actorId?: string
  ): Promise<IVendor> {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError("Invalid vendor ID");
    }

    const vendor = await VendorModel.findById(id).exec();
    if (!vendor) {
      throw new NotFoundError("Vendor not found");
    }

    // Do not allow updating vendor code
    const updateFields = { ...data };
    delete updateFields.code;

    Object.assign(vendor, updateFields);
    await vendor.save();

    if (actorId) {
      await logAuditAction({
        action: "VENDOR_UPDATED",
        entityType: "Vendor",
        entityId: vendor._id.toString(),
        actorUserId: actorId,
        metadata: { code: vendor.code, name: vendor.name, status: vendor.status },
      });
    }

    return vendor;
  }

  async updatePerformance(
    id: string,
    params: { rating?: number; isDeliveredOnTime?: boolean; notes?: string }
  ): Promise<IVendor> {
    const vendor = await this.getVendorById(id);

    const perf = vendor.performanceSummary || {
      rating: 5,
      totalOrders: 0,
      onTimeDeliveryRate: 100,
      notes: "",
    };

    const currentOrders = perf.totalOrders || 0;
    const newOrders = currentOrders + 1;

    let newRating = perf.rating;
    if (typeof params.rating === "number") {
      newRating = Number(((perf.rating * currentOrders + params.rating) / newOrders).toFixed(1));
    }

    let newOnTimeRate = perf.onTimeDeliveryRate;
    if (typeof params.isDeliveredOnTime === "boolean") {
      const onTimeCount = Math.round(((perf.onTimeDeliveryRate || 100) / 100) * currentOrders);
      const updatedOnTimeCount = onTimeCount + (params.isDeliveredOnTime ? 1 : 0);
      newOnTimeRate = Number(((updatedOnTimeCount / newOrders) * 100).toFixed(1));
    }

    vendor.performanceSummary = {
      rating: Math.min(5, Math.max(1, newRating)),
      totalOrders: newOrders,
      onTimeDeliveryRate: Math.min(100, Math.max(0, newOnTimeRate)),
      notes: params.notes || perf.notes,
    };

    await vendor.save();
    return vendor;
  }
}

export const vendorService = new VendorService();
export default vendorService;
