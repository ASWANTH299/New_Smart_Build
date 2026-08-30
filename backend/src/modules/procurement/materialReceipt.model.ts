import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMaterialReceiptItem {
  materialId: mongoose.Types.ObjectId;
  receivedQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  unitPrice: number;
  totalCost: number;
  rejectionReason?: string;
}

export interface IMaterialReceipt extends Document {
  _id: mongoose.Types.ObjectId;
  receiptNumber: string;
  purchaseOrderId: mongoose.Types.ObjectId;
  vendorId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  locationId: mongoose.Types.ObjectId;
  receivedBy: mongoose.Types.ObjectId;
  receivedAt: Date;
  items: IMaterialReceiptItem[];
  notes?: string;
  invoiceNumber?: string;
  deliveryChallanNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MaterialReceiptItemSchema = new Schema<IMaterialReceiptItem>(
  {
    materialId: {
      type: Schema.Types.ObjectId,
      ref: "Material",
      required: true,
    },
    receivedQuantity: {
      type: Number,
      required: true,
      min: 0.01,
    },
    acceptedQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    rejectedQuantity: {
      type: Number,
      min: 0,
      default: 0,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    totalCost: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

const MaterialReceiptSchema = new Schema<IMaterialReceipt>(
  {
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    purchaseOrderId: {
      type: Schema.Types.ObjectId,
      ref: "PurchaseOrder",
      required: true,
      index: true,
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
    locationId: {
      type: Schema.Types.ObjectId,
      ref: "InventoryLocation",
      required: true,
      index: true,
    },
    receivedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receivedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    items: {
      type: [MaterialReceiptItemSchema],
      validate: [
        (val: IMaterialReceiptItem[]) => val.length > 0,
        "Material receipt must contain at least one item",
      ],
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    invoiceNumber: {
      type: String,
      trim: true,
      default: "",
    },
    deliveryChallanNumber: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

MaterialReceiptSchema.index({ purchaseOrderId: 1, receivedAt: -1 });
MaterialReceiptSchema.index({ projectId: 1, receivedAt: -1 });

export const MaterialReceiptModel: Model<IMaterialReceipt> =
  mongoose.models.MaterialReceipt ||
  mongoose.model<IMaterialReceipt>("MaterialReceipt", MaterialReceiptSchema);

export default MaterialReceiptModel;
