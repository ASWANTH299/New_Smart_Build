import mongoose from "mongoose";
import {
  Equipment,
  IEquipment,
  EquipmentCategory,
  EquipmentOwnershipType,
  EquipmentStatus,
} from "./equipment.model.js";
import {
  EquipmentAssignment,
  IEquipmentAssignment,
  EquipmentAssignmentStatus,
} from "./equipmentAssignment.model.js";
import {
  EquipmentMaintenance,
  IEquipmentMaintenance,
  MaintenanceType,
  MaintenanceStatus,
} from "./equipmentMaintenance.model.js";
import {
  EquipmentInspection,
  IEquipmentInspection,
  InspectionResult,
} from "./equipmentInspection.model.js";
import { AppError } from "../../utils/AppError.js";

export interface CreateEquipmentInput {
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
  purchaseDate?: Date | string | null;
  purchasePrice?: number;
  currentLocation?: string;
  rentalDetails?: {
    vendorId?: string | null;
    dailyRate?: number;
    monthlyRate?: number;
    rentalStartDate?: Date | string | null;
    rentalEndDate?: Date | string | null;
    contractNumber?: string;
  };
  maintenanceSchedule?: {
    frequencyMonths?: number;
    lastServiceDate?: Date | string | null;
    nextServiceDate?: Date | string | null;
  };
  notes?: string;
}

export interface UpdateEquipmentInput {
  name?: string;
  category?: EquipmentCategory;
  ownershipType?: EquipmentOwnershipType;
  status?: EquipmentStatus;
  make?: string;
  modelNumber?: string;
  serialNumber?: string;
  yearOfManufacture?: number;
  hourlyRate?: number;
  purchasePrice?: number;
  currentLocation?: string;
  rentalDetails?: {
    vendorId?: string | null;
    dailyRate?: number;
    monthlyRate?: number;
    rentalStartDate?: Date | string | null;
    rentalEndDate?: Date | string | null;
    contractNumber?: string;
  };
  maintenanceSchedule?: {
    frequencyMonths?: number;
    lastServiceDate?: Date | string | null;
    nextServiceDate?: Date | string | null;
  };
  notes?: string;
}

export interface AssignEquipmentInput {
  equipmentId: string;
  taskId?: string | null;
  assignedTo?: string | null;
  startDate: Date | string;
  endDate: Date | string;
  purpose?: string;
  meterReadingStart?: number;
  notes?: string;
}

export interface UpdateAssignmentInput {
  endDate?: Date | string;
  actualReturnDate?: Date | string | null;
  meterReadingEnd?: number | null;
  status?: EquipmentAssignmentStatus;
  notes?: string;
}

export interface ReportBreakdownInput {
  description: string;
  scheduledDate?: Date | string;
  cost?: number;
  notes?: string;
}

export interface ScheduleMaintenanceInput {
  type: MaintenanceType;
  scheduledDate: Date | string;
  description: string;
  cost?: number;
  performedBy?: string;
  vendorId?: string | null;
  notes?: string;
}

