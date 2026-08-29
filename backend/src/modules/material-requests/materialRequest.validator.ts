import { z } from "zod";

export const createMaterialRequestSchema = {
  body: z.object({
    phaseId: z.string().optional(),
    taskId: z.string().optional(),
    reason: z.string().min(2, "Reason is required").max(1000).trim(),
    items: z
      .array(
        z.object({
          materialId: z.string().min(1, "Material ID is required"),
          requestedQuantity: z.number().min(0.0001, "Requested quantity must be greater than 0"),
          unit: z.string().min(1).max(30).trim(),
          notes: z.string().max(500).optional(),
        })
      )
      .min(1, "At least one item is required in a material request"),
    submitImmediately: z.boolean().default(false),
  }),
};

export const updateMaterialRequestSchema = {
  body: z.object({
    phaseId: z.string().optional(),
    taskId: z.string().optional(),
    reason: z.string().min(2).max(1000).trim().optional(),
    items: z
      .array(
        z.object({
          materialId: z.string().min(1, "Material ID is required"),
          requestedQuantity: z.number().min(0.0001, "Requested quantity must be greater than 0"),
          unit: z.string().min(1).max(30).trim(),
          notes: z.string().max(500).optional(),
        })
      )
      .min(1)
      .optional(),
  }),
};

export const reviewMaterialRequestSchema = {
  body: z.object({
    decision: z.enum(["APPROVE", "REJECT"]),
    rejectionReason: z.string().max(1000).optional(),
    approvedItems: z
      .array(
        z.object({
          materialId: z.string().min(1),
          approvedQuantity: z.number().min(0, "Approved quantity cannot be negative"),
        })
      )
      .optional(),
  }),
};

export const issueMaterialRequestSchema = {
  body: z.object({
    locationId: z.string().min(1, "Inventory location ID is required for issuance"),
    items: z
      .array(
        z.object({
          materialId: z.string().min(1, "Material ID is required"),
          quantityToIssue: z.number().min(0.0001, "Quantity to issue must be greater than 0"),
        })
      )
      .min(1, "At least one item must be issued"),
    notes: z.string().max(500).optional(),
  }),
};
