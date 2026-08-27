import { Router } from "express";
import healthRoutes from "./health.routes.js";
import authRoutes from "../modules/auth/auth.routes.js";

const router = Router();

// Mount baseline health check endpoint at /api/v1/health
router.use("/", healthRoutes);

// Mount authentication module routes at /api/v1/auth
router.use("/auth", authRoutes);

export default router;
