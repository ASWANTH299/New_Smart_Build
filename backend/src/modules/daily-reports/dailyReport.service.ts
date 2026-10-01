import mongoose from "mongoose";
import {
  DailyReport,
  IDailyReport,
  WeatherCondition,
  DailyReportStatus,
  IMaterialConsumed,
} from "./dailyReport.model.js";
import { AppError } from "../../utils/AppError.js";

export interface CreateDailyReportInput {
  date?: string | Date;
  reportDate?: string | Date;
  reportNumber?: string;
  weatherCondition?: WeatherCondition;
  workPerformed: string;
  laborHeadcount?: number;
  equipmentUsed?: string[];
  materialsConsumed?: IMaterialConsumed[];
  photos?: string[];
  notes?: string;
  issues?: string[];
}

export interface DailyReportFilterOptions {
  startDate?: string;
  endDate?: string;
  status?: DailyReportStatus;
  page?: number;
  limit?: number;
}

export class DailyReportService {
  async createReport(
    projectId: string,
    data: CreateDailyReportInput,
    userId: string
  ): Promise<IDailyReport> {
    const reportDate = data.date ? new Date(data.date) : data.reportDate ? new Date(data.reportDate) : new Date();

    // Generate unique reportNumber if not provided
    let reportNumber = data.reportNumber;
    if (!reportNumber) {
      const datePart = reportDate.toISOString().slice(0, 10).replace(/-/g, "");
      const count = await DailyReport.countDocuments({ projectId });
      reportNumber = `DPR-${datePart}-${String(count + 1).padStart(3, "0")}`;
    }

    const report = new DailyReport({
      projectId: new mongoose.Types.ObjectId(projectId),
      reportNumber,
      date: reportDate,
      reportDate,
      weatherCondition: data.weatherCondition || "SUNNY",
      workPerformed: data.workPerformed,
      laborHeadcount: data.laborHeadcount ?? 0,
      equipmentUsed: data.equipmentUsed || [],
      materialsConsumed: data.materialsConsumed || [],
      photos: data.photos || [],
      notes: data.notes || "",
      issues: data.issues || [],
      status: "SUBMITTED",
      submittedBy: new mongoose.Types.ObjectId(userId),
    });

    await report.save();
    return await report.populate([
      { path: "submittedBy", select: "name email role primaryRole" },
      { path: "reviewedBy", select: "name email role primaryRole" },
    ]);
  }

  async getReportsByProject(
    projectId: string,
    options: DailyReportFilterOptions = {}
  ): Promise<{ reports: IDailyReport[]; total: number; page: number; totalPages: number }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, Math.min(100, options.limit || 20));
    const skip = (page - 1) * limit;

    const query: any = { projectId: new mongoose.Types.ObjectId(projectId) };

    if (options.status) {
      query.status = options.status;
    }

    if (options.startDate || options.endDate) {
      query.date = {};
      if (options.startDate) {
        query.date.$gte = new Date(options.startDate);
      }
      if (options.endDate) {
        const end = new Date(options.endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const [reports, total] = await Promise.all([
      DailyReport.find(query)
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("submittedBy", "name email role primaryRole")
        .populate("reviewedBy", "name email role primaryRole"),
      DailyReport.countDocuments(query),
    ]);

    return {
      reports,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getReportById(projectId: string, reportId: string): Promise<IDailyReport> {
    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      throw new AppError("Invalid report ID", 400);
    }

    const report = await DailyReport.findOne({
      _id: new mongoose.Types.ObjectId(reportId),
      projectId: new mongoose.Types.ObjectId(projectId),
    })
      .populate("submittedBy", "name email role primaryRole")
      .populate("reviewedBy", "name email role primaryRole");

    if (!report) {
      throw new AppError("Daily report not found", 404);
    }

    return report;
  }

  async reviewReport(
    projectId: string,
    reportId: string,
    reviewerId: string,
    status: "REVIEWED" | "APPROVED",
    reviewNotes?: string
  ): Promise<IDailyReport> {
    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      throw new AppError("Invalid report ID", 400);
    }

    const report = await DailyReport.findOne({
      _id: new mongoose.Types.ObjectId(reportId),
      projectId: new mongoose.Types.ObjectId(projectId),
    });

    if (!report) {
      throw new AppError("Daily report not found", 404);
    }

    report.status = status;
    report.reviewedBy = new mongoose.Types.ObjectId(reviewerId);
    report.reviewedAt = new Date();
    if (reviewNotes !== undefined) {
      report.reviewNotes = reviewNotes;
    }

    await report.save();
    return await report.populate([
      { path: "submittedBy", select: "name email role primaryRole" },
      { path: "reviewedBy", select: "name email role primaryRole" },
    ]);
  }
}

export const dailyReportService = new DailyReportService();
