import mongoose, { Schema, Document, Model } from "mongoose";

export type BOMStatus = "DRAFT" | "ACTIVE" | "SUPERSEDED" | "ARCHIVED";
export type BOMApprovalStatus = "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED";

export interface IBOM extends Document {
  _id: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  phaseId?: mongoose.Types.ObjectId | null;
  taskId?: mongoose.Types.ObjectId | null;
  version: number;
  status: BOMStatus;
  approvalStatus: BOMApprovalStatus;
  createdBy: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId | null;
  approvedAt?: Date | null;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BOMSchema = new Schema<IBOM>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    phaseId: {
      type: Schema.Types.ObjectId,
      ref: "Phase",
      default: null,
      index: true,
    },
    taskId: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      default: null,
      index: true,
    },
    version: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    status: {
      type: String,
      enum: ["DRAFT", "ACTIVE", "SUPERSEDED", "ARCHIVED"],
      default: "DRAFT",
      index: true,
    },
    approvalStatus: {
      type: String,
      enum: ["DRAFT", "PENDING_APPROVAL", "APPROVED", "REJECTED"],
      default: "DRAFT",
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

BOMSchema.index({ projectId: 1, version: 1 });
BOMSchema.index({ projectId: 1, status: 1 });

export const BOMModel: Model<IBOM> =
  mongoose.models.BOM || mongoose.model<IBOM>("BOM", BOMSchema);

export default BOMModel;
