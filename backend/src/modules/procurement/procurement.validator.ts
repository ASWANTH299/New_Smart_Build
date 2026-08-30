import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createProcurementRequestSchema = {
  params: z.object({
    projectId: z.string().regex(objectIdRegex, "Invalid Project ID"),
  }),
  body: z.object({
    reason: z.string().min(2).max(1000).trim(),
    submitImmediately: z.boolean().default(true),
    items: z
      .array(
        z.object({
          materialId: z.string().regex(objectIdRegex, "Invalid Material ID"),
          requestedQuantity: z.number().positive(),
          estimatedUnitPrice: z.number().min(0).optional(),
          unit: z.string().min(1).max(30).trim(),
          notes: z.string().max(500).optional(),
        })
      )
      .min(1, "At least one item is required in procurement request"),
  }),
};

export const reviewProcurementRequestSchema = {
  params: z.object({
    projectId: z.string().regex(objectIdRegex, "Invalid Project ID"),
    id: z.string().regex(objectIdRegex, "Invalid Request ID"),
  }),
  body: z.object({
    decision: z.enum(["APPROVE", "REJECT"]),
    rejectionReason: z.string().max(500).optional(),
  }),
};

export const createPurchaseOrderSchema = {
  params: z.object({
    projectId: z.string().regex(objectIdRegex, "Invalid Project ID"),
  }),
  body: z.object({
    procurementRequestId: z.string().regex(objectIdRegex, "Invalid Procurement Request ID").optional(),
    vendorId: z.string().regex(objectIdRegex, "Invalid Vendor ID"),
    expectedDeliveryDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
    tax: z.number().min(0).default(0),
    notes: z.string().max(1000).optional(),
    termsAndConditions: z.string().max(2000).optional(),
    submitForApproval: z.boolean().default(true),
    items: z
      .array(
        z.object({
          materialId: z.string().regex(objectIdRegex, "Invalid Material ID"),
          quantity: z.number().positive(),
          unit: z.string().min(1).max(30).trim(),
          unitPrice: z.number().min(0),
        })
      )
      .min(1, "At least one item is required in purchase order"),
  }),
};

export const approvePurchaseOrderSchema = {
  params: z.object({
    projectId: z.string().regex(objectIdRegex, "Invalid Project ID"),
    id: z.string().regex(objectIdRegex, "Invalid Purchase Order ID"),
  }),
  body: z.object({
    decision: z.enum(["APPROVE", "REJECT"]),
    notes: z.string().max(500).optional(),
  }),
};

export const recordMaterialReceiptSchema = {
  params: z.object({
    projectId: z.string().regex(objectIdRegex, "Invalid Project ID"),
  }),
  body: z.object({
    purchaseOrderId: z.string().regex(objectIdRegex, "Invalid Purchase Order ID"),
    locationId: z.string().regex(objectIdRegex, "Invalid Location ID"),
    invoiceNumber: z.string().max(100).optional(),
    deliveryChallanNumber: z.string().max(100).optional(),
    notes: z.string().max(1000).optional(),
    items: z
      .array(
        z.object({
          materialId: z.string().regex(objectIdRegex, "Invalid Material ID"),
          receivedQuantity: z.number().min(0),
          acceptedQuantity: z.number().min(0),
          rejectedQuantity: z.number().min(0).default(0),
          rejectionReason: z.string().max(500).optional(),
        })
      )
      .min(1, "At least one receipt item is required"),
  }),
};

export const getProcurementRequestsQuerySchema = {
  params: z.object({
    projectId: z.string().regex(objectIdRegex, "Invalid Project ID"),
  }),
  query: z.object({
    status: z.enum(["DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "CONVERTED_TO_PO", "CANCELLED"]).optional(),
    requestedBy: z.string().regex(objectIdRegex, "Invalid User ID").optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  }),
};

export const getPurchaseOrdersQuerySchema = {
  params: z.object({
    projectId: z.string().regex(objectIdRegex, "Invalid Project ID"),
  }),
  query: z.object({
    vendorId: z.string().regex(objectIdRegex, "Invalid Vendor ID").optional(),
    approvalStatus: z.enum(["DRAFT", "PENDING_APPROVAL", "APPROVED", "REJECTED"]).optional(),
    status: z.enum(["DRAFT", "ISSUED", "PARTIALLY_RECEIVED", "FULFILLED", "CANCELLED"]).optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  }),
};

export const getMaterialReceiptsQuerySchema = {
  params: z.object({
    projectId: z.string().regex(objectIdRegex, "Invalid Project ID"),
  }),
  query: z.object({
    purchaseOrderId: z.string().regex(objectIdRegex, "Invalid Purchase Order ID").optional(),
    vendorId: z.string().regex(objectIdRegex, "Invalid Vendor ID").optional(),
    locationId: z.string().regex(objectIdRegex, "Invalid Location ID").optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  }),
};
