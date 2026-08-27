import { z } from "zod";

export const createProjectSchema = {
  body: z.object({
    code: z.string().min(3).max(30).toUpperCase().trim(),
    name: z.string().min(3).max(150).trim(),
    typeId: z.string().optional(),
    templateId: z.string().optional(),
    clientUserId: z.string().optional(),
    location: z.string().min(2).max(200).trim(),
    description: z.string().max(2000).optional(),
    plannedStartDate: z.string().datetime().or(z.string().date()),
    plannedEndDate: z.string().datetime().or(z.string().date()),
    projectManagerId: z.string().min(1, "Project Manager is required"),
    teamUserIds: z.array(z.string()).optional(),
  }),
};

export const updateProjectSchema = {
  body: z.object({
    name: z.string().min(3).max(150).trim().optional(),
    typeId: z.string().optional(),
    clientUserId: z.string().optional(),
    location: z.string().min(2).max(200).trim().optional(),
    description: z.string().max(2000).optional(),
    plannedStartDate: z.string().datetime().or(z.string().date()).optional(),
    plannedEndDate: z.string().datetime().or(z.string().date()).optional(),
    actualStartDate: z.string().datetime().or(z.string().date()).optional(),
    actualEndDate: z.string().datetime().or(z.string().date()).optional(),
    projectManagerId: z.string().optional(),
    health: z.enum(["HEALTHY", "AT_RISK", "CRITICAL"]).optional(),
    progress: z.number().min(0).max(100).optional(),
  }),
};

export const updateProjectStatusSchema = {
  body: z.object({
    status: z.enum(["DRAFT", "PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"]),
    reason: z.string().max(500).optional(),
  }),
};
