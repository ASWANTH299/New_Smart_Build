import { z } from "zod";

export const createEquipmentSchema = z.object({
  body: z.object({
    code: z.string().min(1, "Equipment code is required").max(50),
    name: z.string().min(1, "Equipment name is required").max(100),
    category: z.enum([
      "EARTHMOVING",
      "CONCRETE",
      "MATERIAL_HANDLING",
      "POWER_LIGHTING",
      "COMPACTION",
      "PUMPING",
      "SCAFFOLDING",
      "TRANSPORT",
      "SURVEYING",
      "OTHER",
    ]),
    ownershipType: z.enum(["OWNED", "RENTED", "LEASED"]).default("OWNED"),
    status: z
      .enum([
        "AVAILABLE",
        "ASSIGNED",
        "IN_USE",
        "UNDER_MAINTENANCE",
        "BREAKDOWN",
        "INACTIVE",
        "RETIRED",
      ])
      .default("AVAILABLE"),
    make: z.string().optional(),
    modelNumber: z.string().optional(),
    serialNumber: z.string().optional(),
    yearOfManufacture: z.number().int().optional(),
    hourlyRate: z.number().min(0).optional(),
    purchaseDate: z.string().datetime().optional().nullable().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    purchasePrice: z.number().min(0).optional(),
    currentLocation: z.string().optional(),
    rentalDetails: z
      .object({
        vendorId: z.string().optional().nullable(),
        dailyRate: z.number().min(0).optional(),
        monthlyRate: z.number().min(0).optional(),
        rentalStartDate: z.string().optional().nullable(),
        rentalEndDate: z.string().optional().nullable(),
        contractNumber: z.string().optional(),
      })
      .optional(),
    maintenanceSchedule: z
      .object({
        frequencyMonths: z.number().min(1).optional(),
        lastServiceDate: z.string().optional().nullable(),
        nextServiceDate: z.string().optional().nullable(),
      })
      .optional(),
    notes: z.string().optional(),
  }),
});

export const updateEquipmentSchema = z.object({
  params: z.object({
    equipmentId: z.string().min(1, "Equipment ID is required"),
  }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    category: z
      .enum([
        "EARTHMOVING",
        "CONCRETE",
        "MATERIAL_HANDLING",
        "POWER_LIGHTING",
        "COMPACTION",
        "PUMPING",
        "SCAFFOLDING",
        "TRANSPORT",
        "SURVEYING",
        "OTHER",
      ])
      .optional(),
    ownershipType: z.enum(["OWNED", "RENTED", "LEASED"]).optional(),
    status: z
      .enum([
        "AVAILABLE",
        "ASSIGNED",
        "IN_USE",
        "UNDER_MAINTENANCE",
        "BREAKDOWN",
        "INACTIVE",
        "RETIRED",
      ])
      .optional(),
    make: z.string().optional(),
    modelNumber: z.string().optional(),
    serialNumber: z.string().optional(),
    yearOfManufacture: z.number().int().optional(),
    hourlyRate: z.number().min(0).optional(),
    purchasePrice: z.number().min(0).optional(),
    currentLocation: z.string().optional(),
    rentalDetails: z
      .object({
        vendorId: z.string().optional().nullable(),
        dailyRate: z.number().min(0).optional(),
        monthlyRate: z.number().min(0).optional(),
        rentalStartDate: z.string().optional().nullable(),
        rentalEndDate: z.string().optional().nullable(),
        contractNumber: z.string().optional(),
      })
      .optional(),
    maintenanceSchedule: z
      .object({
        frequencyMonths: z.number().min(1).optional(),
        lastServiceDate: z.string().optional().nullable(),
        nextServiceDate: z.string().optional().nullable(),
      })
      .optional(),
    notes: z.string().optional(),
  }),
});

export const assignEquipmentSchema = z.object({
  params: z.object({
    projectId: z.string().min(1, "Project ID is required"),
  }),
  body: z.object({
    equipmentId: z.string().min(1, "Equipment ID is required"),
    taskId: z.string().optional().nullable(),
    assignedTo: z.string().optional().nullable(),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    purpose: z.string().optional(),
    meterReadingStart: z.number().min(0).optional(),
    notes: z.string().optional(),
  }),
});

export const updateAssignmentSchema = z.object({
  params: z.object({
    projectId: z.string().min(1, "Project ID is required"),
    assignmentId: z.string().min(1, "Assignment ID is required"),
  }),
  body: z.object({
    endDate: z.string().optional(),
    actualReturnDate: z.string().optional().nullable(),
    meterReadingEnd: z.number().min(0).optional().nullable(),
    status: z.enum(["ACTIVE", "COMPLETED", "CANCELLED"]).optional(),
    notes: z.string().optional(),
  }),
});

export const reportBreakdownSchema = z.object({
  params: z.object({
    equipmentId: z.string().min(1, "Equipment ID is required"),
  }),
  body: z.object({
    description: z.string().min(1, "Breakdown description is required"),
    scheduledDate: z.string().optional(),
    cost: z.number().min(0).optional(),
    notes: z.string().optional(),
  }),
});

export const scheduleMaintenanceSchema = z.object({
  params: z.object({
    equipmentId: z.string().min(1, "Equipment ID is required"),
  }),
  body: z.object({
    type: z.enum(["PREVENTIVE", "CORRECTIVE", "BREAKDOWN", "INSPECTION_SERVICE"]).default("PREVENTIVE"),
    scheduledDate: z.string().min(1, "Scheduled date is required"),
    description: z.string().min(1, "Maintenance description is required"),
    cost: z.number().min(0).optional(),
    performedBy: z.string().optional(),
    vendorId: z.string().optional().nullable(),
    notes: z.string().optional(),
  }),
});

export const completeMaintenanceSchema = z.object({
  params: z.object({
    equipmentId: z.string().min(1, "Equipment ID is required"),
    maintenanceId: z.string().min(1, "Maintenance ID is required"),
  }),
  body: z.object({
    completedDate: z.string().optional(),
    cost: z.number().min(0).optional(),
    partsReplaced: z
      .array(
        z.object({
          partName: z.string().min(1),
          partNumber: z.string().optional(),
          quantity: z.number().min(1).default(1),
          cost: z.number().min(0).default(0),
        })
      )
      .optional(),
    performedBy: z.string().optional(),
    status: z.enum(["COMPLETED", "CANCELLED"]).default("COMPLETED"),
    notes: z.string().optional(),
  }),
});

export const recordInspectionSchema = z.object({
  params: z.object({
    equipmentId: z.string().min(1, "Equipment ID is required"),
  }),
  body: z.object({
    projectId: z.string().optional().nullable(),
    inspectionDate: z.string().optional(),
    result: z.enum(["PASSED", "FAILED", "PASSED_WITH_CONDITIONS"]),
    findings: z.string().optional(),
    checklistItems: z
      .array(
        z.object({
          item: z.string().min(1),
          passed: z.boolean(),
          remarks: z.string().optional(),
        })
      )
      .optional(),
    nextInspectionDate: z.string().optional().nullable(),
    notes: z.string().optional(),
  }),
});
