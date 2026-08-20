import express, { Express, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";

export const createApp = (): Express => {
  const clientUrl = process.env.CLIENT_URL;
  if (!clientUrl) {
    throw new Error("Missing required environment variable: CLIENT_URL");
  }

  const app = express();

  // Security & Cross-Cutting Middleware
  app.use(helmet());
  app.use(
    cors({
      origin: clientUrl,
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Baseline Root Route
  app.get("/", (_req: Request, res: Response) => {
    res.status(200).json({
      name: "Smart Build API",
      version: "1.0.0",
      status: "online",
    });
  });

  // Base API v1 status
  app.get("/api/v1", (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      message: "Smart Build API v1 baseline operational",
    });
  });

  return app;
};

export default createApp;
