import { z } from "zod";

export const createDailyReportSchema = {
  params: z.object({
    projectId: z.string().min(1, "Project ID is required"),
  }),
  body: z.object({
    date: z.string().optional(),
    reportDate: z.string().optional(),
    reportNumber: z.string().optional(),
    weatherCondition: z
      .enum(["SUNNY", "RAINY", "CLOUDY", "STORMY", "WINDY", "HOT", "COLD", "OTHER"])
      .optional()
      .default("SUNNY"),
    workPerformed: z.string().min(1, "Work performed description is required"),
    laborHeadcount: z.number().min(0, "Labor headcount must be positive").optional().default(0),
    equipmentUsed: z.array(z.string()).optional().default([]),
    materialsConsumed: z
      .array(
        z.object({
          materialId: z.string().optional().nullable(),
          materialName: z.string().optional(),
          quantity: z.number().min(0),
          unit: z.string().optional(),
        })
      )
      .optional()
      .default([]),
    photos: z.array(z.string()).optional().default([]),
    notes: z.string().optional(),
    issues: z.array(z.string()).optional().default([]),
  }),
};

export const reviewDailyReportSchema = {
  params: z.object({
    projectId: z.string().min(1, "Project ID is required"),
    reportId: z.string().min(1, "Report ID is required"),
  }),
  body: z.object({
    status: z.enum(["REVIEWED", "APPROVED"]),
    reviewNotes: z.string().optional(),
  }),
};
