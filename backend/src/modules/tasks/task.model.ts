import mongoose, { Schema, Document, Model } from "mongoose";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "BLOCKED" | "COMPLETED";

export interface ITask extends Document {
  _id: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  phaseId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  assigneeId?: mongoose.Types.ObjectId | null;
  contractorId?: mongoose.Types.ObjectId | null;
  priority: TaskPriority;
  status: TaskStatus;
  plannedStartDate: Date;
  plannedEndDate: Date;
  actualStartDate?: Date | null;
  actualEndDate?: Date | null;
  plannedQuantity: number;
  unit: string;
  completedQuantity: number;
  progress: number;
  dependencies: mongoose.Types.ObjectId[];
  attachments: string[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date | null;
}

const TaskSchema = new Schema<ITask>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    phaseId: {
      type: Schema.Types.ObjectId,
      ref: "Phase",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    assigneeId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    contractorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
      default: "MEDIUM",
      index: true,
    },
    status: {
      type: String,
      enum: ["TODO", "IN_PROGRESS", "IN_REVIEW", "BLOCKED", "COMPLETED"],
      default: "TODO",
      index: true,
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
    plannedQuantity: {
      type: Number,
      required: true,
      min: 0,
      default: 1,
    },
    unit: {
      type: String,
      required: true,
      trim: true,
      default: "units",
    },
    completedQuantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
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
        ref: "Task",
      },
    ],
    attachments: [
      {
        type: String,
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes per DATABASE-DESIGN.md Section 7.2
TaskSchema.index({ projectId: 1, phaseId: 1 });
TaskSchema.index({ projectId: 1, assigneeId: 1 });
TaskSchema.index({ projectId: 1, status: 1 });
TaskSchema.index({ projectId: 1, priority: 1 });
TaskSchema.index({ plannedEndDate: 1 });

export const TaskModel: Model<ITask> =
  mongoose.models.Task || mongoose.model<ITask>("Task", TaskSchema);

export default TaskModel;
