import { Router } from "express";
import projectController from "./project.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { requireRoles } from "../../middleware/authorize.js";
import { requireProjectAccess } from "../../middleware/projectAccess.js";
import { validateRequest } from "../../middleware/validate.js";
import {
  createProjectSchema,
  updateProjectSchema,
  updateProjectStatusSchema,
} from "./project.validator.js";

const router = Router();

router.use(authenticate);

// List projects (filtered by membership for non-admin)
router.get("/", (req, res, next) => projectController.getProjects(req, res, next));

// Create project (Admin or PM)
router.post(
  "/",
  requireRoles("ADMIN", "PROJECT_MANAGER"),
  validateRequest(createProjectSchema),
  (req, res, next) => projectController.createProject(req, res, next)
);

// Project-scoped routes (with membership check)
router.get("/:projectId", requireProjectAccess("projectId"), (req, res, next) =>
  projectController.getProjectById(req, res, next)
);

router.put(
  "/:projectId",
  requireProjectAccess("projectId"),
  requireRoles("ADMIN", "PROJECT_MANAGER"),
  validateRequest(updateProjectSchema),
  (req, res, next) => projectController.updateProject(req, res, next)
);

router.put(
  "/:projectId/status",
  requireProjectAccess("projectId"),
  requireRoles("ADMIN", "PROJECT_MANAGER"),
  validateRequest(updateProjectStatusSchema),
  (req, res, next) => projectController.updateProjectStatus(req, res, next)
);

router.get(
  "/:projectId/overview",
  requireProjectAccess("projectId"),
  (req, res, next) => projectController.getProjectOverview(req, res, next)
);

router.get(
  "/:projectId/team",
  requireProjectAccess("projectId"),
  (req, res, next) => projectController.getProjectTeam(req, res, next)
);

export default router;
