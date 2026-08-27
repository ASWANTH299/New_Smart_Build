import { describe, it, expect } from "vitest";
import express, { Request, Response, NextFunction } from "express";
import request from "supertest";
import {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  InternalServerError,
} from "../utils/AppError.js";
import { errorHandler, notFoundHandler } from "./errorHandler.js";

describe("Error Classes & Centralized Error Handler", () => {
  it("should create AppError instances with correct properties", () => {
    const err = new AppError("Test message", 418, "TEAPOT_ERROR", true, { info: "extra" });
    expect(err.message).toBe("Test message");
    expect(err.statusCode).toBe(418);
    expect(err.errorCode).toBe("TEAPOT_ERROR");
    expect(err.isOperational).toBe(true);
    expect(err.details).toEqual({ info: "extra" });
  });

  it("should instantiate specialized error subclasses with expected status codes", () => {
    expect(new BadRequestError().statusCode).toBe(400);
    expect(new UnauthorizedError().statusCode).toBe(401);
    expect(new ForbiddenError().statusCode).toBe(403);
    expect(new NotFoundError().statusCode).toBe(404);
    expect(new ConflictError().statusCode).toBe(409);
    expect(new ValidationError().statusCode).toBe(422);
    expect(new InternalServerError().statusCode).toBe(500);
  });

  describe("Error Handler Middleware in Express", () => {
    const createTestApp = () => {
      const app = express();
      app.use(express.json());

      app.get("/trigger-bad-request", () => {
        throw new BadRequestError("Invalid parameter passed", "INVALID_PARAM");
      });

      app.get("/trigger-unauthorized", () => {
        throw new UnauthorizedError("Session expired");
      });

      app.get("/trigger-forbidden", () => {
        throw new ForbiddenError("Insufficient project permissions");
      });

      app.get("/trigger-conflict", () => {
        throw new ConflictError("Project code already exists");
      });

      app.get("/trigger-mongoose-cast-error", () => {
        const castError = new Error("Cast to ObjectId failed") as Error & { name: string; path: string };
        castError.name = "CastError";
        castError.path = "projectId";
        throw castError;
      });

      app.get("/trigger-mongoose-duplicate-key", () => {
        const dupError = new Error("E11000 duplicate key error") as Error & {
          name: string;
          code: number;
          keyValue: Record<string, unknown>;
        };
        dupError.name = "MongoServerError";
        dupError.code = 11000;
        dupError.keyValue = { code: "PRJ-001" };
        throw dupError;
      });

      app.get("/trigger-generic-error", () => {
        throw new Error("Unhandled unexpected crash");
      });

      // Pass error via next()
      app.get("/trigger-next-error", (_req: Request, _res: Response, next: NextFunction) => {
        next(new NotFoundError("Resource not found via next"));
      });

      app.use(notFoundHandler);
      app.use(errorHandler);
      return app;
    };

    const app = createTestApp();

    it("should handle BadRequestError with 400 and custom code", async () => {
      const res = await request(app).get("/trigger-bad-request");
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe("INVALID_PARAM");
      expect(res.body.message).toBe("Invalid parameter passed");
    });

    it("should handle UnauthorizedError with 401", async () => {
      const res = await request(app).get("/trigger-unauthorized");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe("UNAUTHORIZED");
    });

    it("should handle ForbiddenError with 403", async () => {
      const res = await request(app).get("/trigger-forbidden");
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe("FORBIDDEN");
    });

    it("should handle ConflictError with 409", async () => {
      const res = await request(app).get("/trigger-conflict");
      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe("CONFLICT");
    });

    it("should map Mongoose CastError to 400 INVALID_ID", async () => {
      const res = await request(app).get("/trigger-mongoose-cast-error");
      expect(res.status).toBe(400);
      expect(res.body.code).toBe("INVALID_ID");
      expect(res.body.message).toContain("projectId");
    });

    it("should map Mongoose Duplicate Key Error (11000) to 409 DUPLICATE_RESOURCE", async () => {
      const res = await request(app).get("/trigger-mongoose-duplicate-key");
      expect(res.status).toBe(409);
      expect(res.body.code).toBe("DUPLICATE_RESOURCE");
    });

    it("should handle unhandled errors safely with 500 status", async () => {
      const res = await request(app).get("/trigger-generic-error");
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe("INTERNAL_SERVER_ERROR");
    });

    it("should handle errors passed to next()", async () => {
      const res = await request(app).get("/trigger-next-error");
      expect(res.status).toBe(404);
      expect(res.body.code).toBe("NOT_FOUND");
    });

    it("should return 404 for undefined routes", async () => {
      const res = await request(app).get("/non-existent-endpoint");
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe("NOT_FOUND");
      expect(res.body.message).toContain("Route not found");
    });
  });
});
