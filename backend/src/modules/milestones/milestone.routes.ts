import { Router } from "express";
import milestoneController from "./milestone.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { requireRoles } from "../../middleware/authorize.js";
import { requireProjectAccess } from "../../middleware/projectAccess.js";
import { validateRequest } from "../../middleware/validate.js";
import {
  createMilestoneSchema,
  updateMilestoneSchema,
} from "./milestone.validator.js";

const router = Router({ mergeParams: true });

router.use(authenticate);
router.use(requireProjectAccess("projectId"));

router.get("/", (req, res, next) =>
  milestoneController.getMilestones(req, res, next)
);

router.post(
  "/",
  requireRoles("ADMIN", "PROJECT_MANAGER"),
  validateRequest(createMilestoneSchema),
  (req, res, next) => milestoneController.createMilestone(req, res, next)
);

router.get("/:milestoneId", (req, res, next) =>
  milestoneController.getMilestoneById(req, res, next)
);

router.put(
  "/:milestoneId",
  requireRoles("ADMIN", "PROJECT_MANAGER", "SITE_ENGINEER"),
  validateRequest(updateMilestoneSchema),
  (req, res, next) => milestoneController.updateMilestone(req, res, next)
);

router.delete(
  "/:milestoneId",
  requireRoles("ADMIN", "PROJECT_MANAGER"),
  (req, res, next) => milestoneController.deleteMilestone(req, res, next)
);

export default router;
