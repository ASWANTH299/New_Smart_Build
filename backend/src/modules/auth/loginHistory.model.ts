import mongoose, { Document, Schema, Model } from "mongoose";

export interface ILoginHistory extends Document {
  _id: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId | null;
  emailAttempted: string;
  success: boolean;
  failureReason?: string | null;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

const loginHistorySchema = new Schema<ILoginHistory>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    emailAttempted: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    success: {
      type: Boolean,
      required: true,
      index: true,
    },
    failureReason: {
      type: String,
      default: null,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

loginHistorySchema.index({ userId: 1, timestamp: -1 });

export const LoginHistoryModel: Model<ILoginHistory> =
  mongoose.models.LoginHistory || mongoose.model<ILoginHistory>("LoginHistory", loginHistorySchema);

export default LoginHistoryModel;
