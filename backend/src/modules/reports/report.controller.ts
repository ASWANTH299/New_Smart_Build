import { Request, Response, NextFunction } from "express";
import { reportService } from "./report.service.js";

export class ReportController {
  async getProjectAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = String(req.params.projectId);
      const analytics = await reportService.getProjectAnalytics(projectId);
      res.status(200).json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      next(error);
      return;
    }
  }

  async exportProjectReport(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = String(req.params.projectId);
      const format = (req.query.format as string)?.toLowerCase() === "csv" ? "csv" : "json";

      const result = await reportService.generateProjectSummaryReport(projectId, format);

      if (format === "csv") {
        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="project-report-${projectId}-${new Date().toISOString().slice(0, 10)}.csv"`
        );
        return res.status(200).send(result.csv);
      }

      return res.status(200).json({
        success: true,
        data: result.data,
      });
    } catch (error) {
      next(error);
      return;
    }
  }
}

export const reportController = new ReportController();
