import mongoose, { Schema, Document, Model } from "mongoose";

export type InventoryLocationType = "CENTRAL_WAREHOUSE" | "PROJECT_STORE";
export type InventoryLocationStatus = "ACTIVE" | "INACTIVE";

export interface IInventoryLocation extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  code: string;
  type: InventoryLocationType;
  projectId?: mongoose.Types.ObjectId | null;
  address?: string;
  status: InventoryLocationStatus;
  managerId?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const InventoryLocationSchema = new Schema<IInventoryLocation>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["CENTRAL_WAREHOUSE", "PROJECT_STORE"],
      required: true,
      index: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      default: null,
      index: true,
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
      index: true,
    },
    managerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

InventoryLocationSchema.index({ type: 1, status: 1 });

export const InventoryLocationModel: Model<IInventoryLocation> =
  mongoose.models.InventoryLocation ||
  mongoose.model<IInventoryLocation>("InventoryLocation", InventoryLocationSchema);

export default InventoryLocationModel;
