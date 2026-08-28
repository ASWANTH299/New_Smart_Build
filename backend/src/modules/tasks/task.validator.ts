import { z } from "zod";

export const createTaskSchema = {
  body: z.object({
    phaseId: z.string().min(1, "Phase ID is required"),
    title: z.string().min(2).max(200).trim(),
    description: z.string().max(2000).optional(),
    assigneeId: z.string().optional(),
    contractorId: z.string().optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
    plannedStartDate: z.string().datetime().or(z.string().date()),
    plannedEndDate: z.string().datetime().or(z.string().date()),
    plannedQuantity: z.number().min(0.01, "Planned quantity must be greater than 0"),
    unit: z.string().min(1).max(30).trim().default("units"),
    dependencies: z.array(z.string()).optional(),
  }),
};

export const updateTaskSchema = {
  body: z.object({
    phaseId: z.string().optional(),
    title: z.string().min(2).max(200).trim().optional(),
    description: z.string().max(2000).optional(),
    assigneeId: z.string().nullable().optional(),
    contractorId: z.string().nullable().optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
    plannedStartDate: z.string().datetime().or(z.string().date()).optional(),
    plannedEndDate: z.string().datetime().or(z.string().date()).optional(),
    actualStartDate: z.string().datetime().or(z.string().date()).nullable().optional(),
    actualEndDate: z.string().datetime().or(z.string().date()).nullable().optional(),
    plannedQuantity: z.number().min(0.01).optional(),
    unit: z.string().min(1).max(30).trim().optional(),
    dependencies: z.array(z.string()).optional(),
    status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "BLOCKED", "COMPLETED"]).optional(),
  }),
};

export const updateTaskStatusSchema = {
  body: z.object({
    status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "BLOCKED", "COMPLETED"]),
    reason: z.string().max(500).optional(),
  }),
};

export const logProgressSchema = {
  body: z.object({
    completedQuantity: z.number().min(0, "Completed quantity cannot be negative"),
    date: z.string().datetime().or(z.string().date()).optional(),
    notes: z.string().max(1000).optional(),
    source: z.enum(["WEB", "MOBILE"]).optional(),
  }),
};
