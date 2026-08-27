import { Request, Response, NextFunction } from "express";
import crypto from "node:crypto";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      id?: string;
      correlationId?: string;
    }
  }
}

export const correlationIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const existingId = req.headers["x-request-id"] || req.headers["x-correlation-id"];
  const requestId = typeof existingId === "string" && existingId.trim().length > 0
    ? existingId.trim()
    : crypto.randomUUID();

  req.id = requestId;
  req.correlationId = requestId;
  res.setHeader("X-Request-Id", requestId);

  next();
};

export default correlationIdMiddleware;
