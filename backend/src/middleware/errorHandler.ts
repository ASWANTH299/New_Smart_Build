import { Request, Response, NextFunction } from "express";
import { AppError, NotFoundError } from "../utils/AppError.js";
import { sendError } from "../utils/apiResponse.js";
import config from "../config/index.js";

interface MongoError extends Error {
  code?: number;
  keyPattern?: Record<string, unknown>;
  keyValue?: Record<string, unknown>;
  errors?: Record<string, { message: string; path: string }>;
  path?: string;
  value?: unknown;
}

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(new NotFoundError(`Route not found: ${req.method} ${req.originalUrl}`));
};

export const errorHandler = (
  err: Error | AppError | MongoError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let errorCode = "INTERNAL_SERVER_ERROR";
  let message = "An unexpected internal server error occurred.";
  let details: unknown = undefined;

  // 1. Handled AppError instances
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorCode = err.errorCode;
    message = err.message;
    details = err.details;
  }
  // 2. Mongoose Invalid ObjectId CastError
  else if (err.name === "CastError" && "path" in err) {
    statusCode = 400;
    errorCode = "INVALID_ID";
    message = `Invalid format for resource identifier: ${err.path}`;
  }
  // 3. Mongoose Duplicate Key Error (E11000)
  else if (err.name === "MongoServerError" && (err as MongoError).code === 11000) {
    statusCode = 409;
    errorCode = "DUPLICATE_RESOURCE";
    const field = Object.keys((err as MongoError).keyValue || {})[0] || "field";
    message = `A resource with that ${field} already exists.`;
  }
  // 4. Mongoose Schema Validation Error
  else if (err.name === "ValidationError" && (err as MongoError).errors) {
    statusCode = 422;
    errorCode = "DATABASE_VALIDATION_ERROR";
    message = "Database record validation failed.";
    details = Object.values((err as MongoError).errors || {}).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }
  // 5. Express JSON parse error
  else if (err instanceof SyntaxError && "status" in err && err.status === 400 && "body" in err) {
    statusCode = 400;
    errorCode = "MALFORMED_JSON";
    message = "Request body contains invalid JSON syntax.";
  }
  // 6. Generic unhandled errors
  else {
    if (config.NODE_ENV !== "production") {
      message = err.message || message;
    }
  }

  // Log unhandled server errors (5xx)
  if (statusCode >= 500 && config.NODE_ENV !== "test") {
    console.error(`[Error] Request ID: ${req.id || "N/A"} -`, err);
  }

  sendError(res, message, errorCode, statusCode, details);
};

export default errorHandler;
