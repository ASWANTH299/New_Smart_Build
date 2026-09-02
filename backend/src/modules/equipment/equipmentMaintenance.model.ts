import mongoose, { Document, Schema, Model } from "mongoose";

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

export interface IEquipmentMaintenance extends Document {
  equipmentId: mongoose.Types.ObjectId;
  type: MaintenanceType;
  scheduledDate: Date;
  completedDate?: Date | null;
  description: string;
  cost: number;
  performedBy?: string;
  vendorId?: mongoose.Types.ObjectId | null;
  partsReplaced?: Array<{
    partName: string;
    partNumber?: string;
    quantity: number;
    cost: number;
  }>;
  status: MaintenanceStatus;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const equipmentMaintenanceSchema = new Schema<IEquipmentMaintenance>(
  {
    equipmentId: {
      type: Schema.Types.ObjectId,
      ref: "Equipment",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["PREVENTIVE", "CORRECTIVE", "BREAKDOWN", "INSPECTION_SERVICE"],
      required: true,
      index: true,
    },
    scheduledDate: {
      type: Date,
      required: true,
    },
    completedDate: {
      type: Date,
      default: null,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    cost: {
      type: Number,
      default: 0,
      min: 0,
    },
    performedBy: {
      type: String,
      trim: true,
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: "Vendor",
      default: null,
    },
    partsReplaced: [
      {
        partName: { type: String, required: true },
        partNumber: { type: String, trim: true },
        quantity: { type: Number, default: 1, min: 1 },
        cost: { type: Number, default: 0, min: 0 },
      },
    ],
    status: {
      type: String,
      enum: ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
      default: "SCHEDULED",
      index: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "equipment_maintenance",
  }
);

equipmentMaintenanceSchema.index({ equipmentId: 1, scheduledDate: 1, status: 1 });

export const EquipmentMaintenance: Model<IEquipmentMaintenance> =
  mongoose.models.EquipmentMaintenance ||
  mongoose.model<IEquipmentMaintenance>("EquipmentMaintenance", equipmentMaintenanceSchema);

export default EquipmentMaintenance;
