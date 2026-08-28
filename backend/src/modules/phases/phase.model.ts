import mongoose, { Schema, Document, Model } from "mongoose";

export type PhaseStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "ON_HOLD";

export interface IPhase extends Document {
  _id: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  sequence: number;
  plannedStartDate: Date;
  plannedEndDate: Date;
  actualStartDate?: Date | null;
  actualEndDate?: Date | null;
  status: PhaseStatus;
  progress: number;
  dependencies: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const PhaseSchema = new Schema<IPhase>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 150,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    sequence: {
      type: Number,
      required: true,
      default: 1,
    },
    plannedStartDate: {
      type: Date,
      required: true,
    },
    plannedEndDate: {
      type: Date,
      required: true,
    },
    actualStartDate: {
      type: Date,
      default: null,
    },
    actualEndDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "ON_HOLD"],
      default: "NOT_STARTED",
      index: true,
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    dependencies: [
      {
        type: Schema.Types.ObjectId,
        ref: "Phase",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound indexes per DATABASE-DESIGN.md Section 7.1
PhaseSchema.index({ projectId: 1, sequence: 1 });
PhaseSchema.index({ projectId: 1, status: 1 });
PhaseSchema.index({ projectId: 1, plannedEndDate: 1 });

export const PhaseModel: Model<IPhase> =
  mongoose.models.Phase || mongoose.model<IPhase>("Phase", PhaseSchema);

export default PhaseModel;
