import { Router } from "express";
import healthRoutes from "./health.routes.js";
import authRoutes from "../modules/auth/auth.routes.js";
import userRoutes from "../modules/users/user.routes.js";
import projectRoutes from "../modules/projects/project.routes.js";
import projectTypeRoutes from "../modules/project-types/projectType.routes.js";
import projectTemplateRoutes from "../modules/project-templates/projectTemplate.routes.js";

const router = Router();

// Mount baseline health check endpoint at /api/v1/health
router.use("/", healthRoutes);

// Mount authentication module routes at /api/v1/auth
router.use("/auth", authRoutes);

// Mount user management module routes at /api/v1/users
router.use("/users", userRoutes);

// Mount project types & templates routes
router.use("/project-types", projectTypeRoutes);
router.use("/project-templates", projectTemplateRoutes);

// Mount project operations routes at /api/v1/projects
router.use("/projects", projectRoutes);

export default router;
