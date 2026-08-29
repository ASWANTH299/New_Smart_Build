import mongoose, { Schema, Document, Model } from "mongoose";

export type InventoryTransactionType =
  | "RECEIPT"
  | "ISSUE"
  | "RETURN"
  | "TRANSFER_OUT"
  | "TRANSFER_IN"
  | "ADJUSTMENT"
  | "CONSUMPTION";

export type InventoryReferenceType =
  | "MATERIAL_REQUEST"
  | "PURCHASE_ORDER"
  | "DIRECT_RECEIPT"
  | "STOCK_ADJUSTMENT"
  | "SITE_TRANSFER"
  | "TASK_CONSUMPTION";

export interface IInventoryTransaction extends Document {
  _id: mongoose.Types.ObjectId;
  transactionNumber: string;
  projectId?: mongoose.Types.ObjectId | null;
  locationId: mongoose.Types.ObjectId;
  materialId: mongoose.Types.ObjectId;
  transactionType: InventoryTransactionType;
  quantity: number;
  unitCost: number;
  totalCost: number;
  referenceType?: InventoryReferenceType;
  referenceId?: mongoose.Types.ObjectId | null;
  fromLocationId?: mongoose.Types.ObjectId | null;
  toLocationId?: mongoose.Types.ObjectId | null;
  performedBy: mongoose.Types.ObjectId;
  reason?: string;
  timestamp: Date;
  createdAt: Date;
}

const InventoryTransactionSchema = new Schema<IInventoryTransaction>(
  {
    transactionNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      default: null,
      index: true,
    },
    locationId: {
      type: Schema.Types.ObjectId,
      ref: "InventoryLocation",
      required: true,
      index: true,
    },
    materialId: {
      type: Schema.Types.ObjectId,
      ref: "Material",
      required: true,
      index: true,
    },
    transactionType: {
      type: String,
      enum: [
        "RECEIPT",
        "ISSUE",
        "RETURN",
        "TRANSFER_OUT",
        "TRANSFER_IN",
        "ADJUSTMENT",
        "CONSUMPTION",
      ],
      required: true,
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    unitCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    referenceType: {
      type: String,
      enum: [
        "MATERIAL_REQUEST",
        "PURCHASE_ORDER",
        "DIRECT_RECEIPT",
        "STOCK_ADJUSTMENT",
        "SITE_TRANSFER",
        "TASK_CONSUMPTION",
      ],
      default: null,
    },
    referenceId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    fromLocationId: {
      type: Schema.Types.ObjectId,
      ref: "InventoryLocation",
      default: null,
    },
    toLocationId: {
      type: Schema.Types.ObjectId,
      ref: "InventoryLocation",
      default: null,
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reason: {
      type: String,
      trim: true,
      default: "",
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

InventoryTransactionSchema.index({ locationId: 1, materialId: 1, timestamp: -1 });
InventoryTransactionSchema.index({ projectId: 1, timestamp: -1 });
InventoryTransactionSchema.index({ referenceType: 1, referenceId: 1 });

export const InventoryTransactionModel: Model<IInventoryTransaction> =
  mongoose.models.InventoryTransaction ||
  mongoose.model<IInventoryTransaction>(
    "InventoryTransaction",
    InventoryTransactionSchema
  );

export default InventoryTransactionModel;
