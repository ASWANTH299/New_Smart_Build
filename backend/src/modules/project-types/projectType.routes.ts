import { Router } from "express";
import projectTypeController from "./projectType.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { requireRoles } from "../../middleware/authorize.js";

const router = Router();

router.use(authenticate);

router.get("/", (req, res, next) => projectTypeController.getProjectTypes(req, res, next));
router.post("/", requireRoles("ADMIN"), (req, res, next) =>
  projectTypeController.createProjectType(req, res, next)
);

export default router;
