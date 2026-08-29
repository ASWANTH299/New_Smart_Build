import { Router } from "express";
import inventoryController from "./inventory.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { requireRoles } from "../../middleware/authorize.js";
import { validateRequest } from "../../middleware/validate.js";
import {
  createLocationSchema,
  receiveMaterialsSchema,
  transferMaterialsSchema,
  adjustStockSchema,
  returnMaterialsSchema,
  consumeMaterialsSchema,
} from "./inventory.validator.js";

const router = Router();

router.use(authenticate);

// Locations
router.get("/locations", (req, res, next) =>
  inventoryController.getLocations(req, res, next)
);
router.get("/locations/:id", (req, res, next) =>
  inventoryController.getLocationById(req, res, next)
);
router.post(
  "/locations",
  requireRoles("ADMIN", "STORE_MANAGER"),
  validateRequest(createLocationSchema),
  (req, res, next) => inventoryController.createLocation(req, res, next)
);

// Balances and Alerts
router.get("/balances", (req, res, next) =>
  inventoryController.getBalances(req, res, next)
);
router.get("/alerts", (req, res, next) =>
  inventoryController.getStockAlerts(req, res, next)
);

// Transactions History
router.get("/transactions", (req, res, next) =>
  inventoryController.getTransactions(req, res, next)
);

// Inventory Operations
router.post(
  "/receive",
  requireRoles("ADMIN", "STORE_MANAGER", "PROJECT_MANAGER"),
  validateRequest(receiveMaterialsSchema),
  (req, res, next) => inventoryController.receiveMaterials(req, res, next)
);

router.post(
  "/transfer",
  requireRoles("ADMIN", "STORE_MANAGER", "PROJECT_MANAGER"),
  validateRequest(transferMaterialsSchema),
  (req, res, next) => inventoryController.transferMaterials(req, res, next)
);

router.post(
  "/adjust",
  requireRoles("ADMIN", "STORE_MANAGER"),
  validateRequest(adjustStockSchema),
  (req, res, next) => inventoryController.adjustStock(req, res, next)
);

router.post(
  "/return",
  requireRoles("ADMIN", "STORE_MANAGER", "PROJECT_MANAGER"),
  validateRequest(returnMaterialsSchema),
  (req, res, next) => inventoryController.returnMaterials(req, res, next)
);

router.post(
  "/consume",
  requireRoles("ADMIN", "PROJECT_MANAGER", "SITE_ENGINEER", "STORE_MANAGER"),
  validateRequest(consumeMaterialsSchema),
  (req, res, next) => inventoryController.consumeMaterials(req, res, next)
);

export default router;
