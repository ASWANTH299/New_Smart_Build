import { Router } from "express";
import materialRequestController from "./materialRequest.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { requireRoles } from "../../middleware/authorize.js";
import { requireProjectAccess } from "../../middleware/projectAccess.js";
import { validateRequest } from "../../middleware/validate.js";
import {
  createMaterialRequestSchema,
  reviewMaterialRequestSchema,
  issueMaterialRequestSchema,
} from "./materialRequest.validator.js";

const router = Router({ mergeParams: true });

router.use(authenticate);

// List material requests for project
router.get(
  "/",
  requireProjectAccess("projectId"),
  (req, res, next) => materialRequestController.getMaterialRequests(req, res, next)
);

// Get single request detail
router.get(
  "/:id",
  requireProjectAccess("projectId"),
  (req, res, next) => materialRequestController.getMaterialRequestById(req, res, next)
);

// Create request (Admin, PM, Site Engineer)
router.post(
  "/",
  requireProjectAccess("projectId"),
  requireRoles("ADMIN", "PROJECT_MANAGER", "SITE_ENGINEER"),
  validateRequest(createMaterialRequestSchema),
  (req, res, next) => materialRequestController.createMaterialRequest(req, res, next)
);

// Submit draft request
router.put(
  "/:id/submit",
  requireProjectAccess("projectId"),
  requireRoles("ADMIN", "PROJECT_MANAGER", "SITE_ENGINEER"),
  (req, res, next) => materialRequestController.submitMaterialRequest(req, res, next)
);

// Review request (Approve / Reject) (Admin, PM)
router.put(
  "/:id/review",
  requireProjectAccess("projectId"),
  requireRoles("ADMIN", "PROJECT_MANAGER"),
  validateRequest(reviewMaterialRequestSchema),
  (req, res, next) => materialRequestController.reviewMaterialRequest(req, res, next)
);

// Convenience alias: PUT /:id/approve
router.put(
  "/:id/approve",
  requireProjectAccess("projectId"),
  requireRoles("ADMIN", "PROJECT_MANAGER"),
  (req, res, next) => {
    req.body = { decision: "APPROVE", ...req.body };
    materialRequestController.reviewMaterialRequest(req, res, next);
  }
);

// Convenience alias: PUT /:id/reject
router.put(
  "/:id/reject",
  requireProjectAccess("projectId"),
  requireRoles("ADMIN", "PROJECT_MANAGER"),
  (req, res, next) => {
    req.body = { decision: "REJECT", ...req.body };
    materialRequestController.reviewMaterialRequest(req, res, next);
  }
);

// Issue materials against request (Admin, Store Manager, PM)
router.post(
  "/:id/issue",
  requireRoles("ADMIN", "STORE_MANAGER", "PROJECT_MANAGER"),
  validateRequest(issueMaterialRequestSchema),
  (req, res, next) => materialRequestController.issueMaterialRequest(req, res, next)
);

// Cancel request
router.put(
  "/:id/cancel",
  requireProjectAccess("projectId"),
  requireRoles("ADMIN", "PROJECT_MANAGER", "SITE_ENGINEER"),
  (req, res, next) => materialRequestController.cancelMaterialRequest(req, res, next)
);

export default router;
