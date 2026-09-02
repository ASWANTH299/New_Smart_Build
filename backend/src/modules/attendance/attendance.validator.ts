import { z } from "zod";

export const recordAttendanceSchema = z.object({
  params: z.object({
    projectId: z.string().min(1, "Project ID is required"),
  }),
  body: z.object({
    workerId: z.string().min(1, "Worker ID is required"),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
    status: z.enum(["PRESENT", "ABSENT", "HALF_DAY", "ON_LEAVE", "OVERTIME"]).default("PRESENT"),
    checkIn: z.string().datetime().optional().nullable(),
    checkOut: z.string().datetime().optional().nullable(),
    workingHours: z.number().min(0).max(24).optional(),
    overtimeHours: z.number().min(0).max(24).optional(),
    notes: z.string().optional(),
  }),
});

export const bulkRecordAttendanceSchema = z.object({
  params: z.object({
    projectId: z.string().min(1, "Project ID is required"),
  }),
  body: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
    records: z
      .array(
        z.object({
          workerId: z.string().min(1, "Worker ID is required"),
          status: z.enum(["PRESENT", "ABSENT", "HALF_DAY", "ON_LEAVE", "OVERTIME"]).default("PRESENT"),
          checkIn: z.string().datetime().optional().nullable(),
          checkOut: z.string().datetime().optional().nullable(),
          workingHours: z.number().min(0).max(24).optional(),
          overtimeHours: z.number().min(0).max(24).optional(),
          notes: z.string().optional(),
        })
      )
      .min(1, "At least one attendance record is required"),
  }),
});

export const updateAttendanceSchema = z.object({
  params: z.object({
    projectId: z.string().min(1, "Project ID is required"),
    attendanceId: z.string().min(1, "Attendance ID is required"),
  }),
  body: z.object({
    status: z.enum(["PRESENT", "ABSENT", "HALF_DAY", "ON_LEAVE", "OVERTIME"]).optional(),
    checkIn: z.string().datetime().optional().nullable(),
    checkOut: z.string().datetime().optional().nullable(),
    workingHours: z.number().min(0).max(24).optional(),
    overtimeHours: z.number().min(0).max(24).optional(),
    notes: z.string().optional(),
  }),
});