export interface CompleteMaintenanceInput {
  completedDate?: Date | string;
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

export interface RecordInspectionInput {
  projectId?: string | null;
  inspectionDate?: Date | string;
  result: InspectionResult;
  findings?: string;
  checklistItems?: Array<{
    item: string;
    passed: boolean;
    remarks?: string;
  }>;
  nextInspectionDate?: Date | string | null;
  notes?: string;
}

export class EquipmentService {
  /**
   * Create a new equipment master record
   */
  async createEquipment(data: CreateEquipmentInput): Promise<IEquipment> {
    const existing = await Equipment.findOne({ code: data.code.trim().toUpperCase() });
    if (existing) {
      throw new AppError(`Equipment with code '${data.code}' already exists`, 409);
    }

    const equipment = new Equipment({
      code: data.code.trim().toUpperCase(),
      name: data.name.trim(),
      category: data.category,
      ownershipType: data.ownershipType || "OWNED",
      status: data.status || "AVAILABLE",
      make: data.make,
      modelNumber: data.modelNumber,
      serialNumber: data.serialNumber,
      yearOfManufacture: data.yearOfManufacture,
      hourlyRate: data.hourlyRate || 0,
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
      purchasePrice: data.purchasePrice || 0,
      currentLocation: data.currentLocation || "Main Equipment Yard",
      rentalDetails: data.rentalDetails
        ? {
            vendorId: data.rentalDetails.vendorId
              ? new mongoose.Types.ObjectId(data.rentalDetails.vendorId)
              : null,
            dailyRate: data.rentalDetails.dailyRate || 0,
            monthlyRate: data.rentalDetails.monthlyRate || 0,
            rentalStartDate: data.rentalDetails.rentalStartDate
              ? new Date(data.rentalDetails.rentalStartDate)
              : null,
            rentalEndDate: data.rentalDetails.rentalEndDate
              ? new Date(data.rentalDetails.rentalEndDate)
              : null,
            contractNumber: data.rentalDetails.contractNumber,
          }
        : undefined,
      maintenanceSchedule: data.maintenanceSchedule
        ? {
            frequencyMonths: data.maintenanceSchedule.frequencyMonths || 6,
            lastServiceDate: data.maintenanceSchedule.lastServiceDate
              ? new Date(data.maintenanceSchedule.lastServiceDate)
              : null,
            nextServiceDate: data.maintenanceSchedule.nextServiceDate
              ? new Date(data.maintenanceSchedule.nextServiceDate)
              : null,
          }
        : undefined,
      notes: data.notes,
    });

    return await equipment.save();
  }

