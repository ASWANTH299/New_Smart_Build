import { Router } from "express";
import vendorController from "./vendor.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { requireRoles } from "../../middleware/authorize.js";
import { validateRequest } from "../../middleware/validate.js";
import {
  createVendorSchema,
  updateVendorSchema,
  getVendorsQuerySchema,
} from "./vendor.validator.js";

const router = Router();

router.use(authenticate);

// List vendors (All authenticated users can browse vendors)
router.get(
  "/",
  validateRequest(getVendorsQuerySchema),
  (req, res, next) => vendorController.getVendors(req, res, next)
);

// Get vendor by ID
router.get("/:id", (req, res, next) => vendorController.getVendorById(req, res, next));

// Create vendor (Admin or Store Manager or PM)
router.post(
  "/",
  requireRoles("ADMIN", "STORE_MANAGER", "PROJECT_MANAGER"),
  validateRequest(createVendorSchema),
  (req, res, next) => vendorController.createVendor(req, res, next)
);

// Update vendor
router.put(
  "/:id",
  requireRoles("ADMIN", "STORE_MANAGER", "PROJECT_MANAGER"),
  validateRequest(updateVendorSchema),
  (req, res, next) => vendorController.updateVendor(req, res, next)
);

export default router;
