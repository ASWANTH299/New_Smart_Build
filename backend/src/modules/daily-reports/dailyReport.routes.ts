import { Router } from "express";
import { dailyReportController } from "./dailyReport.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { requireRoles } from "../../middleware/authorize.js";
import { requireProjectAccess } from "../../middleware/projectAccess.js";
import { validateRequest } from "../../middleware/validate.js";
import {
  createDailyReportSchema,
  reviewDailyReportSchema,
} from "./dailyReport.validator.js";

export const dailyReportRouter = Router({ mergeParams: true });

dailyReportRouter.use(authenticate);

// Get list of daily reports for project
dailyReportRouter.get(
  "/",
  requireProjectAccess("projectId"),
  (req, res, next) => dailyReportController.getReportsByProject(req, res, next)
);

// Create daily report (Site Engineer, PM, Admin)
dailyReportRouter.post(
  "/",
  requireProjectAccess("projectId"),
  requireRoles("ADMIN", "PROJECT_MANAGER", "SITE_ENGINEER"),
  validateRequest(createDailyReportSchema),
  (req, res, next) => dailyReportController.createReport(req, res, next)
);

// Get single daily report details
dailyReportRouter.get(
  "/:reportId",
  requireProjectAccess("projectId"),
  (req, res, next) => dailyReportController.getReportById(req, res, next)
);

// PM / Admin review or approve report
dailyReportRouter.patch(
  "/:reportId/review",
  requireProjectAccess("projectId"),
  requireRoles("ADMIN", "PROJECT_MANAGER"),
  validateRequest(reviewDailyReportSchema),
  (req, res, next) => dailyReportController.reviewReport(req, res, next)
);

dailyReportRouter.patch(
  "/:reportId/approve",
  requireProjectAccess("projectId"),
  requireRoles("ADMIN", "PROJECT_MANAGER"),
  (req, res, next) => {
    req.body = { ...req.body, status: "APPROVED" };
    return dailyReportController.reviewReport(req, res, next);
  }
);

export default dailyReportRouter;
