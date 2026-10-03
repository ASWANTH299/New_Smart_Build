import { Request, Response, NextFunction } from "express";
import { attendanceService } from "./attendance.service.js";
import { AuthenticatedRequest } from "../../middleware/authenticate.js";

export class AttendanceController {
  async recordAttendance(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const projectId = String(req.params.projectId);
      const attendance = await attendanceService.recordAttendance(
        projectId,
        req.body,
        (req.user as any)?._id?.toString() || (req.user as any)?.id?.toString() || ""
      );

      res.status(201).json({
        success: true,
        message: "Attendance recorded successfully",
        data: attendance,
      });
    } catch (error) {
      next(error);
    }
  }

  async bulkRecordAttendance(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const projectId = String(req.params.projectId);
      const result = await attendanceService.bulkRecordAttendance(
        projectId,
        req.body,
        (req.user as any)?._id?.toString() || (req.user as any)?.id?.toString() || ""
      );

      res.status(200).json({
        success: true,
        message: `Attendance processed (${result.inserted} recorded, ${result.updated} updated)`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateAttendance(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const projectId = String(req.params.projectId);
      const attendanceId = String(req.params.attendanceId);
      const attendance = await attendanceService.updateAttendance(
        projectId,
        attendanceId,
        req.body
      );

      res.status(200).json({
        success: true,
        message: "Attendance record updated successfully",
        data: attendance,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProjectAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = String(req.params.projectId);
      const { date, startDate, endDate, workerId, status } = req.query;

      const records = await attendanceService.getProjectAttendance(projectId, {
        date: date as string,
        startDate: startDate as string,
        endDate: endDate as string,
        workerId: workerId as string,
        status: status as any,
      });

      res.status(200).json({
        success: true,
        data: records,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProjectAttendanceSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = String(req.params.projectId);
      const { startDate, endDate } = req.query;

      const summary = await attendanceService.getProjectAttendanceSummary(projectId, {
        startDate: startDate as string,
        endDate: endDate as string,
      });

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const attendanceController = new AttendanceController();
export default attendanceController;
