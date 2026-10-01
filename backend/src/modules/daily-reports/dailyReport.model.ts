import mongoose, { Document, Schema, Model } from "mongoose";

export type WeatherCondition =
  | "SUNNY"
  | "RAINY"
  | "CLOUDY"
  | "STORMY"
  | "WINDY"
  | "HOT"
  | "COLD"
  | "OTHER";

export type DailyReportStatus = "SUBMITTED" | "REVIEWED" | "APPROVED";

export interface IMaterialConsumed {
  materialId?: mongoose.Types.ObjectId | null;
  materialName?: string;
  quantity: number;
  unit?: string;
}

export interface IDailyReport extends Document {
  projectId: mongoose.Types.ObjectId;
  reportNumber: string;
  date: Date;
  reportDate: Date;
  weatherCondition: WeatherCondition;
  workPerformed: string;
  laborHeadcount: number;
  equipmentUsed: string[];
  materialsConsumed: IMaterialConsumed[];
  photos: string[];
  notes?: string;
  issues?: string[];
  status: DailyReportStatus;
  submittedBy: mongoose.Types.ObjectId;
  reviewedBy?: mongoose.Types.ObjectId | null;
  reviewedAt?: Date | null;
  reviewNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MaterialConsumedSchema = new Schema<IMaterialConsumed>(
  {
    materialId: {
      type: Schema.Types.ObjectId,
      ref: "Material",
      default: null,
    },
    materialName: {
      type: String,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const DailyReportSchema = new Schema<IDailyReport>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project ID is required"],
      index: true,
    },
    reportNumber: {
      type: String,
      required: [true, "Report number is required"],
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    reportDate: {
      type: Date,
      default: Date.now,
    },
    weatherCondition: {
      type: String,
      enum: ["SUNNY", "RAINY", "CLOUDY", "STORMY", "WINDY", "HOT", "COLD", "OTHER"],
      default: "SUNNY",
    },
    workPerformed: {
      type: String,
      required: [true, "Work performed is required"],
      trim: true,
    },
    laborHeadcount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    equipmentUsed: {
      type: [String],
      default: [],
    },
    materialsConsumed: {
      type: [MaterialConsumedSchema],
      default: [],
    },
    photos: {
      type: [String],
      default: [],
    },
    notes: {
      type: String,
      trim: true,
    },
    issues: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["SUBMITTED", "REVIEWED", "APPROVED"],
      default: "SUBMITTED",
      index: true,
    },
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Submitted by user is required"],
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
    reviewNotes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

DailyReportSchema.index({ projectId: 1, date: -1 });
DailyReportSchema.index({ projectId: 1, reportNumber: 1 }, { unique: true });
DailyReportSchema.index({ projectId: 1, status: 1 });

export const DailyReport: Model<IDailyReport> =
  mongoose.models.DailyReport ||
  mongoose.model<IDailyReport>("DailyReport", DailyReportSchema);
