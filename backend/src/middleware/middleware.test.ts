import { describe, it, expect } from "vitest";
import express, { Request, Response } from "express";
import request from "supertest";
import { z } from "zod";
import { correlationIdMiddleware } from "./correlationId.js";
import { sanitizeData } from "./requestLogger.js";
import { validateRequest } from "./validate.js";
import { errorHandler } from "./errorHandler.js";

describe("Cross-Cutting Middleware", () => {
  describe("Correlation ID Middleware", () => {
    it("should generate a new UUID for requests without an existing X-Request-Id", async () => {
      const app = express();
      app.use(correlationIdMiddleware);
      app.get("/test", (req: Request, res: Response) => {
        res.json({ id: req.id, correlationId: req.correlationId });
      });

      const res = await request(app).get("/test");
      expect(res.status).toBe(200);
      expect(res.headers["x-request-id"]).toBeDefined();
      expect(res.body.id).toBe(res.headers["x-request-id"]);
    });

    it("should preserve and forward an existing X-Request-Id header", async () => {
      const app = express();
      app.use(correlationIdMiddleware);
      app.get("/test", (req: Request, res: Response) => {
        res.json({ id: req.id });
      });

      const customId = "client-trace-12345";
      const res = await request(app).get("/test").set("X-Request-Id", customId);
      expect(res.status).toBe(200);
      expect(res.headers["x-request-id"]).toBe(customId);
      expect(res.body.id).toBe(customId);
    });
  });

  describe("Request Logger & Sensitive Data Redaction", () => {
    it("should sanitize passwords, tokens, and secrets from logged data", () => {
      const rawPayload = {
        name: "Test Project",
        password: "SuperSecretPassword123!",
        nested: {
          token: "jwt.secret.token",
          safeField: "safe value",
        },
        items: [{ secret: "api-secret-key" }, { quantity: 100 }],
      };

      const sanitized = sanitizeData(rawPayload) as typeof rawPayload;
      expect(sanitized.password).toBe("[REDACTED]");
      expect(sanitized.nested.token).toBe("[REDACTED]");
      expect(sanitized.nested.safeField).toBe("safe value");
      expect(sanitized.items[0].secret).toBe("[REDACTED]");
      expect(sanitized.items[1].quantity).toBe(100);
    });
  });

  describe("Zod Request Validation Middleware", () => {
    const testSchema = {
      body: z.object({
        name: z.string().min(3, "Name must be at least 3 characters"),
        quantity: z.number().positive("Quantity must be positive"),
      }),
      query: z.object({
        filter: z.string().optional(),
      }),
    };

    const app = express();
    app.use(express.json());
    app.post(
      "/validate-test",
      validateRequest(testSchema),
      (req: Request, res: Response) => {
        res.status(200).json({ success: true, data: req.body });
      }
    );
    app.use(errorHandler);

    it("should accept valid request payload and continue to handler", async () => {
      const res = await request(app)
        .post("/validate-test")
        .send({ name: "Cement Batch", quantity: 50 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("Cement Batch");
    });

    it("should reject invalid request payload with 422 and structured field errors", async () => {
      const res = await request(app)
        .post("/validate-test")
        .send({ name: "A", quantity: -10 });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe("VALIDATION_ERROR");
      expect(res.body.details).toBeDefined();
      expect(Array.isArray(res.body.details)).toBe(true);
      expect(res.body.details.length).toBeGreaterThanOrEqual(2);
    });
  });
});
