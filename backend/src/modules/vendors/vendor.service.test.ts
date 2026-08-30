import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import { vendorService } from "./vendor.service.js";
import VendorModel from "./vendor.model.js";
import { BadRequestError, ConflictError, NotFoundError } from "../../utils/AppError.js";

vi.mock("./vendor.model.js");
vi.mock("../audit/auditLog.model.js", () => ({
  logAuditAction: vi.fn().mockResolvedValue({}),
}));

describe("VendorService Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getVendors", () => {
    it("should retrieve a paginated list of vendors", async () => {
      const mockVendors = [
        {
          _id: new mongoose.Types.ObjectId(),
          code: "VEN-001",
          name: "Apex Steel Ltd",
          status: "ACTIVE",
        },
      ];

      const mockQuery = {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue(mockVendors),
      };

      vi.spyOn(VendorModel, "find").mockReturnValue(mockQuery as unknown as ReturnType<typeof VendorModel.find>);
      vi.spyOn(VendorModel, "countDocuments").mockResolvedValue(1);

      const result = await vendorService.getVendors({ search: "Apex", status: "ACTIVE" });

      expect(result.vendors).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(VendorModel.find).toHaveBeenCalled();
    });
  });

  describe("getVendorById", () => {
    it("should throw BadRequestError for invalid ObjectId", async () => {
      await expect(vendorService.getVendorById("invalid-id")).rejects.toThrow(BadRequestError);
    });

    it("should throw NotFoundError if vendor is not found", async () => {
      const validId = new mongoose.Types.ObjectId().toString();
      const mockQuery = {
        populate: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue(null),
      };
      vi.spyOn(VendorModel, "findById").mockReturnValue(mockQuery as unknown as ReturnType<typeof VendorModel.findById>);

      await expect(vendorService.getVendorById(validId)).rejects.toThrow(NotFoundError);
    });

    it("should return vendor if found", async () => {
      const validId = new mongoose.Types.ObjectId();
      const mockVendor = {
        _id: validId,
        code: "VEN-001",
        name: "Apex Steel Ltd",
      };

      const mockQuery = {
        populate: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue(mockVendor),
      };
      vi.spyOn(VendorModel, "findById").mockReturnValue(mockQuery as unknown as ReturnType<typeof VendorModel.findById>);

      const result = await vendorService.getVendorById(validId.toString());
      expect(result.name).toBe("Apex Steel Ltd");
    });
  });

  describe("createVendor", () => {
    it("should throw ConflictError if vendor code already exists", async () => {
      vi.spyOn(VendorModel, "findOne").mockReturnValue({
        exec: vi.fn().mockResolvedValue({ _id: new mongoose.Types.ObjectId(), code: "VEN-001" }),
      } as unknown as ReturnType<typeof VendorModel.findOne>);

      await expect(
        vendorService.createVendor({
          code: "VEN-001",
          name: "Duplicate Vendor",
        })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe("updatePerformance", () => {
    it("should recalculate rating and on-time delivery rate", async () => {
      const validId = new mongoose.Types.ObjectId();
      const mockVendor = {
        _id: validId,
        code: "VEN-001",
        name: "Apex Steel Ltd",
        performanceSummary: {
          rating: 4.0,
          totalOrders: 1,
          onTimeDeliveryRate: 100,
          notes: "",
        },
        save: vi.fn().mockResolvedValue(true),
      };

      const mockQuery = {
        populate: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue(mockVendor),
      };
      vi.spyOn(VendorModel, "findById").mockReturnValue(mockQuery as unknown as ReturnType<typeof VendorModel.findById>);

      const updated = await vendorService.updatePerformance(validId.toString(), {
        rating: 5.0,
        isDeliveredOnTime: true,
      });

      expect(updated.performanceSummary.totalOrders).toBe(2);
      expect(updated.performanceSummary.rating).toBe(4.5);
      expect(updated.performanceSummary.onTimeDeliveryRate).toBe(100);
      expect(mockVendor.save).toHaveBeenCalled();
    });
  });
});
