import api from "./api.js";
import {
  Equipment,
  EquipmentAssignment,
  EquipmentMaintenance,
  EquipmentInspection,
  EquipmentCategory,
  EquipmentOwnershipType,
  EquipmentStatus,
  MaintenanceType,
  MaintenanceStatus,
  InspectionResult,
} from "../types/equipment.js";

export interface CreateEquipmentPayload {
  code: string;
  name: string;
  category: EquipmentCategory;
  ownershipType?: EquipmentOwnershipType;
  status?: EquipmentStatus;
  make?: string;
  modelNumber?: string;
  serialNumber?: string;
  yearOfManufacture?: number;
  hourlyRate?: number;
  purchaseDate?: string | null;
  purchasePrice?: number;
  currentLocation?: string;
  rentalDetails?: {
    vendorId?: string | null;
    dailyRate?: number;
    monthlyRate?: number;
    rentalStartDate?: string | null;
    rentalEndDate?: string | null;
    contractNumber?: string;
  };
  maintenanceSchedule?: {
    frequencyMonths?: number;
    lastServiceDate?: string | null;
    nextServiceDate?: string | null;
  };
  notes?: string;
}

export interface AssignEquipmentPayload {
  equipmentId: string;
  taskId?: string | null;
  assignedTo?: string | null;
  startDate: string;
  endDate: string;
  purpose?: string;
  meterReadingStart?: number;
  notes?: string;
}

export interface ReportBreakdownPayload {
  description: string;
  scheduledDate?: string;
  cost?: number;
  notes?: string;
}

export interface ScheduleMaintenancePayload {
  type: MaintenanceType;
  scheduledDate: string;
  description: string;
  cost?: number;
  performedBy?: string;
  vendorId?: string | null;
  notes?: string;
}

export interface CompleteMaintenancePayload {
  completedDate?: string;
  cost?: number;
  partsReplaced?: Array<{
    partName: string;
    partNumber?: string;
    quantity: number;
    cost: number;
  }>;
  performedBy?: string;
  status?: MaintenanceStatus;
  notes?: string;
}

export interface RecordInspectionPayload {
  projectId?: string | null;
  inspectionDate?: string;
  result: InspectionResult;
  findings?: string;
  checklistItems?: Array<{
    item: string;
    passed: boolean;
    remarks?: string;
  }>;
  nextInspectionDate?: string | null;
  notes?: string;
}

export const equipmentService = {
  // Global Equipment Catalog
  async getEquipmentList(params?: {
    search?: string;
    category?: string;
    ownershipType?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ success: boolean; data: Equipment[]; meta?: { total: number; page: number; totalPages: number } }> {
    const res = await api.get("/equipment", { params });
    return res.data;
  },

  async getEquipmentById(equipmentId: string): Promise<{
    success: boolean;
    data: {
      equipment: Equipment;
      activeAssignments: EquipmentAssignment[];
      assignmentHistory: EquipmentAssignment[];
      maintenanceRecords: EquipmentMaintenance[];
      inspections: EquipmentInspection[];
    };
  }> {
    const res = await api.get(`/equipment/${equipmentId}`);
    return res.data;
  },

  async createEquipment(
    payload: CreateEquipmentPayload
  ): Promise<{ success: boolean; data: Equipment; message?: string }> {
    const res = await api.post("/equipment", payload);
    return res.data;
  },

  async updateEquipment(
    equipmentId: string,
    payload: Partial<CreateEquipmentPayload>
  ): Promise<{ success: boolean; data: Equipment; message?: string }> {
    const res = await api.put(`/equipment/${equipmentId}`, payload);
    return res.data;
  },

  async deleteEquipment(equipmentId: string): Promise<{ success: boolean; message?: string }> {
    const res = await api.delete(`/equipment/${equipmentId}`);
    return res.data;
  },

  async reportBreakdown(
    equipmentId: string,
    payload: ReportBreakdownPayload
  ): Promise<{ success: boolean; data: { equipment: Equipment; maintenance: EquipmentMaintenance }; message?: string }> {
    const res = await api.post(`/equipment/${equipmentId}/breakdown`, payload);
    return res.data;
  },

  async scheduleMaintenance(
    equipmentId: string,
    payload: ScheduleMaintenancePayload
  ): Promise<{ success: boolean; data: EquipmentMaintenance; message?: string }> {
    const res = await api.post(`/equipment/${equipmentId}/maintenance`, payload);
    return res.data;
  },

  async completeMaintenance(
    equipmentId: string,
    maintenanceId: string,
    payload: CompleteMaintenancePayload
  ): Promise<{ success: boolean; data: EquipmentMaintenance; message?: string }> {
    const res = await api.put(`/equipment/${equipmentId}/maintenance/${maintenanceId}`, payload);
    return res.data;
  },

  async recordInspection(
    equipmentId: string,
    payload: RecordInspectionPayload
  ): Promise<{ success: boolean; data: EquipmentInspection; message?: string }> {
    const res = await api.post(`/equipment/${equipmentId}/inspections`, payload);
    return res.data;
  },

  // Project-Scoped Equipment Assignments
  async getProjectEquipment(
    projectId: string,
    params?: { status?: string; category?: string }
  ): Promise<{ success: boolean; data: EquipmentAssignment[] }> {
    const res = await api.get(`/projects/${projectId}/equipment`, { params });
    return res.data;
  },

  async assignEquipment(
    projectId: string,
    payload: AssignEquipmentPayload
  ): Promise<{ success: boolean; data: EquipmentAssignment; message?: string }> {
    const res = await api.post(`/projects/${projectId}/equipment/assignments`, payload);
    return res.data;
  },

  async updateAssignment(
    projectId: string,
    assignmentId: string,
    payload: {
      endDate?: string;
      actualReturnDate?: string | null;
      meterReadingEnd?: number | null;
      status?: string;
      notes?: string;
    }
  ): Promise<{ success: boolean; data: EquipmentAssignment; message?: string }> {
    const res = await api.put(`/projects/${projectId}/equipment/assignments/${assignmentId}`, payload);
    return res.data;
  },
};

export default equipmentService;
