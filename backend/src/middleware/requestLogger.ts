import { Request, Response, NextFunction } from "express";
import config from "../config/index.js";

const SENSITIVE_KEYS = new Set([
  "password",
  "passwordhash",
  "token",
  "jwt",
  "secret",
  "authorization",
  "cookie",
  "creditcard",
]);

export const sanitizeData = (data: unknown): unknown => {
  if (!data || typeof data !== "object") {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeData);
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitized[key] = "[REDACTED]";
    } else if (value && typeof value === "object") {
      sanitized[key] = sanitizeData(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

export const requestLoggerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();

  res.on("finish", () => {
    // In test environment, suppress routine request logs unless debugging
    if (config.NODE_ENV === "test") {
      return;
    }

    const duration = Date.now() - startTime;
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info",
      requestId: req.id || "unknown",
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs: duration,
      userAgent: req.headers["user-agent"] || "unknown",
      ip: req.ip || req.socket.remoteAddress || "unknown",
    };

    if (res.statusCode >= 400) {
      console.warn(`[HTTP] ${JSON.stringify(logEntry)}`);
    } else {
      console.log(`[HTTP] ${JSON.stringify(logEntry)}`);
    }
  });

  next();
};

export default requestLoggerMiddleware;
