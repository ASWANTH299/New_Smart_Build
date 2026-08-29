import { Router } from "express";
import bomController from "./bom.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { requireRoles } from "../../middleware/authorize.js";
import { requireProjectAccess } from "../../middleware/projectAccess.js";
import { validateRequest } from "../../middleware/validate.js";
import {
  createBOMSchema,
  addBOMItemSchema,
  updateBOMItemSchema,
  approveBOMSchema,
} from "./bom.validator.js";

const router = Router({ mergeParams: true });

router.use(authenticate);

// Get project BOMs
router.get(
  "/",
  requireProjectAccess("projectId"),
  (req, res, next) => bomController.getBOMsByProject(req, res, next)
);

// Get single BOM with items
router.get(
  "/:bomId",
  requireProjectAccess("projectId"),
  (req, res, next) => bomController.getBOMById(req, res, next)
);

// Create new BOM version (Admin, PM)
router.post(
  "/",
  requireProjectAccess("projectId"),
  requireRoles("ADMIN", "PROJECT_MANAGER"),
  validateRequest(createBOMSchema),
  (req, res, next) => bomController.createBOM(req, res, next)
);

// Add item to BOM
router.post(
  "/:bomId/items",
  requireProjectAccess("projectId"),
  requireRoles("ADMIN", "PROJECT_MANAGER"),
  validateRequest(addBOMItemSchema),
  (req, res, next) => bomController.addBOMItem(req, res, next)
);

// Update BOM item
router.put(
  "/:bomId/items/:itemId",
  requireProjectAccess("projectId"),
  requireRoles("ADMIN", "PROJECT_MANAGER"),
  validateRequest(updateBOMItemSchema),
  (req, res, next) => bomController.updateBOMItem(req, res, next)
);

// Delete BOM item
router.delete(
  "/:bomId/items/:itemId",
  requireProjectAccess("projectId"),
  requireRoles("ADMIN", "PROJECT_MANAGER"),
  (req, res, next) => bomController.deleteBOMItem(req, res, next)
);

// Approve BOM (Admin, PM)
router.post(
  "/:bomId/approve",
  requireProjectAccess("projectId"),
  requireRoles("ADMIN", "PROJECT_MANAGER"),
  validateRequest(approveBOMSchema),
  (req, res, next) => bomController.approveBOM(req, res, next)
);

export default router;
