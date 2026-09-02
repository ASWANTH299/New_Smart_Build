import { Router } from "express";
import healthRoutes from "./health.routes.js";
import authRoutes from "../modules/auth/auth.routes.js";
import userRoutes from "../modules/users/user.routes.js";
import projectRoutes from "../modules/projects/project.routes.js";
import projectTypeRoutes from "../modules/project-types/projectType.routes.js";
import projectTemplateRoutes from "../modules/project-templates/projectTemplate.routes.js";
import materialRoutes from "../modules/materials/material.routes.js";
import inventoryRoutes from "../modules/inventory/inventory.routes.js";
import vendorRoutes from "../modules/vendors/vendor.routes.js";
import workforceRoutes from "../modules/workforce/workforce.routes.js";

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

// Mount materials catalog routes at /api/v1/materials
router.use("/materials", materialRoutes);

// Mount inventory management routes at /api/v1/inventory
router.use("/inventory", inventoryRoutes);

// Mount vendor management routes at /api/v1/vendors
router.use("/vendors", vendorRoutes);

// Mount workforce management routes at /api/v1/workforce
router.use("/workforce", workforceRoutes);

// Mount project operations routes at /api/v1/projects
router.use("/projects", projectRoutes);

export default router;
