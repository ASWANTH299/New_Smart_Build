import { describe, it, expect } from "vitest";
import { getDatabaseHealth } from "./database.js";

describe("Database Health & Lifecycle Check", () => {
  it("should return valid database health structure", () => {
    const health = getDatabaseHealth();
    expect(health).toHaveProperty("status");
    expect(health).toHaveProperty("isConnected");
    expect(health).toHaveProperty("readyState");
    expect(typeof health.isConnected).toBe("boolean");
    expect(typeof health.readyState).toBe("number");
  });
});
