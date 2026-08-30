import { z } from "zod";

export const vendorContactSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email().trim().toLowerCase(),
  phone: z.string().min(5).max(30).trim(),
  designation: z.string().max(100).trim().optional(),
});

export const vendorAddressSchema = z.object({
  street: z.string().max(200).trim().optional(),
  city: z.string().min(2).max(100).trim(),
  state: z.string().max(100).trim().optional(),
  postalCode: z.string().max(20).trim().optional(),
  country: z.string().min(2).max(100).trim().default("India"),
});

export const vendorPerformanceSchema = z.object({
  rating: z.number().min(1).max(5).default(5),
  totalOrders: z.number().min(0).default(0),
  onTimeDeliveryRate: z.number().min(0).max(100).default(100),
  notes: z.string().max(1000).optional(),
});

export const createVendorSchema = {
  body: z.object({
    code: z.string().min(2).max(50).trim().toUpperCase(),
    name: z.string().min(2).max(200).trim(),
    contact: vendorContactSchema,
    address: vendorAddressSchema,
    materialsSupplied: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Material ID")).optional(),
    status: z.enum(["ACTIVE", "INACTIVE", "BLACKLISTED"]).default("ACTIVE"),
    performanceSummary: vendorPerformanceSchema.optional(),
  }),
};

export const updateVendorSchema = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Vendor ID"),
  }),
  body: z.object({
    name: z.string().min(2).max(200).trim().optional(),
    contact: vendorContactSchema.partial().optional(),
    address: vendorAddressSchema.partial().optional(),
    materialsSupplied: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Material ID")).optional(),
    status: z.enum(["ACTIVE", "INACTIVE", "BLACKLISTED"]).optional(),
    performanceSummary: vendorPerformanceSchema.partial().optional(),
  }),
};

export const getVendorsQuerySchema = {
  query: z.object({
    search: z.string().optional(),
    status: z.enum(["ACTIVE", "INACTIVE", "BLACKLISTED"]).optional(),
    materialId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Material ID").optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  }),
};
