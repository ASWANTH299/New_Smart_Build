import { Request, Response, NextFunction } from "express";
import { dailyReportService } from "./dailyReport.service.js";

export class DailyReportController {
  async createReport(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = String(req.params.projectId);
      const userId = (req.user as any)?._id?.toString() || (req.user as any)?.id?.toString() || "";
      const report = await dailyReportService.createReport(
        projectId,
        req.body,
        userId
      );
      res.status(201).json({
        success: true,
        message: "Daily report created successfully",
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  async getReportsByProject(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = String(req.params.projectId);
      const { startDate, endDate, status, page, limit } = req.query;

      const result = await dailyReportService.getReportsByProject(projectId, {
        startDate: startDate as string,
        endDate: endDate as string,
        status: status as any,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });

      res.status(200).json({
        success: true,
        data: result.reports,
        meta: {
          total: result.total,
          page: result.page,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getReportById(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = String(req.params.projectId);
      const reportId = String(req.params.reportId);
      const report = await dailyReportService.getReportById(projectId, reportId);
      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  async reviewReport(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = String(req.params.projectId);
      const reportId = String(req.params.reportId);
      const { status, reviewNotes } = req.body;
      const reviewerId = (req.user as any)?._id?.toString() || (req.user as any)?.id?.toString() || "";
      const report = await dailyReportService.reviewReport(
        projectId,
        reportId,
        reviewerId,
        status,
        reviewNotes
      );
      res.status(200).json({
        success: true,
        message: `Daily report ${status.toLowerCase()} successfully`,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const dailyReportController = new DailyReportController();
