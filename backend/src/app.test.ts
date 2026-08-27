import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";

describe("Integrated Express Application Pipeline (Phase 2)", () => {
  const app = createApp();

  it("should respond with 200 and baseline metadata at GET /", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("status", "online");
    expect(res.body.data).toHaveProperty("name", "Smart Build API");
    expect(res.body.data).toHaveProperty("apiPrefix", "/api/v1");
  });

  it("should respond with health check status at GET /api/v1/health", async () => {
    const res = await request(app).get("/api/v1/health");
    expect([200, 503]).toContain(res.status);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("status");
    expect(res.body.data).toHaveProperty("uptimeSeconds");
    expect(res.body.data).toHaveProperty("database");
    expect(res.body.data.database).toHaveProperty("status");
  });

  it("should return X-Request-Id header on all API responses", async () => {
    const res = await request(app).get("/");
    expect(res.headers["x-request-id"]).toBeDefined();
    expect(typeof res.headers["x-request-id"]).toBe("string");
  });

  it("should return security headers configured by Helmet", async () => {
    const res = await request(app).get("/");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-frame-options"]).toBeDefined();
  });

  it("should return 404 with structured JSON for unknown routes under /api/v1", async () => {
    const res = await request(app).get("/api/v1/unknown-resource-endpoint");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe("NOT_FOUND");
    expect(res.body.message).toContain("Route not found");
  });
});
