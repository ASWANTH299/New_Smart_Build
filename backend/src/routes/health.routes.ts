import { Router, Request, Response } from "express";
import { getDatabaseHealth } from "../config/database.js";
import { sendSuccess } from "../utils/apiResponse.js";
import config from "../config/index.js";

const router = Router();

router.get("/health", (_req: Request, res: Response) => {
  const dbHealth = getDatabaseHealth();
  const isHealthy = dbHealth.isConnected || config.NODE_ENV === "test";

  const payload = {
    status: isHealthy ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: config.NODE_ENV,
    version: "1.0.0",
    database: dbHealth,
  };

  const statusCode = isHealthy ? 200 : 503;
  return sendSuccess(res, payload, undefined, statusCode);
});

export default router;
