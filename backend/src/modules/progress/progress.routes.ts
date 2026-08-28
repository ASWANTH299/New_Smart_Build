import { Router } from "express";
import progressController from "./progress.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { requireProjectAccess } from "../../middleware/projectAccess.js";

const router = Router({ mergeParams: true });

router.use(authenticate);
router.use(requireProjectAccess("projectId"));

router.get("/", (req, res, next) =>
  progressController.getProgressHistory(req, res, next)
);

export default router;
