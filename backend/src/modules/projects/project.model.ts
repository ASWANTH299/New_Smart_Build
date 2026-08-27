import mongoose, { Document, Schema, Model } from "mongoose";

export type ProjectStatus =
  | "DRAFT"
  | "PLANNING"
  | "ACTIVE"
  | "ON_HOLD"
  | "COMPLETED"
  | "ARCHIVED";

export type ProjectHealth = "HEALTHY" | "AT_RISK" | "CRITICAL";

export interface IProject extends Document {
  _id: mongoose.Types.ObjectId;
  code: string;
  name: string;
  typeId?: mongoose.Types.ObjectId | null;
  clientUserId?: mongoose.Types.ObjectId | null;
  location: string;
  description?: string;
  plannedStartDate: Date;
  plannedEndDate: Date;
  actualStartDate?: Date | null;
  actualEndDate?: Date | null;
  projectManagerId: mongoose.Types.ObjectId;
  status: ProjectStatus;
  health: ProjectHealth;
  healthFactors: string[];
  progress: number;
  createdBy: mongoose.Types.ObjectId;
  archivedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    code: {
      type: String,
      required: [true, "Project code is required"],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Project name is required"],
      trim: true,
    },
    typeId: {
      type: Schema.Types.ObjectId,
      ref: "ProjectType",
      default: null,
      index: true,
    },
    clientUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    location: {
      type: String,
      required: [true, "Project location is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    plannedStartDate: {
      type: Date,
      required: [true, "Planned start date is required"],
    },
    plannedEndDate: {
      type: Date,
      required: [true, "Planned end date is required"],
      index: true,
    },
    actualStartDate: {
      type: Date,
      default: null,
    },
    actualEndDate: {
      type: Date,
      default: null,
    },
    projectManagerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Project manager is required"],
      index: true,
    },
    status: {
      type: String,
      enum: ["DRAFT", "PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"],
      default: "PLANNING",
      index: true,
    },
    health: {
      type: String,
      enum: ["HEALTHY", "AT_RISK", "CRITICAL"],
      default: "HEALTHY",
      index: true,
    },
    healthFactors: {
      type: [String],
      default: [],
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    archivedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const ProjectModel: Model<IProject> =
  mongoose.models.Project || mongoose.model<IProject>("Project", projectSchema);

export default ProjectModel;
