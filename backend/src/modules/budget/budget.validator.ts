import { z } from "zod";

export const updateBudgetSchema = {
  params: z.object({
    projectId: z.string().min(1, "Project ID is required"),
  }),
  body: z.object({
    categories: z
      .array(
        z.object({
          category: z.enum(["MATERIAL", "WORKFORCE", "EQUIPMENT", "OTHER"]),
          plannedAmount: z.number().min(0, "Planned amount cannot be negative"),
          notes: z.string().optional(),
        })
      )
      .min(1, "At least one category budget is required"),
    notes: z.string().optional(),
  }),
};

export const recordExpenseSchema = {
  params: z.object({
    projectId: z.string().min(1, "Project ID is required"),
  }),
  body: z.object({
    category: z.enum(["MATERIAL", "WORKFORCE", "EQUIPMENT", "OTHER"]),
    phaseId: z.string().optional().nullable(),
    taskId: z.string().optional().nullable(),
    description: z.string().min(1, "Expense description is required"),
    amount: z.number().positive("Amount must be greater than 0"),
    date: z.string().optional(),
    vendorId: z.string().optional().nullable(),
    reference: z.string().optional(),
    status: z.enum(["PENDING", "APPROVED", "REJECTED", "PAID"]).default("APPROVED"),
    receiptUrl: z.string().optional(),
    notes: z.string().optional(),
  }),
};

export const updateExpenseSchema = {
  params: z.object({
    projectId: z.string().min(1, "Project ID is required"),
    expenseId: z.string().min(1, "Expense ID is required"),
  }),
  body: z.object({
    category: z.enum(["MATERIAL", "WORKFORCE", "EQUIPMENT", "OTHER"]).optional(),
    phaseId: z.string().optional().nullable(),
    taskId: z.string().optional().nullable(),
    description: z.string().min(1).optional(),
    amount: z.number().positive().optional(),
    date: z.string().optional(),
    vendorId: z.string().optional().nullable(),
    reference: z.string().optional(),
    status: z.enum(["PENDING", "APPROVED", "REJECTED", "PAID"]).optional(),
    receiptUrl: z.string().optional(),
    notes: z.string().optional(),
  }),
};

export const createBudgetChangeRequestSchema = {
  params: z.object({
    projectId: z.string().min(1, "Project ID is required"),
  }),
  body: z.object({
    reason: z.string().min(5, "A descriptive reason is required (min 5 characters)"),
    categoryChanges: z
      .array(
        z.object({
          category: z.enum(["MATERIAL", "WORKFORCE", "EQUIPMENT", "OTHER"]),
          proposedPlanned: z.number().min(0, "Proposed planned amount cannot be negative"),
        })
      )
      .min(1, "At least one category change must be specified"),
  }),
};

export const reviewBudgetChangeRequestSchema = {
  params: z.object({
    projectId: z.string().min(1, "Project ID is required"),
    requestId: z.string().min(1, "Request ID is required"),
  }),
  body: z.object({
    decision: z.enum(["APPROVED", "REJECTED"]),
    reviewNotes: z.string().optional(),
  }),
};
