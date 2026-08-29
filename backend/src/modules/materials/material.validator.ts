import { z } from "zod";

export const createMaterialSchema = {
  body: z.object({
    code: z.string().min(2).max(50).trim().toUpperCase(),
    name: z.string().min(2).max(200).trim(),
    category: z.string().min(2).max(100).trim(),
    unit: z.string().min(1).max(30).trim(),
    specifications: z.string().max(2000).optional(),
    minimumStock: z.number().min(0).default(0),
    reorderLevel: z.number().min(0).default(0),
    unitPrice: z.number().min(0).optional(),
    status: z.enum(["ACTIVE", "INACTIVE", "DISCONTINUED"]).default("ACTIVE"),
    notes: z.string().max(1000).optional(),
  }),
};

export const updateMaterialSchema = {
  body: z.object({
    name: z.string().min(2).max(200).trim().optional(),
    category: z.string().min(2).max(100).trim().optional(),
    unit: z.string().min(1).max(30).trim().optional(),
    specifications: z.string().max(2000).optional(),
    minimumStock: z.number().min(0).optional(),
    reorderLevel: z.number().min(0).optional(),
    unitPrice: z.number().min(0).optional(),
    status: z.enum(["ACTIVE", "INACTIVE", "DISCONTINUED"]).optional(),
    notes: z.string().max(1000).optional(),
  }),
};
