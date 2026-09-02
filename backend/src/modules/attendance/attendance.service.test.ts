import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import { attendanceService } from "./attendance.service.js";
import { Attendance } from "./attendance.model.js";
import { Worker } from "../workforce/worker.model.js";

vi.mock("./attendance.model.js");
vi.mock("../workforce/worker.model.js");

describe("AttendanceService Unit Tests (Phase 10)", () => {
  const projectId = new mongoose.Types.ObjectId().toString();
  const workerId = new mongoose.Types.ObjectId().toString();
  const actorId = new mongoose.Types.ObjectId().toString();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("calculateHoursAndOvertime", () => {
    it("should calculate 8 working hours and 2 overtime hours for a 10-hour shift", () => {
      const checkIn = new Date("2026-09-02T08:00:00Z");
      const checkOut = new Date("2026-09-02T18:00:00Z");

      const result = attendanceService.calculateHoursAndOvertime("PRESENT", checkIn, checkOut);
      expect(result.workingHours).toBe(8);
      expect(result.overtimeHours).toBe(2);
    });

    it("should calculate 6 working hours and 0 overtime hours for a 6-hour shift", () => {
      const checkIn = new Date("2026-09-02T08:00:00Z");
      const checkOut = new Date("2026-09-02T14:00:00Z");

      const result = attendanceService.calculateHoursAndOvertime("PRESENT", checkIn, checkOut);
      expect(result.workingHours).toBe(6);
      expect(result.overtimeHours).toBe(0);
    });

    it("should default to 8 working hours and 0 overtime for PRESENT without timestamps", () => {
      const result = attendanceService.calculateHoursAndOvertime("PRESENT");
      expect(result.workingHours).toBe(8);
      expect(result.overtimeHours).toBe(0);
    });

    it("should default to 4 working hours and 0 overtime for HALF_DAY", () => {
      const result = attendanceService.calculateHoursAndOvertime("HALF_DAY");
      expect(result.workingHours).toBe(4);
      expect(result.overtimeHours).toBe(0);
    });

    it("should default to 0 working hours for ABSENT or ON_LEAVE", () => {
      const resultAbsent = attendanceService.calculateHoursAndOvertime("ABSENT");
      expect(resultAbsent.workingHours).toBe(0);
      expect(resultAbsent.overtimeHours).toBe(0);

      const resultLeave = attendanceService.calculateHoursAndOvertime("ON_LEAVE");
      expect(resultLeave.workingHours).toBe(0);
      expect(resultLeave.overtimeHours).toBe(0);
    });
  });

  describe("recordAttendance", () => {
    it("should record attendance successfully", async () => {
      vi.spyOn(Worker, "findById").mockResolvedValue({
        _id: new mongoose.Types.ObjectId(workerId),
        name: "Suresh Mason",
      } as any);

      vi.spyOn(Attendance, "findOne").mockResolvedValue(null);

      const mockPopulate = vi.fn().mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        projectId,
        workerId: { name: "Suresh Mason" },
        date: "2026-09-02",
        status: "PRESENT",
        workingHours: 8,
        overtimeHours: 0,
      });

      const mockSave = vi.fn().mockResolvedValue(true);
      (Attendance as unknown as vi.Mock).mockImplementation((data: any) => ({
        ...data,
        save: mockSave,
        populate: mockPopulate,
      }));

      const result = await attendanceService.recordAttendance(
        projectId,
        {
          workerId,
          date: "2026-09-02",
          status: "PRESENT",
        },
        actorId
      );

      expect(result.workingHours).toBe(8);
      expect(mockSave).toHaveBeenCalled();
    });

    it("should prevent duplicate attendance on same worker, project, and date", async () => {
      vi.spyOn(Worker, "findById").mockResolvedValue({
        _id: new mongoose.Types.ObjectId(workerId),
        name: "Suresh Mason",
      } as any);

      vi.spyOn(Attendance, "findOne").mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        date: "2026-09-02",
      } as any);

      await expect(
        attendanceService.recordAttendance(
          projectId,
          {
            workerId,
            date: "2026-09-02",
            status: "PRESENT",
          },
          actorId
        )
      ).rejects.toThrow("already been recorded");
    });
  });
});
