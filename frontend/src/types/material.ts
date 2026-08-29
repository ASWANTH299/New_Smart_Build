export type MaterialStatus = "ACTIVE" | "INACTIVE" | "DISCONTINUED";

export interface Material {
  _id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  specifications?: string;
  minimumStock: number;
  reorderLevel: number;
  unitPrice: number;
  status: MaterialStatus;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type BOMStatus = "DRAFT" | "ACTIVE" | "SUPERSEDED" | "ARCHIVED";
export type BOMApprovalStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";

export interface BOMItem {
  _id: string;
  bomId: string;
  materialId: Material | string;
  plannedQuantity: number;
  usedQuantity: number;
  remainingQuantity: number;
  variance: number;
  unit: string;
  unitCost: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BOM {
  _id: string;
  projectId: string;
  phaseId?: { _id: string; name: string } | string;
  taskId?: { _id: string; title: string } | string;
  version: number;
  status: BOMStatus;
  approvalStatus: BOMApprovalStatus;
  createdBy?: { _id: string; firstName: string; lastName: string; email: string } | string;
  approvedBy?: { _id: string; firstName: string; lastName: string; email: string } | string;
  approvedAt?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type MaterialRequestStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "PARTIALLY_ISSUED"
  | "ISSUED"
  | "CANCELLED";

export interface MaterialRequestItem {
  _id?: string;
  materialId: Material | string;
  requestedQuantity: number;
  approvedQuantity: number;
  issuedQuantity: number;
  unit: string;
  notes?: string;
}

export interface MaterialRequest {
  _id: string;
  requestNumber: string;
  projectId: string;
  requestedBy: { _id: string; firstName: string; lastName: string; email: string } | string;
  phaseId?: { _id: string; name: string } | string;
  taskId?: { _id: string; title: string } | string;
  status: MaterialRequestStatus;
  reason: string;
  items: MaterialRequestItem[];
  reviewedBy?: { _id: string; firstName: string; lastName: string; email: string } | string;
  reviewedAt?: string;
  rejectionReason?: string;
  issuedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type InventoryLocationType = "CENTRAL_WAREHOUSE" | "PROJECT_STORE";

export interface InventoryLocation {
  _id: string;
  name: string;
  code: string;
  type: InventoryLocationType;
  projectId?: { _id: string; name: string; code: string } | string | null;
  address?: string;
  status: "ACTIVE" | "INACTIVE";
  managerId?: { _id: string; firstName: string; lastName: string; email: string } | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryBalance {
  _id: string;
  locationId: InventoryLocation;
  materialId: Material;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  averageUnitCost: number;
  isLowStock?: boolean;
  isReorderNeeded?: boolean;
  updatedAt?: string;
}

export type InventoryTransactionType =
  | "RECEIPT"
  | "ISSUE"
  | "RETURN"
  | "TRANSFER_OUT"
  | "TRANSFER_IN"
  | "ADJUSTMENT"
  | "CONSUMPTION";

export interface InventoryTransaction {
  _id: string;
  transactionNumber: string;
  projectId?: string;
  locationId: InventoryLocation | string;
  materialId: Material | string;
  transactionType: InventoryTransactionType;
  quantity: number;
  unitCost: number;
  totalCost: number;
  referenceType?: string;
  referenceId?: string;
  fromLocationId?: InventoryLocation | string;
  toLocationId?: InventoryLocation | string;
  performedBy: { _id: string; firstName: string; lastName: string; email: string } | string;
  reason?: string;
  timestamp: string;
}

export interface StockAlert {
  type: "CRITICAL_LOW_STOCK" | "REORDER_LEVEL_REACHED";
  balanceId: string;
  material: Material;
  location: InventoryLocation;
  availableQuantity: number;
  threshold: number;
  message: string;
}
