import mongoose, { Document, Schema, Model } from "mongoose";

export type AssignmentStatus = "ACTIVE" | "INACTIVE" | "REMOVED";

export interface IProjectMembership extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  projectId: string;
  assignmentStatus: AssignmentStatus;
  assignedAt: Date;
  removedAt?: Date | null;
  assignedBy?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const projectMembershipSchema = new Schema<IProjectMembership>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    projectId: {
      type: String,
      required: [true, "Project ID is required"],
      index: true,
    },
    assignmentStatus: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "REMOVED"],
      default: "ACTIVE",
      index: true,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    removedAt: {
      type: Date,
      default: null,
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

projectMembershipSchema.index({ userId: 1, projectId: 1 }, { unique: true });
projectMembershipSchema.index({ projectId: 1, assignmentStatus: 1 });

export const ProjectMembershipModel: Model<IProjectMembership> =
  mongoose.models.ProjectMembership ||
  mongoose.model<IProjectMembership>("ProjectMembership", projectMembershipSchema);

export default ProjectMembershipModel;
