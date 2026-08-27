import { z } from "zod";

export const createUserSchema = {
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100),
    email: z.string().trim().toLowerCase().email("Invalid email address format"),
    primaryRole: z.enum([
      "ADMIN",
      "PROJECT_MANAGER",
      "SITE_ENGINEER",
      "STORE_MANAGER",
      "CONTRACTOR",
      "CLIENT",
    ]),
    password: z.string().min(8).optional(),
    additionalPermissions: z.array(z.string()).optional(),
    projectIds: z.array(z.string()).optional(),
  }),
};

export const updateUserSchema = {
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    primaryRole: z
      .enum([
        "ADMIN",
        "PROJECT_MANAGER",
        "SITE_ENGINEER",
        "STORE_MANAGER",
        "CONTRACTOR",
        "CLIENT",
      ])
      .optional(),
  }),
};

export const updateUserStatusSchema = {
  body: z.object({
    status: z.enum(["ACTIVE", "DEACTIVATED"]),
    reason: z.string().max(500).optional(),
  }),
};

export const updateUserPermissionsSchema = {
  body: z.object({
    additionalPermissions: z.array(z.string()),
  }),
};

export const assignProjectSchema = {
  body: z.object({
    projectId: z.string().min(1, "Project ID is required"),
  }),
};
