import mongoose, { Document, Schema, Model } from "mongoose";

export type InspectionResult = "PASSED" | "FAILED" | "PASSED_WITH_CONDITIONS";

export interface IEquipmentInspection extends Document {
  equipmentId: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId | null;
  inspectionDate: Date;
  inspectedBy: mongoose.Types.ObjectId;
  result: InspectionResult;
  findings?: string;
  checklistItems?: Array<{
    item: string;
    passed: boolean;
    remarks?: string;
  }>;
  nextInspectionDate?: Date | null;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const equipmentInspectionSchema = new Schema<IEquipmentInspection>(
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
      default: null,
      index: true,
    },
    inspectionDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    inspectedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    result: {
      type: String,
      enum: ["PASSED", "FAILED", "PASSED_WITH_CONDITIONS"],
      required: true,
      index: true,
    },
    findings: {
      type: String,
      trim: true,
    },
    checklistItems: [
      {
        item: { type: String, required: true },
        passed: { type: Boolean, required: true },
        remarks: { type: String, trim: true },
      },
    ],
    nextInspectionDate: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: "equipment_inspections",
  }
);

equipmentInspectionSchema.index({ equipmentId: 1, inspectionDate: -1 });

export const EquipmentInspection: Model<IEquipmentInspection> =
  mongoose.models.EquipmentInspection ||
  mongoose.model<IEquipmentInspection>("EquipmentInspection", equipmentInspectionSchema);

export default EquipmentInspection;
