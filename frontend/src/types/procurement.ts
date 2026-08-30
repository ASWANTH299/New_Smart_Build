import { Material } from "./material.js";

export type VendorStatus = "ACTIVE" | "INACTIVE" | "BLACKLISTED";

export interface VendorContact {
  name: string;
  email: string;
  phone: string;
  designation?: string;
}

export interface VendorAddress {
  street?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
}

export interface VendorPerformance {
  rating: number;
  totalOrders: number;
  onTimeDeliveryRate: number;
  notes?: string;
}

export interface Vendor {
  _id: string;
  code: string;
  name: string;
  contact: VendorContact;
  address: VendorAddress;
  materialsSupplied?: Material[] | string[];
  status: VendorStatus;
  performanceSummary: VendorPerformance;
  createdAt: string;
  updatedAt: string;
}

export type ProcurementRequestStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "CONVERTED_TO_PO"
  | "CANCELLED";

export interface ProcurementRequestItem {
  materialId: Material | string;
  requestedQuantity: number;
  estimatedUnitPrice?: number;
  estimatedTotalPrice?: number;
  unit: string;
  notes?: string;
}

export interface ProcurementRequest {
  _id: string;
  requestNumber: string;
  projectId: string;
  requestedBy: { _id: string; firstName: string; lastName: string; email: string; primaryRole?: string } | string;
  reason: string;
  items: ProcurementRequestItem[];
  status: ProcurementRequestStatus;
  reviewedBy?: { _id: string; firstName: string; lastName: string; email: string } | string;
  reviewedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export type POApprovalStatus = "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
export type POStatus = "DRAFT" | "ISSUED" | "PARTIALLY_RECEIVED" | "FULFILLED" | "CANCELLED";

export interface PurchaseOrderItem {
  materialId: Material | string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  receivedQuantity: number;
}

export interface PurchaseOrder {
  _id: string;
  poNumber: string;
  procurementRequestId?: ProcurementRequest | string;
  vendorId: Vendor | string;
  projectId: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  expectedDeliveryDate?: string;
  approvalStatus: POApprovalStatus;
  status: POStatus;
  notes?: string;
  termsAndConditions?: string;
  createdBy: { _id: string; firstName: string; lastName: string; email: string } | string;
  approvedBy?: { _id: string; firstName: string; lastName: string; email: string } | string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaterialReceiptItem {
  materialId: Material | string;
  receivedQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  unitPrice: number;
  totalCost: number;
  rejectionReason?: string;
}

export interface MaterialReceipt {
  _id: string;
  receiptNumber: string;
  purchaseOrderId: PurchaseOrder | string;
  vendorId: Vendor | string;
  projectId: string;
  locationId: { _id: string; name: string; type: string } | string;
  receivedBy: { _id: string; firstName: string; lastName: string; email: string } | string;
  receivedAt: string;
  items: MaterialReceiptItem[];
  notes?: string;
  invoiceNumber?: string;
  deliveryChallanNumber?: string;
  createdAt: string;
  updatedAt: string;
}
