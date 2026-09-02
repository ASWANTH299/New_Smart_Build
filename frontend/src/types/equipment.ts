export type EquipmentCategory =
  | "EARTHMOVING"
  | "CONCRETE"
  | "MATERIAL_HANDLING"
  | "POWER_LIGHTING"
  | "COMPACTION"
  | "PUMPING"
  | "SCAFFOLDING"
  | "TRANSPORT"
  | "SURVEYING"
  | "OTHER";

export type EquipmentOwnershipType = "OWNED" | "RENTED" | "LEASED";

export type EquipmentStatus =
  | "AVAILABLE"
  | "ASSIGNED"
  | "IN_USE"
  | "UNDER_MAINTENANCE"
  | "BREAKDOWN"
  | "INACTIVE"
  | "RETIRED";

export type EquipmentAssignmentStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";

export type MaintenanceType =
  | "PREVENTIVE"
  | "CORRECTIVE"
  | "BREAKDOWN"
  | "INSPECTION_SERVICE";

export type MaintenanceStatus =
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export type InspectionResult = "PASSED" | "FAILED" | "PASSED_WITH_CONDITIONS";

export interface RentalDetails {
  vendorId?: { _id: string; name: string; code: string } | string | null;
  dailyRate?: number;
  monthlyRate?: number;
  rentalStartDate?: string | null;
  rentalEndDate?: string | null;
  contractNumber?: string;
}

export interface MaintenanceSchedule {
  frequencyMonths?: number;
  lastServiceDate?: string | null;
  nextServiceDate?: string | null;
}

export interface EquipmentDocument {
  title: string;
  fileUrl: string;
  uploadedAt: string;
}

export interface Equipment {
  _id: string;
  id?: string;
  code: string;
  name: string;
  category: EquipmentCategory;
  ownershipType: EquipmentOwnershipType;
  status: EquipmentStatus;
  make?: string;
  modelNumber?: string;
  serialNumber?: string;
  yearOfManufacture?: number;
  hourlyRate?: number;
  purchaseDate?: string | null;
  purchasePrice?: number;
  currentLocation?: string;
  rentalDetails?: RentalDetails;
  maintenanceSchedule?: MaintenanceSchedule;
  documents?: EquipmentDocument[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EquipmentAssignment {
  _id: string;
  id?: string;
  equipmentId: Equipment | string;
  projectId: { _id: string; name: string; code: string; status?: string } | string;
  taskId?: { _id: string; title: string; status: string } | string | null;
  assignedTo?: { _id: string; firstName?: string; lastName?: string; name?: string; email: string } | string | null;
  startDate: string;
  endDate: string;
  actualReturnDate?: string | null;
  purpose?: string;
  meterReadingStart?: number;
  meterReadingEnd?: number | null;
  status: EquipmentAssignmentStatus;
  createdBy: { _id: string; firstName?: string; lastName?: string; name?: string; email: string } | string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EquipmentMaintenance {
  _id: string;
  id?: string;
  equipmentId: Equipment | string;
  type: MaintenanceType;
  scheduledDate: string;
  completedDate?: string | null;
  description: string;
  cost: number;
  performedBy?: string;
  vendorId?: { _id: string; name: string; code: string } | string | null;
  partsReplaced?: Array<{
    partName: string;
    partNumber?: string;
    quantity: number;
    cost: number;
  }>;
  status: MaintenanceStatus;
  notes?: string;
  createdBy: { _id: string; firstName?: string; lastName?: string; name?: string; email: string } | string;
  createdAt: string;
  updatedAt: string;
}

export interface EquipmentInspection {
  _id: string;
  id?: string;
  equipmentId: Equipment | string;
  projectId?: { _id: string; name: string; code: string } | string | null;
  inspectionDate: string;
  inspectedBy: { _id: string; firstName?: string; lastName?: string; name?: string; email: string } | string;
  result: InspectionResult;
  findings?: string;
  checklistItems?: Array<{
    item: string;
    passed: boolean;
    remarks?: string;
  }>;
  nextInspectionDate?: string | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
