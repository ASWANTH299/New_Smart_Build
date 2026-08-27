import mongoose, { Document, Schema, Model } from "mongoose";

export interface IPhaseTemplate {
  name: string;
  sequence: number;
  description?: string;
}

export interface IProjectTemplate extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  projectTypeId?: mongoose.Types.ObjectId | null;
  defaultPhases: IPhaseTemplate[];
  defaultBudgetCategories: string[];
  status: "ACTIVE" | "INACTIVE";
  createdAt: Date;
  updatedAt: Date;
}

const projectTemplateSchema = new Schema<IProjectTemplate>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    projectTypeId: {
      type: Schema.Types.ObjectId,
      ref: "ProjectType",
      default: null,
    },
    defaultPhases: [
      {
        name: { type: String, required: true },
        sequence: { type: Number, required: true },
        description: { type: String, default: "" },
      },
    ],
    defaultBudgetCategories: {
      type: [String],
      default: ["Civil & Structure", "Materials", "Labor", "Equipment", "Finishing", "Contingency"],
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

export const ProjectTemplateModel: Model<IProjectTemplate> =
  mongoose.models.ProjectTemplate ||
  mongoose.model<IProjectTemplate>("ProjectTemplate", projectTemplateSchema);

export default ProjectTemplateModel;
