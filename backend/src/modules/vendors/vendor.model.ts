import mongoose, { Schema, Document, Model } from "mongoose";

export type VendorStatus = "ACTIVE" | "INACTIVE" | "BLACKLISTED";

export interface IVendorContact {
  name: string;
  email: string;
  phone: string;
  designation?: string;
}

export interface IVendorAddress {
  street?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
}

export interface IVendorPerformance {
  rating: number; // 1 to 5
  totalOrders: number;
  onTimeDeliveryRate: number; // 0 to 100 percentage
  notes?: string;
}

export interface IVendor extends Document {
  _id: mongoose.Types.ObjectId;
  code: string;
  name: string;
  contact: IVendorContact;
  address: IVendorAddress;
  materialsSupplied: mongoose.Types.ObjectId[];
  status: VendorStatus;
  performanceSummary: IVendorPerformance;
  createdAt: Date;
  updatedAt: Date;
}

const VendorSchema = new Schema<IVendor>(
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
    contact: {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true, lowercase: true },
      phone: { type: String, required: true, trim: true },
      designation: { type: String, trim: true, default: "" },
    },
    address: {
      street: { type: String, trim: true, default: "" },
      city: { type: String, required: true, trim: true },
      state: { type: String, trim: true, default: "" },
      postalCode: { type: String, trim: true, default: "" },
      country: { type: String, required: true, trim: true, default: "India" },
    },
    materialsSupplied: [
      {
        type: Schema.Types.ObjectId,
        ref: "Material",
      },
    ],
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "BLACKLISTED"],
      default: "ACTIVE",
      index: true,
    },
    performanceSummary: {
      rating: { type: Number, min: 1, max: 5, default: 5 },
      totalOrders: { type: Number, min: 0, default: 0 },
      onTimeDeliveryRate: { type: Number, min: 0, max: 100, default: 100 },
      notes: { type: String, trim: true, default: "" },
    },
  },
  {
    timestamps: true,
  }
);

VendorSchema.index({ status: 1, name: 1 });

export const VendorModel: Model<IVendor> =
  mongoose.models.Vendor || mongoose.model<IVendor>("Vendor", VendorSchema);

export default VendorModel;
