import { Router } from "express";
import clientController from "./client.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { requireRoles } from "../../middleware/authorize.js";

const router = Router();

// Enforce authentication and CLIENT / ADMIN role restriction
router.use(authenticate);
router.use(requireRoles("CLIENT", "ADMIN"));

// GET /api/v1/client/projects - List projects for logged-in client
router.get("/projects", (req, res, next) =>
  clientController.getClientProjects(req, res, next)
);

// GET /api/v1/client/projects/:projectId - Client-safe project details
router.get("/projects/:projectId", (req, res, next) =>
  clientController.getClientProjectDetails(req, res, next)
);

export default router;
