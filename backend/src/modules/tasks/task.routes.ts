import { Router } from "express";
import taskController from "./task.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { requireRoles } from "../../middleware/authorize.js";
import { requireProjectAccess } from "../../middleware/projectAccess.js";
import { validateRequest } from "../../middleware/validate.js";
import {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  logProgressSchema,
} from "./task.validator.js";

const router = Router({ mergeParams: true });

router.use(authenticate);
router.use(requireProjectAccess("projectId"));

router.get("/", (req, res, next) => taskController.getTasks(req, res, next));

router.post(
  "/",
  requireRoles("ADMIN", "PROJECT_MANAGER", "SITE_ENGINEER"),
  validateRequest(createTaskSchema),
  (req, res, next) => taskController.createTask(req, res, next)
);

router.get("/:taskId", (req, res, next) =>
  taskController.getTaskById(req, res, next)
);

router.put(
  "/:taskId",
  requireRoles("ADMIN", "PROJECT_MANAGER", "SITE_ENGINEER"),
  validateRequest(updateTaskSchema),
  (req, res, next) => taskController.updateTask(req, res, next)
);

router.put(
  "/:taskId/status",
  requireRoles("ADMIN", "PROJECT_MANAGER", "SITE_ENGINEER", "CONTRACTOR"),
  validateRequest(updateTaskStatusSchema),
  (req, res, next) => taskController.updateTaskStatus(req, res, next)
);

router.put(
  "/:taskId/progress",
  requireRoles("ADMIN", "PROJECT_MANAGER", "SITE_ENGINEER", "CONTRACTOR"),
  validateRequest(logProgressSchema),
  (req, res, next) => taskController.logProgress(req, res, next)
);

router.delete(
  "/:taskId",
  requireRoles("ADMIN", "PROJECT_MANAGER"),
  (req, res, next) => taskController.deleteTask(req, res, next)
);

export default router;
