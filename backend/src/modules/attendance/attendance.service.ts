import mongoose from "mongoose";
import { Attendance, IAttendance, AttendanceStatus } from "./attendance.model.js";
import { Worker } from "../workforce/worker.model.js";
import { AppError } from "../../utils/AppError.js";

export interface RecordAttendanceInput {
  workerId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  checkIn?: string | Date | null;
  checkOut?: string | Date | null;
  workingHours?: number;
  overtimeHours?: number;
  notes?: string;
}

export interface BulkRecordAttendanceInput {
  date: string;
  records: Array<{
    workerId: string;
    status: AttendanceStatus;
    checkIn?: string | Date | null;
    checkOut?: string | Date | null;
    workingHours?: number;
    overtimeHours?: number;
    notes?: string;
  }>;
}

export interface UpdateAttendanceInput {
  status?: AttendanceStatus;
  checkIn?: string | Date | null;
  checkOut?: string | Date | null;
  workingHours?: number;
  overtimeHours?: number;
  notes?: string;
}

export interface AttendanceSummary {
  date?: string;
  totalRecords: number;
  presentCount: number;
  absentCount: number;
  halfDayCount: number;
  onLeaveCount: number;
  overtimeCount: number;
  totalWorkingHours: number;
  totalOvertimeHours: number;
}

export class AttendanceService {
  /**
   * Helper to calculate working hours and overtime
   */
  calculateHoursAndOvertime(
    status: AttendanceStatus,
    checkIn?: Date | null,
    checkOut?: Date | null,
    manualWorkingHours?: number,
    manualOvertimeHours?: number
  ): { workingHours: number; overtimeHours: number } {
    if (checkIn && checkOut) {
      const start = new Date(checkIn).getTime();
      const end = new Date(checkOut).getTime();
      if (end > start) {
        const totalDurationHours = (end - start) / (1000 * 60 * 60);
        const workingHours = Math.round(Math.min(totalDurationHours, 8) * 100) / 100;
        const overtimeHours = Math.round(Math.max(0, totalDurationHours - 8) * 100) / 100;
        return { workingHours, overtimeHours };
      }
    }

    if (manualWorkingHours !== undefined && manualOvertimeHours !== undefined) {
      return {
        workingHours: Math.max(0, manualWorkingHours),
        overtimeHours: Math.max(0, manualOvertimeHours),
      };
    }

    switch (status) {
      case "PRESENT":
        return {
          workingHours: manualWorkingHours !== undefined ? manualWorkingHours : 8,
          overtimeHours: manualOvertimeHours !== undefined ? manualOvertimeHours : 0,
        };
      case "OVERTIME":
        return {
          workingHours: manualWorkingHours !== undefined ? manualWorkingHours : 8,
          overtimeHours: manualOvertimeHours !== undefined ? manualOvertimeHours : 2,
        };
      case "HALF_DAY":
        return {
          workingHours: manualWorkingHours !== undefined ? manualWorkingHours : 4,
          overtimeHours: 0,
        };
      case "ABSENT":
      case "ON_LEAVE":
      default:
        return { workingHours: 0, overtimeHours: 0 };
    }
  }

  /**
   * Record a single worker's daily attendance
   */
  async recordAttendance(
    projectId: string,
    data: RecordAttendanceInput,
    recordedBy: string
  ): Promise<IAttendance> {
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new AppError("Invalid project ID", 400);
    }
    if (!mongoose.Types.ObjectId.isValid(data.workerId)) {
      throw new AppError("Invalid worker ID", 400);
    }

    const worker = await Worker.findById(data.workerId);
    if (!worker) {
      throw new AppError("Worker not found", 404);
    }

    // Check duplicate attendance constraint (workerId + projectId + date)
    const existing = await Attendance.findOne({
      projectId,
      workerId: data.workerId,
      date: data.date,
    });

    if (existing) {
      throw new AppError(
        `Attendance for worker ${worker.name} on date ${data.date} has already been recorded`,
        409
      );
    }

    const checkInDate = data.checkIn ? new Date(data.checkIn) : null;
    const checkOutDate = data.checkOut ? new Date(data.checkOut) : null;
    const { workingHours, overtimeHours } = this.calculateHoursAndOvertime(
      data.status,
      checkInDate,
      checkOutDate,
      data.workingHours,
      data.overtimeHours
    );

    const attendance = new Attendance({
      projectId: new mongoose.Types.ObjectId(projectId),
      workerId: new mongoose.Types.ObjectId(data.workerId),
      date: data.date,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      workingHours,
      overtimeHours,
      status: data.status,
      notes: data.notes,
      recordedBy: new mongoose.Types.ObjectId(recordedBy),
    });

    await attendance.save();

