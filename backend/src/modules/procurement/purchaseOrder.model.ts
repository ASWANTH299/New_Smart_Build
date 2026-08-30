import mongoose, { Schema, Document, Model } from "mongoose";

export type POApprovalStatus = "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
export type POStatus = "DRAFT" | "ISSUED" | "PARTIALLY_RECEIVED" | "FULFILLED" | "CANCELLED";

export interface IPurchaseOrderItem {
  materialId: mongoose.Types.ObjectId;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  receivedQuantity: number;
}

export interface IPurchaseOrder extends Document {
  _id: mongoose.Types.ObjectId;
  poNumber: string;
  procurementRequestId?: mongoose.Types.ObjectId;
  vendorId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  items: IPurchaseOrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  expectedDeliveryDate?: Date;
  approvalStatus: POApprovalStatus;
  status: POStatus;
  notes?: string;
  termsAndConditions?: string;
  createdBy: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseOrderItemSchema = new Schema<IPurchaseOrderItem>(
  {
    materialId: {
      type: Schema.Types.ObjectId,
      ref: "Material",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0.01,
    },
    unit: {
      type: String,
      required: true,
      trim: true,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    receivedQuantity: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  { _id: false }
);

const PurchaseOrderSchema = new Schema<IPurchaseOrder>(
  {
    poNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    procurementRequestId: {
      type: Schema.Types.ObjectId,
      ref: "ProcurementRequest",
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
      index: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    items: {
      type: [PurchaseOrderItemSchema],
      validate: [
        (val: IPurchaseOrderItem[]) => val.length > 0,
        "Purchase order must contain at least one item",
      ],
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    tax: {
      type: Number,
      min: 0,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    expectedDeliveryDate: {
      type: Date,
      index: true,
    },
    approvalStatus: {
      type: String,
      enum: ["DRAFT", "PENDING_APPROVAL", "APPROVED", "REJECTED"],
      default: "DRAFT",
      index: true,
    },
    status: {
      type: String,
      enum: ["DRAFT", "ISSUED", "PARTIALLY_RECEIVED", "FULFILLED", "CANCELLED"],
      default: "DRAFT",
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    termsAndConditions: {
      type: String,
      trim: true,
      default: "",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

PurchaseOrderSchema.index({ projectId: 1, status: 1 });
PurchaseOrderSchema.index({ vendorId: 1, status: 1 });

export const PurchaseOrderModel: Model<IPurchaseOrder> =
  mongoose.models.PurchaseOrder ||
  mongoose.model<IPurchaseOrder>("PurchaseOrder", PurchaseOrderSchema);

export default PurchaseOrderModel;
