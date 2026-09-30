import mongoose, { Document, Schema, Model } from "mongoose";
import { BudgetCategoryType } from "./budget.model.js";

export type BudgetChangeRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface ICategoryChange {
  category: BudgetCategoryType;
  currentPlanned: number;
  proposedPlanned: number;
  changeAmount: number;
}

export interface IBudgetChangeRequest extends Document {
  projectId: mongoose.Types.ObjectId;
  budgetId: mongoose.Types.ObjectId;
  requestedBy: mongoose.Types.ObjectId;
  reason: string;
  currentBudget: number;
  requestedChange: number;
  proposedBudget: number;
  categoryChanges: ICategoryChange[];
  status: BudgetChangeRequestStatus;
  reviewedBy?: mongoose.Types.ObjectId | null;
  reviewedAt?: Date | null;
  reviewNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const categoryChangeSchema = new Schema<ICategoryChange>(
  {
    category: {
      type: String,
      enum: ["MATERIAL", "WORKFORCE", "EQUIPMENT", "OTHER"],
      required: true,
    },
    currentPlanned: {
      type: Number,
      required: true,
      min: 0,
    },
    proposedPlanned: {
      type: Number,
      required: true,
      min: 0,
    },
    changeAmount: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const budgetChangeRequestSchema = new Schema<IBudgetChangeRequest>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    budgetId: {
      type: Schema.Types.ObjectId,
      ref: "Budget",
      required: true,
    },
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    currentBudget: {
      type: Number,
      required: true,
      min: 0,
    },
    requestedChange: {
      type: Number,
      required: true,
    },
    proposedBudget: {
      type: Number,
      required: true,
      min: 0,
    },
    categoryChanges: {
      type: [categoryChangeSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
      index: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewNotes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: "budget_change_requests",
  }
);

budgetChangeRequestSchema.index({ projectId: 1, status: 1, createdAt: -1 });

export const BudgetChangeRequest: Model<IBudgetChangeRequest> =
  mongoose.models.BudgetChangeRequest ||
  mongoose.model<IBudgetChangeRequest>(
    "BudgetChangeRequest",
    budgetChangeRequestSchema
  );

export default BudgetChangeRequest;