  /**
   * List equipment with filters and pagination
   */
  async getEquipmentList(filters: {
    search?: string;
    category?: EquipmentCategory;
    ownershipType?: EquipmentOwnershipType;
    status?: EquipmentStatus;
    page?: number;
    limit?: number;
  }): Promise<{ equipment: IEquipment[]; total: number; page: number; totalPages: number }> {
    const query: mongoose.FilterQuery<IEquipment> = {};

    if (filters.search) {
      query.$or = [
        { code: { $regex: filters.search, $options: "i" } },
        { name: { $regex: filters.search, $options: "i" } },
        { serialNumber: { $regex: filters.search, $options: "i" } },
        { make: { $regex: filters.search, $options: "i" } },
        { modelNumber: { $regex: filters.search, $options: "i" } },
      ];
    }

    if (filters.category) {
      query.category = filters.category;
    }
    if (filters.ownershipType) {
      query.ownershipType = filters.ownershipType;
    }
    if (filters.status) {
      query.status = filters.status;
    }

    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const skip = (page - 1) * limit;

    const [equipment, total] = await Promise.all([
      Equipment.find(query)
        .populate("rentalDetails.vendorId", "name code contact")
        .sort({ code: 1 })
        .skip(skip)
        .limit(limit),
      Equipment.countDocuments(query),
    ]);

    return {
      equipment,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Get single equipment profile with active assignments, maintenance history, and inspection logs
   */
  async getEquipmentById(equipmentId: string): Promise<{
    equipment: IEquipment;
    activeAssignments: IEquipmentAssignment[];
    assignmentHistory: IEquipmentAssignment[];
    maintenanceRecords: IEquipmentMaintenance[];
    inspections: IEquipmentInspection[];
  }> {
    if (!mongoose.Types.ObjectId.isValid(equipmentId)) {
      throw new AppError("Invalid equipment ID", 400);
    }

    const equipment = await Equipment.findById(equipmentId).populate(
      "rentalDetails.vendorId",
      "name code contact"
    );
    if (!equipment) {
      throw new AppError("Equipment not found", 404);
    }

    const [assignments, maintenanceRecords, inspections] = await Promise.all([
      EquipmentAssignment.find({ equipmentId })
        .populate("projectId", "name code status")
        .populate("taskId", "title status")
        .populate("assignedTo", "firstName lastName email")
        .populate("createdBy", "firstName lastName email")
        .sort({ startDate: -1 }),
      EquipmentMaintenance.find({ equipmentId })
        .populate("vendorId", "name code contact")
        .populate("createdBy", "firstName lastName email")
        .sort({ scheduledDate: -1 }),
      EquipmentInspection.find({ equipmentId })
        .populate("projectId", "name code")
        .populate("inspectedBy", "firstName lastName email")
        .sort({ inspectionDate: -1 }),
    ]);

    const activeAssignments = assignments.filter((a) => a.status === "ACTIVE");
    const assignmentHistory = assignments.filter((a) => a.status !== "ACTIVE");

    return {
      equipment,
      activeAssignments,
      assignmentHistory,
      maintenanceRecords,
      inspections,
    };
  }

  /**
   * Update equipment details
   */
  async updateEquipment(equipmentId: string, data: UpdateEquipmentInput): Promise<IEquipment> {
    if (!mongoose.Types.ObjectId.isValid(equipmentId)) {
      throw new AppError("Invalid equipment ID", 400);
    }

    const equipment = await Equipment.findById(equipmentId);
    if (!equipment) {
      throw new AppError("Equipment not found", 404);
    }

    if (data.name !== undefined) equipment.name = data.name.trim();
    if (data.category !== undefined) equipment.category = data.category;
    if (data.ownershipType !== undefined) equipment.ownershipType = data.ownershipType;
    if (data.status !== undefined) equipment.status = data.status;
    if (data.make !== undefined) equipment.make = data.make;
    if (data.modelNumber !== undefined) equipment.modelNumber = data.modelNumber;
    if (data.serialNumber !== undefined) equipment.serialNumber = data.serialNumber;
    if (data.yearOfManufacture !== undefined) equipment.yearOfManufacture = data.yearOfManufacture;
    if (data.hourlyRate !== undefined) equipment.hourlyRate = data.hourlyRate;
    if (data.purchasePrice !== undefined) equipment.purchasePrice = data.purchasePrice;
    if (data.currentLocation !== undefined) equipment.currentLocation = data.currentLocation;

    if (data.rentalDetails !== undefined) {
      equipment.rentalDetails = {
        vendorId: data.rentalDetails.vendorId
          ? new mongoose.Types.ObjectId(data.rentalDetails.vendorId)
          : undefined,
        dailyRate: data.rentalDetails.dailyRate,
        monthlyRate: data.rentalDetails.monthlyRate,
        rentalStartDate: data.rentalDetails.rentalStartDate
          ? new Date(data.rentalDetails.rentalStartDate)
          : undefined,
        rentalEndDate: data.rentalDetails.rentalEndDate
          ? new Date(data.rentalDetails.rentalEndDate)
          : undefined,
        contractNumber: data.rentalDetails.contractNumber,
      };
    }

    if (data.maintenanceSchedule !== undefined) {
      equipment.maintenanceSchedule = {
        frequencyMonths: data.maintenanceSchedule.frequencyMonths || 6,
        lastServiceDate: data.maintenanceSchedule.lastServiceDate
          ? new Date(data.maintenanceSchedule.lastServiceDate)
          : undefined,
        nextServiceDate: data.maintenanceSchedule.nextServiceDate
          ? new Date(data.maintenanceSchedule.nextServiceDate)
          : undefined,
      };
    }

    if (data.notes !== undefined) equipment.notes = data.notes;

    return await equipment.save();
  }

  /**
   * Delete equipment
   */
  async deleteEquipment(equipmentId: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(equipmentId)) {
      throw new AppError("Invalid equipment ID", 400);
    }

    const equipment = await Equipment.findById(equipmentId);
    if (!equipment) {
      throw new AppError("Equipment not found", 404);
    }

    const activeCount = await EquipmentAssignment.countDocuments({
      equipmentId,
      status: "ACTIVE",
    });

    if (activeCount > 0) {
      equipment.status = "RETIRED";
      await equipment.save();
    } else {
      await Equipment.findByIdAndDelete(equipmentId);
    }
  }

  /**
   * Conflict Detection Engine & Equipment Assignment
   */
  async assignEquipment(
    projectId: string,
    data: AssignEquipmentInput,
    actorId: string
  ): Promise<IEquipmentAssignment> {
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new AppError("Invalid project ID", 400);
    }
    if (!mongoose.Types.ObjectId.isValid(data.equipmentId)) {
      throw new AppError("Invalid equipment ID", 400);
    }

    const equipment = await Equipment.findById(data.equipmentId);
    if (!equipment) {
      throw new AppError("Equipment not found", 404);
    }

    // 1. Check availability status
    const nonAssignableStatuses: EquipmentStatus[] = [
      "UNDER_MAINTENANCE",
      "BREAKDOWN",
      "INACTIVE",
      "RETIRED",
    ];

    if (nonAssignableStatuses.includes(equipment.status)) {
      throw new AppError(
        `Equipment '${equipment.name} (${equipment.code})' is currently ${equipment.status.replace(
          /_/g,
          " "
        )} and cannot be assigned.`,
        400
      );
    }

    const reqStart = new Date(data.startDate);
    const reqEnd = new Date(data.endDate);

    if (reqEnd < reqStart) {
      throw new AppError("End date cannot be earlier than start date", 400);
    }

    // 2. Schedule Conflict Detection: Check overlapping active assignments
    const conflictingAssignment = await EquipmentAssignment.findOne({
      equipmentId: data.equipmentId,
      status: "ACTIVE",
      $or: [
        { startDate: { $lte: reqEnd }, endDate: { $gte: reqStart } },
      ],
    }).populate("projectId", "name code");

    if (conflictingAssignment) {
      const proj = conflictingAssignment.projectId as any;
      const conflictProj = proj ? `${proj.name} (${proj.code})` : "another project";
      throw new AppError(
        `Schedule Conflict: Equipment '${equipment.name}' is already actively assigned to ${conflictProj} from ${new Date(
          conflictingAssignment.startDate
        ).toLocaleDateString()} to ${new Date(
          conflictingAssignment.endDate
        ).toLocaleDateString()}.`,
        409
      );
    }

    // 3. Create assignment
    const assignment = new EquipmentAssignment({
      equipmentId: new mongoose.Types.ObjectId(data.equipmentId),
      projectId: new mongoose.Types.ObjectId(projectId),
      taskId: data.taskId ? new mongoose.Types.ObjectId(data.taskId) : null,
      assignedTo: data.assignedTo ? new mongoose.Types.ObjectId(data.assignedTo) : null,
      startDate: reqStart,
      endDate: reqEnd,
      purpose: data.purpose,
      meterReadingStart: data.meterReadingStart || 0,
      status: "ACTIVE",
      createdBy: new mongoose.Types.ObjectId(actorId),
      notes: data.notes,
    });

    await assignment.save();

    // 4. Update equipment status to ASSIGNED
    equipment.status = "ASSIGNED";
    await equipment.save();

    return await assignment.populate([
      { path: "equipmentId", select: "code name category make modelNumber status" },
      { path: "projectId", select: "name code status" },
      { path: "taskId", select: "title status" },
      { path: "assignedTo", select: "firstName lastName email" },
      { path: "createdBy", select: "firstName lastName email" },
    ]);
  }

