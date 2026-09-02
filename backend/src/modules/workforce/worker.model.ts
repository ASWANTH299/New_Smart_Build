import mongoose, { Schema, Document } from "mongoose";

export type WorkerType = "DIRECT" | "CONTRACTOR" | "SUBCONTRACTOR" | "TEMPORARY";

export type WorkerTrade =
  | "MASON"
  | "CARPENTER"
  | "ELECTRICIAN"
  | "PLUMBER"
  | "PAINTER"
  | "STEEL_FIXER"
  | "WELDER"
  | "HEAVY_OPERATOR"
  | "GENERAL_LABOR"
  | "SURVEYOR"
  | "FOREMAN"
  | "OTHER";

export type WorkerStatus = "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "TERMINATED";

export interface IWorkerContact {
  phone?: string;
  email?: string;
  address?: string;
  emergencyContact?: string;
}

export interface IWorker extends Document {
  name: string;
  workerType: WorkerType;
  trade: WorkerTrade;
  contractorId?: mongoose.Types.ObjectId;
  contact?: IWorkerContact;
  status: WorkerStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const workerSchema = new Schema<IWorker>(
  {
    name: {
      type: String,
      required: [true, "Worker name is required"],
      trim: true,
      index: true,
    },
    workerType: {
      type: String,
      enum: ["DIRECT", "CONTRACTOR", "SUBCONTRACTOR", "TEMPORARY"],
      default: "DIRECT",
      index: true,
    },
    trade: {
      type: String,
      enum: [
        "MASON",
        "CARPENTER",
        "ELECTRICIAN",
        "PLUMBER",
        "PAINTER",
        "STEEL_FIXER",
        "WELDER",
        "HEAVY_OPERATOR",
        "GENERAL_LABOR",
        "SURVEYOR",
        "FOREMAN",
        "OTHER",
      ],
      required: [true, "Worker trade is required"],
      index: true,
    },
    contractorId: {
      type: Schema.Types.ObjectId,
      ref: "Vendor",
      default: null,
      index: true,
    },
    contact: {
      phone: { type: String, trim: true },
      email: { type: String, trim: true, lowercase: true },
      address: { type: String, trim: true },
      emergencyContact: { type: String, trim: true },
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "ON_LEAVE", "TERMINATED"],
      default: "ACTIVE",
      index: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
workerSchema.index({ trade: 1, status: 1 });
workerSchema.index({ workerType: 1, contractorId: 1 });

export const Worker = mongoose.model<IWorker>("Worker", workerSchema);
export default Worker;
