import { Router } from "express";
import projectTemplateController from "./projectTemplate.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { requireRoles } from "../../middleware/authorize.js";

const router = Router();

router.use(authenticate);

router.get("/", (req, res, next) => projectTemplateController.getTemplates(req, res, next));
router.get("/:templateId", (req, res, next) =>
  projectTemplateController.getTemplateById(req, res, next)
);
router.post("/", requireRoles("ADMIN"), (req, res, next) =>
  projectTemplateController.createTemplate(req, res, next)
);

export default router;
