import { Router } from "express";
import healthRoutes from "./health.routes.js";

const router = Router();

// Mount baseline health check endpoint at /api/v1/health
router.use("/", healthRoutes);

export default router;
