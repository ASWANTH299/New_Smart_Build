import { Response } from "express";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  meta?: Record<string, unknown>;
  code?: string;
  details?: unknown;
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  meta?: Record<string, unknown>,
  statusCode = 200,
  message?: string
): Response => {
  const responsePayload: ApiResponse<T> = {
    success: true,
    data,
    ...(message ? { message } : {}),
    ...(meta ? { meta } : {}),
  };
  return res.status(statusCode).json(responsePayload);
};

export const sendError = (
  res: Response,
  message: string,
  errorCode = "INTERNAL_SERVER_ERROR",
  statusCode = 500,
  details?: unknown
): Response => {
  const responsePayload: ApiResponse = {
    success: false,
    message,
    code: errorCode,
    ...(details !== undefined ? { details } : {}),
  };
  return res.status(statusCode).json(responsePayload);
};
