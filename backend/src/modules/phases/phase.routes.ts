import { Router } from "express";
import phaseController from "./phase.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { requireRoles } from "../../middleware/authorize.js";
import { requireProjectAccess } from "../../middleware/projectAccess.js";
import { validateRequest } from "../../middleware/validate.js";
import { createPhaseSchema, updatePhaseSchema } from "./phase.validator.js";

const router = Router({ mergeParams: true });

router.use(authenticate);
router.use(requireProjectAccess("projectId"));

router.get("/", (req, res, next) => phaseController.getPhases(req, res, next));

router.post(
  "/",
  requireRoles("ADMIN", "PROJECT_MANAGER"),
  validateRequest(createPhaseSchema),
  (req, res, next) => phaseController.createPhase(req, res, next)
);

router.get("/:phaseId", (req, res, next) =>
  phaseController.getPhaseById(req, res, next)
);

router.put(
  "/:phaseId",
  requireRoles("ADMIN", "PROJECT_MANAGER"),
  validateRequest(updatePhaseSchema),
  (req, res, next) => phaseController.updatePhase(req, res, next)
);

router.delete(
  "/:phaseId",
  requireRoles("ADMIN", "PROJECT_MANAGER"),
  (req, res, next) => phaseController.deletePhase(req, res, next)
);

export default router;
