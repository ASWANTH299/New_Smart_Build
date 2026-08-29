import { z } from "zod";

export const createBOMSchema = {
  body: z.object({
    phaseId: z.string().optional(),
    taskId: z.string().optional(),
    notes: z.string().max(1000).optional(),
    items: z
      .array(
        z.object({
          materialId: z.string().min(1, "Material ID is required"),
          plannedQuantity: z.number().min(0.0001, "Planned quantity must be greater than 0"),
          unit: z.string().min(1).max(30).trim(),
          unitCost: z.number().min(0).optional(),
          notes: z.string().max(500).optional(),
        })
      )
      .optional(),
  }),
};

export const addBOMItemSchema = {
  body: z.object({
    materialId: z.string().min(1, "Material ID is required"),
    plannedQuantity: z.number().min(0.0001, "Planned quantity must be greater than 0"),
    unit: z.string().min(1).max(30).trim(),
    unitCost: z.number().min(0).optional(),
    notes: z.string().max(500).optional(),
  }),
};

export const updateBOMItemSchema = {
  body: z.object({
    plannedQuantity: z.number().min(0.0001).optional(),
    usedQuantity: z.number().min(0).optional(),
    unit: z.string().min(1).max(30).trim().optional(),
    unitCost: z.number().min(0).optional(),
    notes: z.string().max(500).optional(),
  }),
};

export const approveBOMSchema = {
  body: z.object({
    notes: z.string().max(500).optional(),
  }),
};
