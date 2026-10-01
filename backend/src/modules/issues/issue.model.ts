import mongoose, { Document, Schema, Model } from "mongoose";

export type IssueCategory =
  | "SAFETY"
  | "QUALITY"
  | "MATERIAL"
  | "EQUIPMENT"
  | "SCHEDULE"
  | "WEATHER"
  | "PROJECT"
  | "PHASE"
  | "TASK"
  | "OTHER";

export type IssuePriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type IssueStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export interface IIssue extends Document {
  projectId: mongoose.Types.ObjectId;
  issueNumber: string;
  title: string;
  description: string;
  category: IssueCategory;
  priority: IssuePriority;
  status: IssueStatus;
  assignedTo?: mongoose.Types.ObjectId | null;
  reportedBy: mongoose.Types.ObjectId;
  createdBy?: mongoose.Types.ObjectId;
  phaseId?: mongoose.Types.ObjectId | null;
  taskId?: mongoose.Types.ObjectId | null;
  dueDate?: Date | null;
  resolvedAt?: Date | null;
  resolutionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const IssueSchema = new Schema<IIssue>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project ID is required"],
      index: true,
    },
    issueNumber: {
      type: String,
      required: [true, "Issue number is required"],
      trim: true,
    },
    title: {
      type: String,
      required: [true, "Issue title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Issue description is required"],
      trim: true,
    },
    category: {
      type: String,
      enum: [
        "SAFETY",
        "QUALITY",
        "MATERIAL",
        "EQUIPMENT",
        "SCHEDULE",
        "WEATHER",
        "PROJECT",
        "PHASE",
        "TASK",
        "OTHER",
      ],
      default: "OTHER",
      index: true,
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "MEDIUM",
      index: true,
    },
    status: {
      type: String,
      enum: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"],
      default: "OPEN",
      index: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Reported by user is required"],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    phaseId: {
      type: Schema.Types.ObjectId,
      ref: "Phase",
      default: null,
    },
    taskId: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      default: null,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolutionNotes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

IssueSchema.index({ projectId: 1, status: 1 });
IssueSchema.index({ projectId: 1, priority: 1 });
IssueSchema.index({ assignedTo: 1, status: 1 });
IssueSchema.index({ projectId: 1, dueDate: 1 });
IssueSchema.index({ projectId: 1, issueNumber: 1 }, { unique: true });

export const Issue: Model<IIssue> =
  mongoose.models.Issue || mongoose.model<IIssue>("Issue", IssueSchema);
