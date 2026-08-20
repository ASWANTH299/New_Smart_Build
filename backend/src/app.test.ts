import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";

describe("Backend Application Foundation (Phase 1)", () => {
  beforeEach(() => {
    process.env.CLIENT_URL = "http://localhost:5173";
  });

  it("throws error when required CLIENT_URL environment variable is missing", () => {
    delete process.env.CLIENT_URL;
    expect(() => createApp()).toThrow("Missing required environment variable: CLIENT_URL");
  });

  it("should respond with 200 and status online at root / when configured", async () => {
    const app = createApp();
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", "online");
    expect(res.body).toHaveProperty("name", "Smart Build API");
    expect(res.body).toHaveProperty("version", "1.0.0");
  });

  it("should respond with 200 on /api/v1 baseline endpoint", async () => {
    const app = createApp();
    const res = await request(app).get("/api/v1");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body).toHaveProperty("message");
  });
});
