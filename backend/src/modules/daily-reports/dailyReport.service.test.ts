import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import { dailyReportService } from "./dailyReport.service.js";
import { DailyReport } from "./dailyReport.model.js";

vi.mock("./dailyReport.model.js");

describe("DailyReportService Unit Tests (Phase 13 DPR)", () => {
  const projectId = new mongoose.Types.ObjectId().toString();
  const userId = new mongoose.Types.ObjectId().toString();
  const reviewerId = new mongoose.Types.ObjectId().toString();
  const reportId = new mongoose.Types.ObjectId().toString();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createReport", () => {
    it("should create a daily report with auto-generated reportNumber and SUBMITTED status", async () => {
      vi.spyOn(DailyReport, "countDocuments").mockResolvedValue(0 as any);

      const mockPopulate = vi.fn().mockResolvedValue({
        _id: new mongoose.Types.ObjectId(reportId),
        projectId: new mongoose.Types.ObjectId(projectId),
        reportNumber: "DPR-20260930-001",
        date: new Date("2026-09-30"),
        weatherCondition: "SUNNY",
        workPerformed: "Completed foundation column casting on Grid A-D",
        laborHeadcount: 24,
        equipmentUsed: ["CAT 320 Excavator"],
        materialsConsumed: [{ materialName: "Cement OPC 53", quantity: 50, unit: "bags" }],
        photos: ["https://example.com/photos/site1.jpg"],
        status: "SUBMITTED",
        submittedBy: { _id: userId, name: "Site Engineer", email: "engineer@smartbuild.com" },
      });

      const mockSave = vi.fn().mockResolvedValue(true);

      (DailyReport as unknown as vi.Mock).mockImplementation((data: any) => ({
        ...data,
        save: mockSave,
        populate: mockPopulate,
      }));

      const result = await dailyReportService.createReport(
        projectId,
        {
          date: "2026-09-30",
          weatherCondition: "SUNNY",
          workPerformed: "Completed foundation column casting on Grid A-D",
          laborHeadcount: 24,
          equipmentUsed: ["CAT 320 Excavator"],
          materialsConsumed: [{ materialName: "Cement OPC 53", quantity: 50, unit: "bags" }],
          photos: ["https://example.com/photos/site1.jpg"],
        },
        userId
      );

      expect(mockSave).toHaveBeenCalled();
      expect(result.status).toBe("SUBMITTED");
      expect(result.laborHeadcount).toBe(24);
      expect(result.weatherCondition).toBe("SUNNY");
    });
  });

  describe("getReportsByProject", () => {
    it("should fetch paginated daily reports for a project", async () => {
      const mockReports = [
        {
          _id: new mongoose.Types.ObjectId(reportId),
          reportNumber: "DPR-20260930-001",
          status: "SUBMITTED",
          workPerformed: "Excavation work",
        },
      ];

      const mockQuery = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        populate: vi.fn().mockImplementation(function (this: any) {
          return this;
        }),
      };
      // Final populate returns mockReports
      mockQuery.populate = vi.fn().mockReturnValueOnce(mockQuery).mockResolvedValueOnce(mockReports as any);

      vi.spyOn(DailyReport, "find").mockReturnValue(mockQuery as any);
      vi.spyOn(DailyReport, "countDocuments").mockResolvedValue(1 as any);

      const result = await dailyReportService.getReportsByProject(projectId, {
        page: 1,
        limit: 10,
        status: "SUBMITTED",
      });

      expect(result.reports).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });
  });

  describe("getReportById", () => {
    it("should return report when found", async () => {
      const mockReport = {
        _id: new mongoose.Types.ObjectId(reportId),
        reportNumber: "DPR-20260930-001",
        workPerformed: "Concrete curing",
      };

      const mockQuery = {
        populate: vi.fn().mockImplementation(function (this: any) {
          return this;
        }),
      };
      mockQuery.populate = vi.fn().mockReturnValueOnce(mockQuery).mockResolvedValueOnce(mockReport as any);

      vi.spyOn(DailyReport, "findOne").mockReturnValue(mockQuery as any);

      const result = await dailyReportService.getReportById(projectId, reportId);
      expect(result.reportNumber).toBe("DPR-20260930-001");
    });

    it("should throw 404 when report not found", async () => {
      const mockQuery = {
        populate: vi.fn().mockImplementation(function (this: any) {
          return this;
        }),
      };
      mockQuery.populate = vi.fn().mockReturnValueOnce(mockQuery).mockResolvedValueOnce(null as any);

      vi.spyOn(DailyReport, "findOne").mockReturnValue(mockQuery as any);

      await expect(
        dailyReportService.getReportById(projectId, reportId)
      ).rejects.toThrow("Daily report not found");
    });
  });

  describe("reviewReport", () => {
    it("should approve a daily report and update status, reviewer, and notes", async () => {
      const mockPopulate = vi.fn().mockResolvedValue({
        _id: new mongoose.Types.ObjectId(reportId),
        status: "APPROVED",
        reviewedBy: { _id: reviewerId, name: "Project Manager" },
        reviewNotes: "All checks verified and aligned with weekly progress schedule.",
      });

      const mockReportDoc: any = {
        _id: new mongoose.Types.ObjectId(reportId),
        status: "SUBMITTED",
        save: vi.fn().mockResolvedValue(true),
        populate: mockPopulate,
      };

      vi.spyOn(DailyReport, "findOne").mockResolvedValue(mockReportDoc);

      const result = await dailyReportService.reviewReport(
        projectId,
        reportId,
        reviewerId,
        "APPROVED",
        "All checks verified and aligned with weekly progress schedule."
      );

      expect(mockReportDoc.status).toBe("APPROVED");
      expect(mockReportDoc.reviewNotes).toBe("All checks verified and aligned with weekly progress schedule.");
      expect(mockReportDoc.save).toHaveBeenCalled();
      expect(result.status).toBe("APPROVED");
    });
  });
});
