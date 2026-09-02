import { Router } from "express";
import attendanceController from "./attendance.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { requireRoles } from "../../middleware/authorize.js";
import { requireProjectAccess } from "../../middleware/projectAccess.js";
import { validateRequest } from "../../middleware/validate.js";
import {
  recordAttendanceSchema,
  bulkRecordAttendanceSchema,
  updateAttendanceSchema,
} from "./attendance.validator.js";

// Project-scoped attendance router (/api/v1/projects/:projectId/attendance)
export const attendanceRouter = Router({ mergeParams: true });
attendanceRouter.use(authenticate);

attendanceRouter.get(
  "/",
  requireProjectAccess("projectId"),
  (req, res, next) => attendanceController.getProjectAttendance(req, res, next)
);

attendanceRouter.get(
  "/summary",
  requireProjectAccess("projectId"),
  (req, res, next) => attendanceController.getProjectAttendanceSummary(req, res, next)
);

attendanceRouter.post(
  "/",
  requireProjectAccess("projectId"),
  requireRoles("ADMIN", "PROJECT_MANAGER", "SITE_ENGINEER"),
  validateRequest(recordAttendanceSchema),
  (req, res, next) => attendanceController.recordAttendance(req, res, next)
);

attendanceRouter.post(
  "/bulk",
  requireProjectAccess("projectId"),
  requireRoles("ADMIN", "PROJECT_MANAGER", "SITE_ENGINEER"),
  validateRequest(bulkRecordAttendanceSchema),
  (req, res, next) => attendanceController.bulkRecordAttendance(req, res, next)
);

attendanceRouter.put(
  "/:attendanceId",
  requireProjectAccess("projectId"),
  requireRoles("ADMIN", "PROJECT_MANAGER", "SITE_ENGINEER"),
  validateRequest(updateAttendanceSchema),
  (req, res, next) => attendanceController.updateAttendance(req, res, next)
);

export default attendanceRouter;
