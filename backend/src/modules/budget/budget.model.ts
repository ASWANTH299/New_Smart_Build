import mongoose, { Document, Schema, Model } from "mongoose";

export type BudgetCategoryType = "MATERIAL" | "WORKFORCE" | "EQUIPMENT" | "OTHER";

export type BudgetStatus = "DRAFT" | "APPROVED" | "REVISED" | "LOCKED";

export interface IBudgetCategory {
  category: BudgetCategoryType;
  plannedAmount: number;
  actualAmount: number;
  committedAmount?: number;
  variance: number; // plannedAmount - actualAmount
  notes?: string;
}

export interface IBudget extends Document {
  projectId: mongoose.Types.ObjectId;
  version: number;
  status: BudgetStatus;
  totalPlanned: number;
  totalActual: number;
  totalCommitted: number;
  variance: number; // totalPlanned - totalActual
  categories: IBudgetCategory[];
  currency: string;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId | null;
  approvedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const budgetCategorySchema = new Schema<IBudgetCategory>(
  {
    category: {
      type: String,
      enum: ["MATERIAL", "WORKFORCE", "EQUIPMENT", "OTHER"],
      required: true,
    },
    plannedAmount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    actualAmount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    committedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    variance: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const budgetSchema = new Schema<IBudget>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      unique: true,
      index: true,
    },
    version: {
      type: Number,
      default: 1,
      min: 1,
    },
    status: {
      type: String,
      enum: ["DRAFT", "APPROVED", "REVISED", "LOCKED"],
      default: "DRAFT",
      index: true,
    },
    totalPlanned: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalActual: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalCommitted: {
      type: Number,
      default: 0,
      min: 0,
    },
    variance: {
      type: Number,
      default: 0,
    },
    categories: {
      type: [budgetCategorySchema],
      default: [
        { category: "MATERIAL", plannedAmount: 0, actualAmount: 0, committedAmount: 0, variance: 0 },
        { category: "WORKFORCE", plannedAmount: 0, actualAmount: 0, committedAmount: 0, variance: 0 },
        { category: "EQUIPMENT", plannedAmount: 0, actualAmount: 0, committedAmount: 0, variance: 0 },
        { category: "OTHER", plannedAmount: 0, actualAmount: 0, committedAmount: 0, variance: 0 },
      ],
    },
    currency: {
      type: String,
      default: "INR",
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "budgets",
  }
);

export const Budget: Model<IBudget> =
  mongoose.models.Budget || mongoose.model<IBudget>("Budget", budgetSchema);

export default Budget;
