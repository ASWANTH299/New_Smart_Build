import { z } from "zod";

export const createLocationSchema = {
  body: z.object({
    name: z.string().min(2).max(100).trim(),
    code: z.string().min(2).max(50).trim().toUpperCase(),
    type: z.enum(["CENTRAL_WAREHOUSE", "PROJECT_STORE"]),
    projectId: z.string().optional(),
    address: z.string().max(500).optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
    managerId: z.string().optional(),
  }),
};

export const receiveMaterialsSchema = {
  body: z.object({
    locationId: z.string().min(1, "Location ID is required"),
    materialId: z.string().min(1, "Material ID is required"),
    quantity: z.number().min(0.0001, "Quantity must be greater than 0"),
    unitCost: z.number().min(0).default(0),
    referenceType: z.enum(["PURCHASE_ORDER", "DIRECT_RECEIPT"]).default("DIRECT_RECEIPT"),
    referenceId: z.string().optional(),
    projectId: z.string().optional(),
    reason: z.string().max(500).optional(),
  }),
};

export const issueMaterialsSchema = {
  body: z.object({
    locationId: z.string().min(1, "Location ID is required"),
    materialId: z.string().min(1, "Material ID is required"),
    quantity: z.number().min(0.0001, "Quantity must be greater than 0"),
    referenceType: z.enum(["MATERIAL_REQUEST", "TASK_CONSUMPTION", "DIRECT_ISSUE"]).default("DIRECT_ISSUE"),
    referenceId: z.string().optional(),
    projectId: z.string().optional(),
    reason: z.string().max(500).optional(),
  }),
};

export const transferMaterialsSchema = {
  body: z.object({
    fromLocationId: z.string().min(1, "Source location ID is required"),
    toLocationId: z.string().min(1, "Destination location ID is required"),
    materialId: z.string().min(1, "Material ID is required"),
    quantity: z.number().min(0.0001, "Quantity must be greater than 0"),
    projectId: z.string().optional(),
    reason: z.string().max(500).optional(),
  }),
};

export const adjustStockSchema = {
  body: z.object({
    locationId: z.string().min(1, "Location ID is required"),
    materialId: z.string().min(1, "Material ID is required"),
    adjustedQuantity: z.number(),
    adjustmentType: z.enum(["DELTA", "SET_TOTAL"]).default("DELTA"),
    reason: z.string().min(2, "Reason is mandatory for stock adjustments").max(500),
    projectId: z.string().optional(),
  }),
};

export const returnMaterialsSchema = {
  body: z.object({
    locationId: z.string().min(1, "Location ID is required"),
    materialId: z.string().min(1, "Material ID is required"),
    quantity: z.number().min(0.0001, "Quantity must be greater than 0"),
    projectId: z.string().optional(),
    referenceType: z.enum(["MATERIAL_REQUEST", "TASK_CONSUMPTION"]).default("MATERIAL_REQUEST"),
    referenceId: z.string().optional(),
    reason: z.string().max(500).optional(),
  }),
};

export const consumeMaterialsSchema = {
  body: z.object({
    locationId: z.string().min(1, "Location ID is required"),
    materialId: z.string().min(1, "Material ID is required"),
    quantity: z.number().min(0.0001, "Quantity must be greater than 0"),
    projectId: z.string().min(1, "Project ID is required for task consumption"),
    taskId: z.string().optional(),
    reason: z.string().max(500).optional(),
  }),
};
