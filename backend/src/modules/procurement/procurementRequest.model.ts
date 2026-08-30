import mongoose, { Schema, Document, Model } from "mongoose";

export type ProcurementRequestStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "CONVERTED_TO_PO"
  | "CANCELLED";

export interface IProcurementRequestItem {
  materialId: mongoose.Types.ObjectId;
  requestedQuantity: number;
  estimatedUnitPrice?: number;
  estimatedTotalPrice?: number;
  unit: string;
  notes?: string;
}

export interface IProcurementRequest extends Document {
  _id: mongoose.Types.ObjectId;
  requestNumber: string;
  projectId: mongoose.Types.ObjectId;
  requestedBy: mongoose.Types.ObjectId;
  reason: string;
  items: IProcurementRequestItem[];
  status: ProcurementRequestStatus;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProcurementRequestItemSchema = new Schema<IProcurementRequestItem>(
  {
    materialId: {
      type: Schema.Types.ObjectId,
      ref: "Material",
      required: true,
    },
    requestedQuantity: {
      type: Number,
      required: true,
      min: 0.01,
    },
    estimatedUnitPrice: {
      type: Number,
      min: 0,
      default: 0,
    },
    estimatedTotalPrice: {
      type: Number,
      min: 0,
      default: 0,
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
  { _id: false }
);

const ProcurementRequestSchema = new Schema<IProcurementRequest>(
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
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    items: {
      type: [ProcurementRequestItemSchema],
      validate: [
        (val: IProcurementRequestItem[]) => val.length > 0,
        "Procurement request must contain at least one item",
      ],
    },
    status: {
      type: String,
      enum: ["DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "CONVERTED_TO_PO", "CANCELLED"],
      default: "DRAFT",
      index: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

ProcurementRequestSchema.index({ projectId: 1, status: 1 });

export const ProcurementRequestModel: Model<IProcurementRequest> =
  mongoose.models.ProcurementRequest ||
  mongoose.model<IProcurementRequest>("ProcurementRequest", ProcurementRequestSchema);

export default ProcurementRequestModel;
