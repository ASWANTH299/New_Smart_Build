import mongoose, { Document, Schema, Model } from "mongoose";

export interface IProjectType extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  code: string;
  description?: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: Date;
  updatedAt: Date;
}

const projectTypeSchema = new Schema<IProjectType>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
  },
  {
    timestamps: true,
  }
);

export const ProjectTypeModel: Model<IProjectType> =
  mongoose.models.ProjectType ||
  mongoose.model<IProjectType>("ProjectType", projectTypeSchema);

export default ProjectTypeModel;
