import { Router } from "express";
import procurementController from "./procurement.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { requireRoles } from "../../middleware/authorize.js";
import { requireProjectAccess } from "../../middleware/projectAccess.js";
import { validateRequest } from "../../middleware/validate.js";
import {
  createProcurementRequestSchema,
  reviewProcurementRequestSchema,
  createPurchaseOrderSchema,
  approvePurchaseOrderSchema,
  recordMaterialReceiptSchema,
} from "./procurement.validator.js";

// Router for project-scoped procurement requests (/api/v1/projects/:projectId/procurement-requests)
export const procurementRequestRouter = Router({ mergeParams: true });
procurementRequestRouter.use(authenticate);
procurementRequestRouter.use(requireProjectAccess("projectId"));

procurementRequestRouter.get("/", (req, res, next) =>
  procurementController.getProcurementRequests(req, res, next)
);

procurementRequestRouter.get("/:id", (req, res, next) =>
  procurementController.getProcurementRequestById(req, res, next)
);

procurementRequestRouter.post(
  "/",
  requireRoles("ADMIN", "PROJECT_MANAGER", "STORE_MANAGER", "SITE_ENGINEER"),
  validateRequest(createProcurementRequestSchema),
  (req, res, next) => procurementController.createProcurementRequest(req, res, next)
);

procurementRequestRouter.put(
  "/:id/submit",
  requireRoles("ADMIN", "PROJECT_MANAGER", "STORE_MANAGER", "SITE_ENGINEER"),
  (req, res, next) => procurementController.submitProcurementRequest(req, res, next)
);

procurementRequestRouter.put(
  "/:id/review",
  requireRoles("ADMIN", "PROJECT_MANAGER"),
  validateRequest(reviewProcurementRequestSchema),
  (req, res, next) => procurementController.reviewProcurementRequest(req, res, next)
);

procurementRequestRouter.put(
  "/:id/cancel",
  requireRoles("ADMIN", "PROJECT_MANAGER", "STORE_MANAGER"),
  (req, res, next) => procurementController.cancelProcurementRequest(req, res, next)
);

// Router for project-scoped purchase orders (/api/v1/projects/:projectId/purchase-orders)
export const purchaseOrderRouter = Router({ mergeParams: true });
purchaseOrderRouter.use(authenticate);
purchaseOrderRouter.use(requireProjectAccess("projectId"));

purchaseOrderRouter.get("/", (req, res, next) =>
  procurementController.getPurchaseOrders(req, res, next)
);

purchaseOrderRouter.get("/:id", (req, res, next) =>
  procurementController.getPurchaseOrderById(req, res, next)
);

purchaseOrderRouter.post(
  "/",
  requireRoles("ADMIN", "PROJECT_MANAGER", "STORE_MANAGER"),
  validateRequest(createPurchaseOrderSchema),
  (req, res, next) => procurementController.createPurchaseOrder(req, res, next)
);

purchaseOrderRouter.put(
  "/:id/approve",
  requireRoles("ADMIN", "PROJECT_MANAGER"),
  validateRequest(approvePurchaseOrderSchema),
  (req, res, next) => procurementController.approvePurchaseOrder(req, res, next)
);

purchaseOrderRouter.put(
  "/:id/cancel",
  requireRoles("ADMIN", "PROJECT_MANAGER", "STORE_MANAGER"),
  (req, res, next) => procurementController.cancelPurchaseOrder(req, res, next)
);

// Router for project-scoped receiving (/api/v1/projects/:projectId/receiving)
export const receivingRouter = Router({ mergeParams: true });
receivingRouter.use(authenticate);
receivingRouter.use(requireProjectAccess("projectId"));

receivingRouter.get("/", (req, res, next) =>
  procurementController.getMaterialReceipts(req, res, next)
);

receivingRouter.get("/:id", (req, res, next) =>
  procurementController.getMaterialReceiptById(req, res, next)
);

receivingRouter.post(
  "/",
  requireRoles("ADMIN", "STORE_MANAGER", "PROJECT_MANAGER"),
  validateRequest(recordMaterialReceiptSchema),
  (req, res, next) => procurementController.recordMaterialReceipt(req, res, next)
);

export default {
  procurementRequestRouter,
  purchaseOrderRouter,
  receivingRouter,
};
