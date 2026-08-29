import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBOMItem extends Document {
  _id: mongoose.Types.ObjectId;
  bomId: mongoose.Types.ObjectId;
  materialId: mongoose.Types.ObjectId;
  plannedQuantity: number;
  usedQuantity: number;
  remainingQuantity: number;
  variance: number;
  unit: string;
  unitCost?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BOMItemSchema = new Schema<IBOMItem>(
  {
    bomId: {
      type: Schema.Types.ObjectId,
      ref: "BOM",
      required: true,
      index: true,
    },
    materialId: {
      type: Schema.Types.ObjectId,
      ref: "Material",
      required: true,
      index: true,
    },
    plannedQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    usedQuantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    remainingQuantity: {
      type: Number,
      required: true,
      default: 0,
    },
    variance: {
      type: Number,
      required: true,
      default: 0,
    },
    unit: {
      type: String,
      required: true,
      trim: true,
    },
    unitCost: {
      type: Number,
      min: 0,
      default: 0,
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

BOMItemSchema.index({ bomId: 1, materialId: 1 });

export const BOMItemModel: Model<IBOMItem> =
  mongoose.models.BOMItem || mongoose.model<IBOMItem>("BOMItem", BOMItemSchema);

export default BOMItemModel;
