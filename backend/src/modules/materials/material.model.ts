import mongoose, { Schema, Document, Model } from "mongoose";

export type MaterialStatus = "ACTIVE" | "INACTIVE" | "DISCONTINUED";

export interface IMaterial extends Document {
  _id: mongoose.Types.ObjectId;
  code: string;
  name: string;
  category: string;
  unit: string;
  specifications?: string;
  minimumStock: number;
  reorderLevel: number;
  unitPrice?: number;
  status: MaterialStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MaterialSchema = new Schema<IMaterial>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    unit: {
      type: String,
      required: true,
      trim: true,
    },
    specifications: {
      type: String,
      trim: true,
      default: "",
    },
    minimumStock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    reorderLevel: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    unitPrice: {
      type: Number,
      min: 0,
      default: 0,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "DISCONTINUED"],
      default: "ACTIVE",
      index: true,
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

MaterialSchema.index({ category: 1, status: 1 });
MaterialSchema.index({ name: "text", specifications: "text", code: "text" });

export const MaterialModel: Model<IMaterial> =
  mongoose.models.Material || mongoose.model<IMaterial>("Material", MaterialSchema);

export default MaterialModel;
