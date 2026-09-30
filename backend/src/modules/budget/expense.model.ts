import mongoose, { Document, Schema, Model } from "mongoose";
import { BudgetCategoryType } from "./budget.model.js";

export type ExpenseStatus = "PENDING" | "APPROVED" | "REJECTED" | "PAID";

export interface IExpense extends Document {
  projectId: mongoose.Types.ObjectId;
  category: BudgetCategoryType;
  phaseId?: mongoose.Types.ObjectId | null;
  taskId?: mongoose.Types.ObjectId | null;
  description: string;
  amount: number;
  date: Date;
  vendorId?: mongoose.Types.ObjectId | null;
  reference?: string;
  status: ExpenseStatus;
  receiptUrl?: string;
  recordedBy: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId | null;
  approvedAt?: Date | null;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema<IExpense>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ["MATERIAL", "WORKFORCE", "EQUIPMENT", "OTHER"],
      required: true,
      index: true,
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
    description: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: "Vendor",
      default: null,
    },
    reference: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "PAID"],
      default: "APPROVED",
      index: true,
    },
    receiptUrl: {
      type: String,
      trim: true,
    },
    recordedBy: {
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
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: "expenses",
  }
);

expenseSchema.index({ projectId: 1, date: -1 });
expenseSchema.index({ projectId: 1, category: 1, status: 1 });

export const Expense: Model<IExpense> =
  mongoose.models.Expense || mongoose.model<IExpense>("Expense", expenseSchema);

export default Expense;
