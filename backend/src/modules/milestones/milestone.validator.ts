import { z } from "zod";

export const createMilestoneSchema = {
  body: z.object({
    phaseId: z.string().optional(),
    name: z.string().min(2).max(150).trim(),
    description: z.string().max(1000).optional(),
    plannedDate: z.string().datetime().or(z.string().date()),
    responsibleUserId: z.string().optional(),
    relatedTaskIds: z.array(z.string()).optional(),
    clientVisible: z.boolean().default(true),
  }),
};

export const updateMilestoneSchema = {
  body: z.object({
    phaseId: z.string().nullable().optional(),
    name: z.string().min(2).max(150).trim().optional(),
    description: z.string().max(1000).optional(),
    plannedDate: z.string().datetime().or(z.string().date()).optional(),
    actualDate: z.string().datetime().or(z.string().date()).nullable().optional(),
    status: z.enum(["PENDING", "ACHIEVED", "MISSED"]).optional(),
    responsibleUserId: z.string().nullable().optional(),
    relatedTaskIds: z.array(z.string()).optional(),
    clientVisible: z.boolean().optional(),
  }),
};
