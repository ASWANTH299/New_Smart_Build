import mongoose, { Document, Schema, Model } from "mongoose";

export type UserRole =
  | "ADMIN"
  | "PROJECT_MANAGER"
  | "SITE_ENGINEER"
  | "STORE_MANAGER"
  | "CONTRACTOR"
  | "CLIENT";

export type UserStatus = "ACTIVE" | "DEACTIVATED" | "LOCKED" | "PENDING_ACTIVATION";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  primaryRole: UserRole;
  additionalPermissions: string[];
  status: UserStatus;
  accountLockedUntil?: Date | null;
  passwordChangedAt?: Date | null;
  lastLoginAt?: Date | null;
  failedLoginCount: number;
  resetPasswordToken?: string | null;
  resetPasswordExpires?: Date | null;
  activationToken?: string | null;
  activationExpires?: Date | null;
  deactivatedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
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
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, "Password hash is required"],
    },
    primaryRole: {
      type: String,
      required: [true, "Primary role is required"],
      enum: [
        "ADMIN",
        "PROJECT_MANAGER",
        "SITE_ENGINEER",
        "STORE_MANAGER",
        "CONTRACTOR",
        "CLIENT",
      ],
      default: "SITE_ENGINEER",
    },
    additionalPermissions: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["ACTIVE", "DEACTIVATED", "LOCKED", "PENDING_ACTIVATION"],
      default: "ACTIVE",
      index: true,
    },
    accountLockedUntil: {
      type: Date,
      default: null,
    },
    passwordChangedAt: {
      type: Date,
      default: null,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    failedLoginCount: {
      type: Number,
      default: 0,
    },
    resetPasswordToken: {
      type: String,
      default: null,
      index: true,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
    activationToken: {
      type: String,
      default: null,
      index: true,
    },
    activationExpires: {
      type: Date,
      default: null,
    },
    deactivatedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const UserModel: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default UserModel;
