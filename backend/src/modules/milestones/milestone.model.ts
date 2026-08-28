import mongoose, { Schema, Document, Model } from "mongoose";

export type MilestoneStatus = "PENDING" | "ACHIEVED" | "MISSED";

export interface IMilestone extends Document {
  _id: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  phaseId?: mongoose.Types.ObjectId | null;
  name: string;
  description?: string;
  plannedDate: Date;
  actualDate?: Date | null;
  status: MilestoneStatus;
  responsibleUserId?: mongoose.Types.ObjectId | null;
  relatedTaskIds: mongoose.Types.ObjectId[];
  clientVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MilestoneSchema = new Schema<IMilestone>(
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
      default: null,
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
    plannedDate: {
      type: Date,
      required: true,
    },
    actualDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["PENDING", "ACHIEVED", "MISSED"],
      default: "PENDING",
      index: true,
    },
    responsibleUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    relatedTaskIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Task",
      },
    ],
    clientVisible: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes per DATABASE-DESIGN.md Section 7.3
MilestoneSchema.index({ projectId: 1, plannedDate: 1 });
MilestoneSchema.index({ projectId: 1, status: 1 });
MilestoneSchema.index({ projectId: 1, clientVisible: 1 });

export const MilestoneModel: Model<IMilestone> =
  mongoose.models.Milestone || mongoose.model<IMilestone>("Milestone", MilestoneSchema);

export default MilestoneModel;
