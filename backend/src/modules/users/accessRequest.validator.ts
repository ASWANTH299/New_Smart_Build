import { z } from "zod";

const validRoles = [
  "ADMIN",
  "PROJECT_MANAGER",
  "SITE_ENGINEER",
  "STORE_MANAGER",
  "CONTRACTOR",
  "CLIENT",
] as const;

export const createAccessRequestSchema = {
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100),
    email: z.string().trim().toLowerCase().email("Please provide a valid email address"),
    requestedRole: z.enum(validRoles),
    organization: z.string().max(120).optional(),
    reason: z.string().max(500).optional(),
  }),
};

export const approveAccessRequestSchema = {
  body: z.object({
    assignedRole: z.enum(validRoles),
    additionalPermissions: z.array(z.string()).optional(),
    projectIds: z.array(z.string()).optional(),
  }),
};

export const rejectAccessRequestSchema = {
  body: z.object({
    reason: z.string().min(3, "Rejection reason must be at least 3 characters").max(500),
  }),
};