  /**
   * Get project equipment assignments
   */
  async getProjectEquipment(
    projectId: string,
    filters?: { status?: EquipmentAssignmentStatus; category?: EquipmentCategory }
  ): Promise<IEquipmentAssignment[]> {
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new AppError("Invalid project ID", 400);
    }

    const query: mongoose.FilterQuery<IEquipmentAssignment> = {
      projectId: new mongoose.Types.ObjectId(projectId),
    };

    if (filters?.status) {
      query.status = filters.status;
    }

    const assignments = await EquipmentAssignment.find(query)
      .populate("equipmentId", "code name category make modelNumber status hourlyRate currentLocation")
      .populate("projectId", "name code status")
      .populate("taskId", "title status")
      .populate("assignedTo", "firstName lastName email")
      .populate("createdBy", "firstName lastName email")
      .sort({ startDate: -1 });

    if (filters?.category) {
      return assignments.filter(
        (a) => (a.equipmentId as unknown as IEquipment)?.category === filters.category
      );
    }

    return assignments;
  }

  /**
   * Update assignment (e.g. Return equipment, complete, or cancel)
   */
  async updateAssignment(
    projectId: string,
    assignmentId: string,
    data: UpdateAssignmentInput
  ): Promise<IEquipmentAssignment> {
    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
      throw new AppError("Invalid assignment ID", 400);
    }

    const assignment = await EquipmentAssignment.findOne({
      _id: assignmentId,
      projectId,
    });

    if (!assignment) {
      throw new AppError("Equipment assignment not found for this project", 404);
    }

