import mongoose, { Document, Schema, Model } from "mongoose";

export type EquipmentCategory =
  | "EARTHMOVING"
  | "CONCRETE"
  | "MATERIAL_HANDLING"
  | "POWER_LIGHTING"
  | "COMPACTION"
  | "PUMPING"
  | "SCAFFOLDING"
  | "TRANSPORT"
  | "SURVEYING"
  | "OTHER";

export type EquipmentOwnershipType = "OWNED" | "RENTED" | "LEASED";

export type EquipmentStatus =
  | "AVAILABLE"
  | "ASSIGNED"
  | "IN_USE"
  | "UNDER_MAINTENANCE"
  | "BREAKDOWN"
  | "INACTIVE"
  | "RETIRED";

export interface IRentalDetails {
  vendorId?: mongoose.Types.ObjectId | null;
  dailyRate?: number;
  monthlyRate?: number;
  rentalStartDate?: Date | null;
  rentalEndDate?: Date | null;
  contractNumber?: string;
}

export interface IMaintenanceSchedule {
  frequencyMonths?: number;
  lastServiceDate?: Date | null;
  nextServiceDate?: Date | null;
}

export interface IEquipment extends Document {
  code: string;
  name: string;
  category: EquipmentCategory;
  ownershipType: EquipmentOwnershipType;
  status: EquipmentStatus;
  make?: string;
  modelNumber?: string;
  serialNumber?: string;
  yearOfManufacture?: number;
  hourlyRate?: number;
  purchaseDate?: Date | null;
  purchasePrice?: number;
  currentLocation?: string;
  rentalDetails?: IRentalDetails;
  maintenanceSchedule?: IMaintenanceSchedule;
  documents?: Array<{
    title: string;
    fileUrl: string;
    uploadedAt: Date;
  }>;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const equipmentSchema = new Schema<IEquipment>(
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
    },
    category: {
      type: String,
      enum: [
        "EARTHMOVING",
        "CONCRETE",
        "MATERIAL_HANDLING",
        "POWER_LIGHTING",
        "COMPACTION",
        "PUMPING",
        "SCAFFOLDING",
        "TRANSPORT",
        "SURVEYING",
        "OTHER",
      ],
      required: true,
      index: true,
    },
    ownershipType: {
      type: String,
      enum: ["OWNED", "RENTED", "LEASED"],
      default: "OWNED",
      index: true,
    },
    status: {
      type: String,
      enum: [
        "AVAILABLE",
        "ASSIGNED",
        "IN_USE",
        "UNDER_MAINTENANCE",
        "BREAKDOWN",
        "INACTIVE",
        "RETIRED",
      ],
      default: "AVAILABLE",
      index: true,
    },
    make: { type: String, trim: true },
    modelNumber: { type: String, trim: true },
    serialNumber: { type: String, trim: true },
    yearOfManufacture: { type: Number },
    hourlyRate: { type: Number, default: 0, min: 0 },
    purchaseDate: { type: Date, default: null },
    purchasePrice: { type: Number, default: 0, min: 0 },
    currentLocation: { type: String, trim: true, default: "Main Equipment Yard" },
    rentalDetails: {
      vendorId: {
        type: Schema.Types.ObjectId,
        ref: "Vendor",
        default: null,
      },
      dailyRate: { type: Number, default: 0, min: 0 },
      monthlyRate: { type: Number, default: 0, min: 0 },
      rentalStartDate: { type: Date, default: null },
      rentalEndDate: { type: Date, default: null },
      contractNumber: { type: String, trim: true },
    },
    maintenanceSchedule: {
      frequencyMonths: { type: Number, default: 6 },
      lastServiceDate: { type: Date, default: null },
      nextServiceDate: { type: Date, default: null },
    },
    documents: [
      {
        title: { type: String, required: true },
        fileUrl: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    notes: { type: String, trim: true },
  },
  {
    timestamps: true,
    collection: "equipment",
  }
);

equipmentSchema.index({ category: 1, status: 1 });
equipmentSchema.index({ ownershipType: 1, status: 1 });

export const Equipment: Model<IEquipment> =
  mongoose.models.Equipment || mongoose.model<IEquipment>("Equipment", equipmentSchema);

export default Equipment;
