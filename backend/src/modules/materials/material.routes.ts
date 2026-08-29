import { Router } from "express";
import materialController from "./material.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { requireRoles } from "../../middleware/authorize.js";
import { validateRequest } from "../../middleware/validate.js";
import { createMaterialSchema, updateMaterialSchema } from "./material.validator.js";

const router = Router();

router.use(authenticate);

// Get distinct categories
router.get("/categories", (req, res, next) =>
  materialController.getCategories(req, res, next)
);

// List materials
router.get("/", (req, res, next) =>
  materialController.getMaterials(req, res, next)
);

// Get material by ID
router.get("/:id", (req, res, next) =>
  materialController.getMaterialById(req, res, next)
);

// Create material (Admin, Store Manager, PM)
router.post(
  "/",
  requireRoles("ADMIN", "STORE_MANAGER", "PROJECT_MANAGER"),
  validateRequest(createMaterialSchema),
  (req, res, next) => materialController.createMaterial(req, res, next)
);

// Update material (Admin, Store Manager, PM)
router.put(
  "/:id",
  requireRoles("ADMIN", "STORE_MANAGER", "PROJECT_MANAGER"),
  validateRequest(updateMaterialSchema),
  (req, res, next) => materialController.updateMaterial(req, res, next)
);

export default router;