    if (data.endDate !== undefined) assignment.endDate = new Date(data.endDate);
    if (data.actualReturnDate !== undefined) {
      assignment.actualReturnDate = data.actualReturnDate
        ? new Date(data.actualReturnDate)
        : null;
    }
    if (data.meterReadingEnd !== undefined) {
      assignment.meterReadingEnd = data.meterReadingEnd !== null ? data.meterReadingEnd : undefined;
    }
    if (data.status !== undefined) assignment.status = data.status;
    if (data.notes !== undefined) assignment.notes = data.notes;

    await assignment.save();

    // If assignment is completed or cancelled, check if equipment should return to AVAILABLE
    if (assignment.status === "COMPLETED" || assignment.status === "CANCELLED") {
      const remainingActive = await EquipmentAssignment.countDocuments({
        equipmentId: assignment.equipmentId,
        status: "ACTIVE",
      });

      if (remainingActive === 0) {
        const eq = await Equipment.findById(assignment.equipmentId);
        if (eq && eq.status === "ASSIGNED") {
          eq.status = "AVAILABLE";
          await eq.save();
        }
      }
    }

    return await assignment.populate([
      { path: "equipmentId", select: "code name category make modelNumber status" },
      { path: "projectId", select: "name code status" },
      { path: "taskId", select: "title status" },
    ]);
  }

  /**
   * Equipment Breakdown Reporting Flow
   */
  async reportBreakdown(
    equipmentId: string,
    data: ReportBreakdownInput,
    actorId: string
  ): Promise<{ equipment: IEquipment; maintenance: IEquipmentMaintenance }> {
    if (!mongoose.Types.ObjectId.isValid(equipmentId)) {
      throw new AppError("Invalid equipment ID", 400);
    }

    const equipment = await Equipment.findById(equipmentId);
    if (!equipment) {
      throw new AppError("Equipment not found", 404);
    }

    // 1. Transition equipment status to BREAKDOWN
    equipment.status = "BREAKDOWN";
    await equipment.save();

    // 2. Automatically generate emergency maintenance ticket
    const maintenance = new EquipmentMaintenance({
      equipmentId: new mongoose.Types.ObjectId(equipmentId),
      type: "BREAKDOWN",
      scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : new Date(),
      description: data.description,
      cost: data.cost || 0,
      status: "IN_PROGRESS",
      notes: data.notes,
      createdBy: new mongoose.Types.ObjectId(actorId),
    });

    await maintenance.save();

    return {
      equipment,
      maintenance,
    };
  }

  /**
   * Schedule Maintenance
   */
  async scheduleMaintenance(
    equipmentId: string,
    data: ScheduleMaintenanceInput,
    actorId: string
  ): Promise<IEquipmentMaintenance> {
    if (!mongoose.Types.ObjectId.isValid(equipmentId)) {
      throw new AppError("Invalid equipment ID", 400);
    }

    const equipment = await Equipment.findById(equipmentId);
    if (!equipment) {
      throw new AppError("Equipment not found", 404);
    }

    const maintenance = new EquipmentMaintenance({
      equipmentId: new mongoose.Types.ObjectId(equipmentId),
      type: data.type,
      scheduledDate: new Date(data.scheduledDate),
      description: data.description,
      cost: data.cost || 0,
      performedBy: data.performedBy,
      vendorId: data.vendorId ? new mongoose.Types.ObjectId(data.vendorId) : null,
      status: "SCHEDULED",
      notes: data.notes,
      createdBy: new mongoose.Types.ObjectId(actorId),
    });

    await maintenance.save();

    // If maintenance is for today or type is BREAKDOWN, update status
    const scheduled = new Date(data.scheduledDate).getTime();
    const now = new Date().getTime();
    if (Math.abs(scheduled - now) < 24 * 60 * 60 * 1000 || data.type === "BREAKDOWN") {
      equipment.status = "UNDER_MAINTENANCE";
      await equipment.save();
    }

    return await maintenance.populate([
      { path: "equipmentId", select: "code name category status" },
      { path: "vendorId", select: "name code contact" },
      { path: "createdBy", select: "firstName lastName email" },
    ]);
  }

  /**
   * Complete Maintenance
   */
  async completeMaintenance(
    equipmentId: string,
    maintenanceId: string,
    data: CompleteMaintenanceInput
  ): Promise<IEquipmentMaintenance> {
    if (!mongoose.Types.ObjectId.isValid(maintenanceId)) {
      throw new AppError("Invalid maintenance ID", 400);
    }

    const maintenance = await EquipmentMaintenance.findOne({
      _id: maintenanceId,
      equipmentId,
    });

    if (!maintenance) {
      throw new AppError("Maintenance record not found for this equipment", 404);
    }

    maintenance.status = data.status || "COMPLETED";
    maintenance.completedDate = data.completedDate ? new Date(data.completedDate) : new Date();
    if (data.cost !== undefined) maintenance.cost = data.cost;
    if (data.partsReplaced) maintenance.partsReplaced = data.partsReplaced;
    if (data.performedBy) maintenance.performedBy = data.performedBy;
    if (data.notes) maintenance.notes = data.notes;

    await maintenance.save();

    // Update equipment service timestamps & restore status if no other active maintenance
    const equipment = await Equipment.findById(equipmentId);
    if (equipment) {
      if (equipment.maintenanceSchedule) {
        equipment.maintenanceSchedule.lastServiceDate = maintenance.completedDate;
        const freq = equipment.maintenanceSchedule.frequencyMonths || 6;
        const nextDate = new Date(maintenance.completedDate);
        nextDate.setMonth(nextDate.getMonth() + freq);
        equipment.maintenanceSchedule.nextServiceDate = nextDate;
      }

      if (equipment.status === "UNDER_MAINTENANCE" || equipment.status === "BREAKDOWN") {
        const remainingMaintenance = await EquipmentMaintenance.countDocuments({
          equipmentId,
          status: { $in: ["SCHEDULED", "IN_PROGRESS"] },
          _id: { $ne: maintenance._id },
        });

        if (remainingMaintenance === 0) {
          const activeAssignments = await EquipmentAssignment.countDocuments({
            equipmentId,
            status: "ACTIVE",
          });
          equipment.status = activeAssignments > 0 ? "ASSIGNED" : "AVAILABLE";
        }
      }
      await equipment.save();
    }

    return maintenance;
  }

  /**
   * Record Equipment Inspection
   */
  async recordInspection(
    equipmentId: string,
    data: RecordInspectionInput,
    actorId: string
  ): Promise<IEquipmentInspection> {
    if (!mongoose.Types.ObjectId.isValid(equipmentId)) {
      throw new AppError("Invalid equipment ID", 400);
    }

    const equipment = await Equipment.findById(equipmentId);
    if (!equipment) {
      throw new AppError("Equipment not found", 404);
    }

    const inspection = new EquipmentInspection({
      equipmentId: new mongoose.Types.ObjectId(equipmentId),
      projectId: data.projectId ? new mongoose.Types.ObjectId(data.projectId) : null,
      inspectionDate: data.inspectionDate ? new Date(data.inspectionDate) : new Date(),
      inspectedBy: new mongoose.Types.ObjectId(actorId),
      result: data.result,
      findings: data.findings,
      checklistItems: data.checklistItems,
      nextInspectionDate: data.nextInspectionDate ? new Date(data.nextInspectionDate) : null,
      notes: data.notes,
    });

    await inspection.save();

    // If inspection failed, flag equipment as UNDER_MAINTENANCE
    if (data.result === "FAILED") {
      equipment.status = "UNDER_MAINTENANCE";
      await equipment.save();
    } else if (
      data.result === "PASSED" &&
      (equipment.status === "UNDER_MAINTENANCE" || equipment.status === "BREAKDOWN")
    ) {
      const activeMaintenance = await EquipmentMaintenance.countDocuments({
        equipmentId,
        status: { $in: ["SCHEDULED", "IN_PROGRESS"] },
      });

      if (activeMaintenance === 0) {
        const activeAssignments = await EquipmentAssignment.countDocuments({
          equipmentId,
          status: "ACTIVE",
        });
        equipment.status = activeAssignments > 0 ? "ASSIGNED" : "AVAILABLE";
        await equipment.save();
      }
    }

    return await inspection.populate([
      { path: "equipmentId", select: "code name category status" },
      { path: "projectId", select: "name code" },
      { path: "inspectedBy", select: "firstName lastName email" },
    ]);
  }
}

export const equipmentService = new EquipmentService();
export default equipmentService;
