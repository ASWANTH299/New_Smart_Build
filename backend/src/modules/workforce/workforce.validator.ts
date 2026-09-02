import { z } from "zod";

export const createWorkerSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Worker name is required").max(100),
    workerType: z.enum(["DIRECT", "CONTRACTOR", "SUBCONTRACTOR", "TEMPORARY"]).default("DIRECT"),
    trade: z.enum([
      "MASON",
      "CARPENTER",
      "ELECTRICIAN",
      "PLUMBER",
      "PAINTER",
      "STEEL_FIXER",
      "WELDER",
      "HEAVY_OPERATOR",
      "GENERAL_LABOR",
      "SURVEYOR",
      "FOREMAN",
      "OTHER",
    ]),
    contractorId: z.string().optional().nullable(),
    contact: z
      .object({
        phone: z.string().optional(),
        email: z.string().email().optional().or(z.literal("")),
        address: z.string().optional(),
        emergencyContact: z.string().optional(),
      })
      .optional(),
    status: z.enum(["ACTIVE", "INACTIVE", "ON_LEAVE", "TERMINATED"]).default("ACTIVE"),
    notes: z.string().optional(),
  }),
});

export const updateWorkerSchema = z.object({
  params: z.object({
    workerId: z.string().min(1, "Worker ID is required"),
  }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    workerType: z.enum(["DIRECT", "CONTRACTOR", "SUBCONTRACTOR", "TEMPORARY"]).optional(),
    trade: z
      .enum([
        "MASON",
        "CARPENTER",
        "ELECTRICIAN",
        "PLUMBER",
        "PAINTER",
        "STEEL_FIXER",
        "WELDER",
        "HEAVY_OPERATOR",
        "GENERAL_LABOR",
        "SURVEYOR",
        "FOREMAN",
        "OTHER",
      ])
      .optional(),
    contractorId: z.string().optional().nullable(),
    contact: z
      .object({
        phone: z.string().optional(),
        email: z.string().email().optional().or(z.literal("")),
        address: z.string().optional(),
        emergencyContact: z.string().optional(),
      })
      .optional(),
    status: z.enum(["ACTIVE", "INACTIVE", "ON_LEAVE", "TERMINATED"]).optional(),
    notes: z.string().optional(),
  }),
});

export const assignWorkerSchema = z.object({
  params: z.object({
    projectId: z.string().min(1, "Project ID is required"),
  }),
  body: z.object({
    workerId: z.string().min(1, "Worker ID is required"),
    phaseId: z.string().optional().nullable(),
    taskId: z.string().optional().nullable(),
    startDate: z.string().optional(),
    endDate: z.string().optional().nullable(),
    notes: z.string().optional(),
  }),
});

export const updateAssignmentSchema = z.object({
  params: z.object({
    projectId: z.string().min(1, "Project ID is required"),
    assignmentId: z.string().min(1, "Assignment ID is required"),
  }),
  body: z.object({
    phaseId: z.string().optional().nullable(),
    taskId: z.string().optional().nullable(),
    endDate: z.string().optional().nullable(),
    status: z.enum(["ACTIVE", "COMPLETED", "REASSIGNED", "CANCELLED"]).optional(),
    notes: z.string().optional(),
  }),
});
