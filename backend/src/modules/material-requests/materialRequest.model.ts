import mongoose, { Schema, Document, Model } from "mongoose";

export type MaterialRequestStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "PARTIALLY_ISSUED"
  | "ISSUED"
  | "CANCELLED";

export interface IMaterialRequestItem {
  materialId: mongoose.Types.ObjectId;
  requestedQuantity: number;
  approvedQuantity: number;
  issuedQuantity: number;
  unit: string;
  notes?: string;
}

export interface IMaterialRequest extends Document {
  _id: mongoose.Types.ObjectId;
  requestNumber: string;
  projectId: mongoose.Types.ObjectId;
  requestedBy: mongoose.Types.ObjectId;
  phaseId?: mongoose.Types.ObjectId | null;
  taskId?: mongoose.Types.ObjectId | null;
  status: MaterialRequestStatus;
  reason: string;
  items: IMaterialRequestItem[];
  reviewedBy?: mongoose.Types.ObjectId | null;
  reviewedAt?: Date | null;
  rejectionReason?: string;
  issuedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const MaterialRequestItemSchema = new Schema<IMaterialRequestItem>(
  {
    materialId: {
      type: Schema.Types.ObjectId,
      ref: "Material",
      required: true,
    },
    requestedQuantity: {
      type: Number,
      required: true,
      min: 0.0001,
    },
    approvedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    issuedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    unit: {
      type: String,
      required: true,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: true }
);

const MaterialRequestSchema = new Schema<IMaterialRequest>(
  {
    requestNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    phaseId: {
      type: Schema.Types.ObjectId,
      ref: "Phase",
      default: null,
    },
    taskId: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      default: null,
    },
    status: {
      type: String,
      enum: [
        "DRAFT",
        "SUBMITTED",
        "APPROVED",
        "REJECTED",
        "PARTIALLY_ISSUED",
        "ISSUED",
        "CANCELLED",
      ],
      default: "DRAFT",
      index: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    items: {
      type: [MaterialRequestItemSchema],
      required: true,
      validate: {
        validator: function (v: IMaterialRequestItem[]) {
          return Array.isArray(v) && v.length > 0;
        },
        message: "A material request must contain at least one item.",
      },
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: "",
    },
    issuedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

MaterialRequestSchema.index({ projectId: 1, status: 1 });
MaterialRequestSchema.index({ projectId: 1, createdAt: -1 });

export const MaterialRequestModel: Model<IMaterialRequest> =
  mongoose.models.MaterialRequest ||
  mongoose.model<IMaterialRequest>("MaterialRequest", MaterialRequestSchema);

export default MaterialRequestModel;
