import { Router } from "express";
import { reportController } from "./report.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { requireProjectAccess } from "../../middleware/projectAccess.js";

export const reportRouter = Router({ mergeParams: true });

reportRouter.use(authenticate);

// Get real-time project analytics summary
reportRouter.get(
  "/analytics",
  requireProjectAccess("projectId"),
  (req, res, next) => reportController.getProjectAnalytics(req, res, next)
);

// Export project summary report in JSON or CSV
reportRouter.get(
  "/export",
  requireProjectAccess("projectId"),
  (req, res, next) => reportController.exportProjectReport(req, res, next)
);

export default reportRouter;
