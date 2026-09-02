import mongoose, { Schema, Document } from "mongoose";

export type AttendanceStatus =
  | "PRESENT"
  | "ABSENT"
  | "HALF_DAY"
  | "ON_LEAVE"
  | "OVERTIME";

export interface IAttendance extends Document {
  projectId: mongoose.Types.ObjectId;
  workerId: mongoose.Types.ObjectId;
  date: string; // ISO Date string format YYYY-MM-DD
  checkIn?: Date;
  checkOut?: Date;
  workingHours: number;
  overtimeHours: number;
  status: AttendanceStatus;
  notes?: string;
  recordedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new Schema<IAttendance>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project ID is required"],
      index: true,
    },
    workerId: {
      type: Schema.Types.ObjectId,
      ref: "Worker",
      required: [true, "Worker ID is required"],
      index: true,
    },
    date: {
      type: String,
      required: [true, "Date is required (YYYY-MM-DD)"],
      index: true,
    },
    checkIn: {
      type: Date,
      default: null,
    },
    checkOut: {
      type: Date,
      default: null,
    },
    workingHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    overtimeHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["PRESENT", "ABSENT", "HALF_DAY", "ON_LEAVE", "OVERTIME"],
      default: "PRESENT",
      index: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Recorder user ID is required"],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound unique index per DATABASE-DESIGN.md Section 8.3 to prevent duplicate attendance
attendanceSchema.index({ workerId: 1, projectId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ projectId: 1, date: 1 });

export const Attendance = mongoose.model<IAttendance>("Attendance", attendanceSchema);
export default Attendance;
