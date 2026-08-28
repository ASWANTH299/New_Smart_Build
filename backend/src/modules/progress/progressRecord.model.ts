import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProgressRecord extends Document {
  _id: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  taskId: mongoose.Types.ObjectId;
  phaseId: mongoose.Types.ObjectId;
  enteredBy: mongoose.Types.ObjectId;
  date: Date;
  completedQuantity: number;
  unit: string;
  notes?: string;
  source: "WEB" | "MOBILE";
  createdAt: Date;
}

const ProgressRecordSchema = new Schema<IProgressRecord>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    taskId: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: true,
      index: true,
    },
    phaseId: {
      type: Schema.Types.ObjectId,
      ref: "Phase",
      required: true,
      index: true,
    },
    enteredBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    completedQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      required: true,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    source: {
      type: String,
      enum: ["WEB", "MOBILE"],
      default: "WEB",
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Compound indexes per DATABASE-DESIGN.md Section 7.4
ProgressRecordSchema.index({ taskId: 1, date: -1 });
ProgressRecordSchema.index({ phaseId: 1, date: -1 });
ProgressRecordSchema.index({ projectId: 1, date: -1 });

export const ProgressRecordModel: Model<IProgressRecord> =
  mongoose.models.ProgressRecord ||
  mongoose.model<IProgressRecord>("ProgressRecord", ProgressRecordSchema);

export default ProgressRecordModel;