    return await attendance.populate([
      { path: "workerId", select: "name trade workerType status contact contractorId" },
      { path: "recordedBy", select: "firstName lastName email" },
    ]);
  }

  /**
   * Bulk record daily attendance for multiple workers
   */
  async bulkRecordAttendance(
    projectId: string,
    input: BulkRecordAttendanceInput,
    recordedBy: string
  ): Promise<{ inserted: number; updated: number; records: IAttendance[] }> {
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new AppError("Invalid project ID", 400);
    }

    let inserted = 0;
    let updated = 0;
    const results: IAttendance[] = [];

    for (const item of input.records) {
      if (!mongoose.Types.ObjectId.isValid(item.workerId)) continue;

      const checkInDate = item.checkIn ? new Date(item.checkIn) : null;
      const checkOutDate = item.checkOut ? new Date(item.checkOut) : null;
      const { workingHours, overtimeHours } = this.calculateHoursAndOvertime(
        item.status,
        checkInDate,
        checkOutDate,
        item.workingHours,
        item.overtimeHours
      );

      const existing = await Attendance.findOne({
        projectId,
        workerId: item.workerId,
        date: input.date,
      });

      if (existing) {
        existing.status = item.status;
        existing.checkIn = checkInDate || undefined;
        existing.checkOut = checkOutDate || undefined;
        existing.workingHours = workingHours;
        existing.overtimeHours = overtimeHours;
        if (item.notes !== undefined) existing.notes = item.notes;
        existing.recordedBy = new mongoose.Types.ObjectId(recordedBy);
        await existing.save();
        updated++;
        results.push(existing);
      } else {
        const record = new Attendance({
          projectId: new mongoose.Types.ObjectId(projectId),
          workerId: new mongoose.Types.ObjectId(item.workerId),
          date: input.date,
          checkIn: checkInDate,
          checkOut: checkOutDate,
          workingHours,
          overtimeHours,
          status: item.status,
          notes: item.notes,
          recordedBy: new mongoose.Types.ObjectId(recordedBy),
        });
        await record.save();
        inserted++;
        results.push(record);
      }
    }

    return {
      inserted,
      updated,
      records: results,
    };
  }

  /**
   * Update an existing attendance record
   */
  async updateAttendance(
    projectId: string,
    attendanceId: string,
    data: UpdateAttendanceInput
  ): Promise<IAttendance> {
    if (!mongoose.Types.ObjectId.isValid(attendanceId)) {
      throw new AppError("Invalid attendance ID", 400);
    }

    const attendance = await Attendance.findOne({
      _id: attendanceId,
      projectId,
    });

    if (!attendance) {
      throw new AppError("Attendance record not found", 404);
    }

    if (data.status !== undefined) attendance.status = data.status;
    if (data.checkIn !== undefined) attendance.checkIn = data.checkIn ? new Date(data.checkIn) : undefined;
    if (data.checkOut !== undefined) attendance.checkOut = data.checkOut ? new Date(data.checkOut) : undefined;
    if (data.notes !== undefined) attendance.notes = data.notes;

    const { workingHours, overtimeHours } = this.calculateHoursAndOvertime(
      attendance.status,
      attendance.checkIn,
      attendance.checkOut,
      data.workingHours,
      data.overtimeHours
    );

    attendance.workingHours = workingHours;
    attendance.overtimeHours = overtimeHours;

    await attendance.save();

    return await attendance.populate([
      { path: "workerId", select: "name trade workerType status contact" },
      { path: "recordedBy", select: "firstName lastName email" },
    ]);
  }

  /**
   * Query project attendance records
   */
  async getProjectAttendance(
    projectId: string,
    filters?: {
      date?: string;
      startDate?: string;
      endDate?: string;
      workerId?: string;
      status?: AttendanceStatus;
    }
  ): Promise<IAttendance[]> {
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new AppError("Invalid project ID", 400);
    }

    const query: mongoose.FilterQuery<IAttendance> = {
      projectId: new mongoose.Types.ObjectId(projectId),
    };

    if (filters?.date) {
      query.date = filters.date;
    } else if (filters?.startDate || filters?.endDate) {
      query.date = {};
      if (filters.startDate) query.date.$gte = filters.startDate;
      if (filters.endDate) query.date.$lte = filters.endDate;
    }

    if (filters?.workerId) {
      query.workerId = new mongoose.Types.ObjectId(filters.workerId);
    }
    if (filters?.status) {
      query.status = filters.status;
    }

    return await Attendance.find(query)
      .populate("workerId", "name trade workerType status contact contractorId")
      .populate("recordedBy", "firstName lastName email")
      .sort({ date: -1, createdAt: -1 });
  }

  /**
   * Get project attendance aggregate summary
   */
  async getProjectAttendanceSummary(
    projectId: string,
    filters?: { startDate?: string; endDate?: string }
  ): Promise<AttendanceSummary> {
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new AppError("Invalid project ID", 400);
    }

    const query: mongoose.FilterQuery<IAttendance> = {
      projectId: new mongoose.Types.ObjectId(projectId),
    };

    if (filters?.startDate || filters?.endDate) {
      query.date = {};
      if (filters.startDate) query.date.$gte = filters.startDate;
      if (filters.endDate) query.date.$lte = filters.endDate;
    }

    const records = await Attendance.find(query);

    const summary: AttendanceSummary = {
      totalRecords: records.length,
      presentCount: 0,
      absentCount: 0,
      halfDayCount: 0,
      onLeaveCount: 0,
      overtimeCount: 0,
      totalWorkingHours: 0,
      totalOvertimeHours: 0,
    };

    for (const r of records) {
      if (r.status === "PRESENT") summary.presentCount++;
      else if (r.status === "ABSENT") summary.absentCount++;
      else if (r.status === "HALF_DAY") summary.halfDayCount++;
      else if (r.status === "ON_LEAVE") summary.onLeaveCount++;
      else if (r.status === "OVERTIME") summary.overtimeCount++;

      summary.totalWorkingHours += r.workingHours || 0;
      summary.totalOvertimeHours += r.overtimeHours || 0;
    }

    summary.totalWorkingHours = Math.round(summary.totalWorkingHours * 100) / 100;
    summary.totalOvertimeHours = Math.round(summary.totalOvertimeHours * 100) / 100;

    return summary;
  }
}

export const attendanceService = new AttendanceService();
export default attendanceService;
