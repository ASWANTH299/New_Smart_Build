import mongoose, { Document, Schema, Model } from "mongoose";
import { UserRole } from "./user.model.js";

export type AccessRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface IAccessRequest extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  requestedRole: UserRole;
  organization?: string;
  reason?: string;
  status: AccessRequestStatus;
  reviewedBy?: mongoose.Types.ObjectId | null;
  reviewedAt?: Date | null;
  rejectionReason?: string | null;
  assignedRole?: UserRole | null;
  userId?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const accessRequestSchema = new Schema<IAccessRequest>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      index: true,
    },
    requestedRole: {
      type: String,
      required: [true, "Requested role is required"],
      enum: [
        "ADMIN",
        "PROJECT_MANAGER",
        "SITE_ENGINEER",
        "STORE_MANAGER",
        "CONTRACTOR",
        "CLIENT",
      ],
    },
    organization: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },
    reason: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
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
    rejectionReason: {
      type: String,
      trim: true,
      default: null,
    },
    assignedRole: {
      type: String,
      enum: [
        "ADMIN",
        "PROJECT_MANAGER",
        "SITE_ENGINEER",
        "STORE_MANAGER",
        "CONTRACTOR",
        "CLIENT",
      ],
      default: null,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

accessRequestSchema.index({ email: 1, status: 1 });

export const AccessRequestModel: Model<IAccessRequest> =
  mongoose.models.AccessRequest ||
  mongoose.model<IAccessRequest>("AccessRequest", accessRequestSchema);

export default AccessRequestModel;
