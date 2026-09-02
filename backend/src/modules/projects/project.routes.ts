import { Router } from "express";
import projectController from "./project.controller.js";
import phaseRoutes from "../phases/phase.routes.js";
import taskRoutes from "../tasks/task.routes.js";
import milestoneRoutes from "../milestones/milestone.routes.js";
import progressRoutes from "../progress/progress.routes.js";
import bomRoutes from "../bom/bom.routes.js";
import materialRequestRoutes from "../material-requests/materialRequest.routes.js";
import {
  procurementRequestRouter,
  purchaseOrderRouter,
  receivingRouter,
} from "../procurement/procurement.routes.js";
import { projectWorkforceRouter } from "../workforce/workforce.routes.js";
import { attendanceRouter } from "../attendance/attendance.routes.js";
import { projectEquipmentRouter } from "../equipment/equipment.routes.js";
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

// Nested resource routes with project isolation
router.use("/:projectId/phases", phaseRoutes);
router.use("/:projectId/tasks", taskRoutes);
router.use("/:projectId/milestones", milestoneRoutes);
router.use("/:projectId/progress", progressRoutes);
router.use("/:projectId/bom", bomRoutes);
router.use("/:projectId/material-requests", materialRequestRoutes);
router.use("/:projectId/procurement-requests", procurementRequestRouter);
router.use("/:projectId/purchase-orders", purchaseOrderRouter);
router.use("/:projectId/receiving", receivingRouter);
router.use("/:projectId/workforce", projectWorkforceRouter);
router.use("/:projectId/attendance", attendanceRouter);
router.use("/:projectId/equipment", projectEquipmentRouter);

// Project-scoped direct routes (with membership check)
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

router.post(
  "/:projectId/team",
  requireProjectAccess("projectId"),
  requireRoles("ADMIN", "PROJECT_MANAGER"),
  (req, res, next) => projectController.addTeamMember(req, res, next)
);

router.delete(
  "/:projectId/team/:userId",
  requireProjectAccess("projectId"),
  requireRoles("ADMIN", "PROJECT_MANAGER"),
  (req, res, next) => projectController.removeTeamMember(req, res, next)
);

router.get(
  "/:projectId/health",
  requireProjectAccess("projectId"),
  (req, res, next) => projectController.getProjectHealth(req, res, next)
);

export default router;
