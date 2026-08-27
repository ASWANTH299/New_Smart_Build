export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode = 500,
    errorCode = "INTERNAL_SERVER_ERROR",
    isOperational = true,
    details?: unknown
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad request", errorCode = "BAD_REQUEST", details?: unknown) {
    super(message, 400, errorCode, true, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required", errorCode = "UNAUTHORIZED") {
    super(message, 401, errorCode, true);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Access forbidden", errorCode = "FORBIDDEN") {
    super(message, 403, errorCode, true);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found", errorCode = "NOT_FOUND") {
    super(message, 404, errorCode, true);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource conflict", errorCode = "CONFLICT", details?: unknown) {
    super(message, 409, errorCode, true, details);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed", details?: unknown) {
    super(message, 422, "VALIDATION_ERROR", true, details);
  }
}

export class InternalServerError extends AppError {
  constructor(message = "An unexpected error occurred", details?: unknown) {
    super(message, 500, "INTERNAL_SERVER_ERROR", false, details);
  }
}
