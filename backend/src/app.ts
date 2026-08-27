import express, { Express, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
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
  app.use(helmet());
  app.use(
    cors({
      origin: config.CLIENT_URL,
      credentials: true,
    })
  );

  // 3. Body Parsing
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

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
