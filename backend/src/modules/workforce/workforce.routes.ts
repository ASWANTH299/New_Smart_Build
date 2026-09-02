import { Router } from "express";
import workforceController from "./workforce.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { requireRoles } from "../../middleware/authorize.js";
import { requireProjectAccess } from "../../middleware/projectAccess.js";
import { validateRequest } from "../../middleware/validate.js";
import {
  createWorkerSchema,
  updateWorkerSchema,
  assignWorkerSchema,
  updateAssignmentSchema,
} from "./workforce.validator.js";

// Global workforce catalog router (/api/v1/workforce)
export const workforceRouter = Router();
workforceRouter.use(authenticate);

workforceRouter.get("/", (req, res, next) => workforceController.getWorkers(req, res, next));

workforceRouter.post(
  "/",
  requireRoles("ADMIN", "PROJECT_MANAGER"),
  validateRequest(createWorkerSchema),
  (req, res, next) => workforceController.createWorker(req, res, next)
);

workforceRouter.get("/:workerId", (req, res, next) =>
  workforceController.getWorkerById(req, res, next)
);

workforceRouter.put(
  "/:workerId",
  requireRoles("ADMIN", "PROJECT_MANAGER"),
  validateRequest(updateWorkerSchema),
  (req, res, next) => workforceController.updateWorker(req, res, next)
);

workforceRouter.delete(
  "/:workerId",
  requireRoles("ADMIN", "PROJECT_MANAGER"),
  (req, res, next) => workforceController.deleteWorker(req, res, next)
);

// Project-scoped workforce router (/api/v1/projects/:projectId/workforce)
export const projectWorkforceRouter = Router({ mergeParams: true });
projectWorkforceRouter.use(authenticate);

projectWorkforceRouter.get(
  "/",
  requireProjectAccess("projectId"),
  (req, res, next) => workforceController.getProjectWorkforce(req, res, next)
);

projectWorkforceRouter.post(
  "/",
  requireProjectAccess("projectId"),
  requireRoles("ADMIN", "PROJECT_MANAGER"),
  validateRequest(assignWorkerSchema),
  (req, res, next) => workforceController.assignWorker(req, res, next)
);

projectWorkforceRouter.put(
  "/:assignmentId",
  requireProjectAccess("projectId"),
  requireRoles("ADMIN", "PROJECT_MANAGER"),
  validateRequest(updateAssignmentSchema),
  (req, res, next) => workforceController.updateAssignment(req, res, next)
);

projectWorkforceRouter.delete(
  "/:assignmentId",
  requireProjectAccess("projectId"),
  requireRoles("ADMIN", "PROJECT_MANAGER"),
  (req, res, next) => workforceController.deleteAssignment(req, res, next)
);

export default workforceRouter;
