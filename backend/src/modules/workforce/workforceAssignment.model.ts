import mongoose, { Schema, Document } from "mongoose";

export type AssignmentStatus = "ACTIVE" | "COMPLETED" | "REASSIGNED" | "CANCELLED";

export interface IWorkforceAssignment extends Document {
  projectId: mongoose.Types.ObjectId;
  workerId: mongoose.Types.ObjectId;
  phaseId?: mongoose.Types.ObjectId;
  taskId?: mongoose.Types.ObjectId;
  assignedBy: mongoose.Types.ObjectId;
  startDate: Date;
  endDate?: Date;
  status: AssignmentStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const workforceAssignmentSchema = new Schema<IWorkforceAssignment>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project ID is required"],
      index: true,
    },
    workerId: {
      type: Schema.Types.ObjectId,
      ref: "Worker",
      required: [true, "Worker ID is required"],
      index: true,
    },
    phaseId: {
      type: Schema.Types.ObjectId,
      ref: "Phase",
      default: null,
      index: true,
    },
    taskId: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      default: null,
      index: true,
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Assigner user ID is required"],
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "COMPLETED", "REASSIGNED", "CANCELLED"],
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

// Indexes per DATABASE-DESIGN.md Section 8.2
workforceAssignmentSchema.index({ projectId: 1, workerId: 1 });
workforceAssignmentSchema.index({ projectId: 1, taskId: 1 });
workforceAssignmentSchema.index({ workerId: 1, startDate: 1 });

export const WorkforceAssignment = mongoose.model<IWorkforceAssignment>(
  "WorkforceAssignment",
  workforceAssignmentSchema
);
export default WorkforceAssignment;
