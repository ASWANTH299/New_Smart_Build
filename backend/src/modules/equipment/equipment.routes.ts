import { Router } from "express";
import equipmentController from "./equipment.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { requireRoles } from "../../middleware/authorize.js";
import { requireProjectAccess } from "../../middleware/projectAccess.js";
import { validateRequest } from "../../middleware/validate.js";
import {
  createEquipmentSchema,
  updateEquipmentSchema,
  assignEquipmentSchema,
  updateAssignmentSchema,
  reportBreakdownSchema,
  scheduleMaintenanceSchema,
  completeMaintenanceSchema,
  recordInspectionSchema,
} from "./equipment.validator.js";

// Global Equipment Catalog Router (/api/v1/equipment)
export const equipmentRouter = Router();
equipmentRouter.use(authenticate);

equipmentRouter.get("/", (req, res, next) =>
  equipmentController.getEquipmentList(req, res, next)
);

equipmentRouter.post(
  "/",
  requireRoles("ADMIN", "PROJECT_MANAGER"),
  validateRequest(createEquipmentSchema),
  (req, res, next) => equipmentController.createEquipment(req, res, next)
);

equipmentRouter.get("/:equipmentId", (req, res, next) =>
  equipmentController.getEquipmentById(req, res, next)
);

equipmentRouter.put(
  "/:equipmentId",
  requireRoles("ADMIN", "PROJECT_MANAGER"),
  validateRequest(updateEquipmentSchema),
  (req, res, next) => equipmentController.updateEquipment(req, res, next)
);

equipmentRouter.delete(
  "/:equipmentId",
  requireRoles("ADMIN", "PROJECT_MANAGER"),
  (req, res, next) => equipmentController.deleteEquipment(req, res, next)
);

// Equipment breakdown reporting
equipmentRouter.post(
  "/:equipmentId/breakdown",
  requireRoles("ADMIN", "PROJECT_MANAGER", "SITE_ENGINEER"),
  validateRequest(reportBreakdownSchema),
  (req, res, next) => equipmentController.reportBreakdown(req, res, next)
);

// Equipment maintenance
equipmentRouter.post(
  "/:equipmentId/maintenance",
  requireRoles("ADMIN", "PROJECT_MANAGER"),
  validateRequest(scheduleMaintenanceSchema),
  (req, res, next) => equipmentController.scheduleMaintenance(req, res, next)
);

equipmentRouter.put(
  "/:equipmentId/maintenance/:maintenanceId",
  requireRoles("ADMIN", "PROJECT_MANAGER"),
  validateRequest(completeMaintenanceSchema),
  (req, res, next) => equipmentController.completeMaintenance(req, res, next)
);

// Equipment inspection
equipmentRouter.post(
  "/:equipmentId/inspections",
  requireRoles("ADMIN", "PROJECT_MANAGER", "SITE_ENGINEER"),
  validateRequest(recordInspectionSchema),
  (req, res, next) => equipmentController.recordInspection(req, res, next)
);

// Project-Scoped Equipment Router (/api/v1/projects/:projectId/equipment)
export const projectEquipmentRouter = Router({ mergeParams: true });
projectEquipmentRouter.use(authenticate);

projectEquipmentRouter.get(
  "/",
  requireProjectAccess("projectId"),
  (req, res, next) => equipmentController.getProjectEquipment(req, res, next)
);

projectEquipmentRouter.post(
  "/assignments",
  requireProjectAccess("projectId"),
  requireRoles("ADMIN", "PROJECT_MANAGER"),
  validateRequest(assignEquipmentSchema),
  (req, res, next) => equipmentController.assignEquipment(req, res, next)
);

projectEquipmentRouter.put(
  "/assignments/:assignmentId",
  requireProjectAccess("projectId"),
  requireRoles("ADMIN", "PROJECT_MANAGER"),
  validateRequest(updateAssignmentSchema),
  (req, res, next) => equipmentController.updateAssignment(req, res, next)
);

export default equipmentRouter;
