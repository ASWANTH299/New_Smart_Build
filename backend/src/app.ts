import express, { Express, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import config from "./config/index.js";
import { correlationIdMiddleware } from "./middleware/correlationId.js";
import { requestLoggerMiddleware } from "./middleware/requestLogger.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import apiV1Router from "./routes/index.js";
import { sendSuccess } from "./utils/apiResponse.js";

export const createApp = (): Express => {
  const app = express();

  // 1. Request Tracking & Correlation ID
  app.use(correlationIdMiddleware);

  // 2. Security Headers & CORS
  app.use(helmet({
    dnsPrefetchControl: { allow: false },
    frameguard: { action: "deny" },
    hidePoweredBy: true,
  }));
  app.use(
    cors({
      origin: config.CORS_ORIGIN || config.CLIENT_URL || "http://localhost:5173",
      credentials: true,
    })
  );

  // 2.5 Rate Limiting
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: { success: false, message: "Too many requests. Please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { success: false, message: "Too many requests. Please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
  });

  if (config.NODE_ENV !== "test") {
    app.use("/api/v1/auth/login", authLimiter);
    app.use("/api/v1/auth/register", authLimiter);
    app.use("/api/v1/", apiLimiter);
  }

  // 3. Body Parsing & Sanitization
  app.use(express.json({ limit: "10kb" }));
  app.use(express.urlencoded({ extended: true, limit: "10kb" }));
  app.use(mongoSanitize());

  // 4. Structured Request Logging
  app.use(requestLoggerMiddleware);

  // 5. Root Baseline Route
  app.get("/", (_req: Request, res: Response) => {
    return sendSuccess(res, {
      name: "Smart Build API",
      version: "1.0.0",
      status: "online",
      environment: config.NODE_ENV,
      apiPrefix: "/api/v1",
    });
  });

  // 6. Mount API v1 Routers
  app.use("/api/v1", apiV1Router);

  // 7. 404 Not Found Handler
  app.use(notFoundHandler);

  // 8. Centralized Error Handler (must be last)
  app.use(errorHandler);

  return app;
};

export default createApp;
