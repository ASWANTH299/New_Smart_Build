import { z } from "zod";

export const createPhaseSchema = {
  body: z.object({
    name: z.string().min(2).max(150).trim(),
    description: z.string().max(1000).optional(),
    sequence: z.number().int().min(1).default(1),
    plannedStartDate: z.string().datetime().or(z.string().date()),
    plannedEndDate: z.string().datetime().or(z.string().date()),
    dependencies: z.array(z.string()).optional(),
  }),
};

export const updatePhaseSchema = {
  body: z.object({
    name: z.string().min(2).max(150).trim().optional(),
    description: z.string().max(1000).optional(),
    sequence: z.number().int().min(1).optional(),
    plannedStartDate: z.string().datetime().or(z.string().date()).optional(),
    plannedEndDate: z.string().datetime().or(z.string().date()).optional(),
    status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "ON_HOLD"]).optional(),
    dependencies: z.array(z.string()).optional(),
  }),
};
