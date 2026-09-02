import mongoose, { Document, Schema, Model } from "mongoose";

export type EquipmentAssignmentStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";

export interface IEquipmentAssignment extends Document {
  equipmentId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  taskId?: mongoose.Types.ObjectId | null;
  assignedTo?: mongoose.Types.ObjectId | null;
  startDate: Date;
  endDate: Date;
  actualReturnDate?: Date | null;
  purpose?: string;
  meterReadingStart?: number;
  meterReadingEnd?: number;
  status: EquipmentAssignmentStatus;
  createdBy: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const equipmentAssignmentSchema = new Schema<IEquipmentAssignment>(
  {
    equipmentId: {
      type: Schema.Types.ObjectId,
      ref: "Equipment",
      required: true,
      index: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    taskId: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      default: null,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    actualReturnDate: {
      type: Date,
      default: null,
    },
    purpose: {
      type: String,
      trim: true,
    },
    meterReadingStart: {
      type: Number,
      default: 0,
      min: 0,
    },
    meterReadingEnd: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "COMPLETED", "CANCELLED"],
      default: "ACTIVE",
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: "equipment_assignments",
  }
);

// Compound indexes for schedule conflict checking & project queries
equipmentAssignmentSchema.index({ equipmentId: 1, startDate: 1, endDate: 1, status: 1 });
equipmentAssignmentSchema.index({ projectId: 1, startDate: 1, status: 1 });

export const EquipmentAssignment: Model<IEquipmentAssignment> =
  mongoose.models.EquipmentAssignment ||
  mongoose.model<IEquipmentAssignment>("EquipmentAssignment", equipmentAssignmentSchema);

export default EquipmentAssignment;
