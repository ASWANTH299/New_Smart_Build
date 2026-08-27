import { describe, it, expect } from "vitest";
import { loadConfig } from "./index.js";

describe("Configuration Module & Environment Validation", () => {
  const validEnv = {
    NODE_ENV: "development",
    PORT: "5000",
    MONGODB_URI: "mongodb://localhost:27017/smart_build_test",
    JWT_SECRET: "this_is_a_valid_32_char_minimum_jwt_secret_key!",
    JWT_EXPIRES_IN: "7d",
    CLIENT_URL: "http://localhost:5173",
    STORAGE_PATH: "./storage",
    LOG_LEVEL: "info",
  };

  it("should successfully parse and validate a valid environment configuration", () => {
    const config = loadConfig(validEnv as NodeJS.ProcessEnv);
    expect(config.NODE_ENV).toBe("development");
    expect(config.PORT).toBe(5000);
    expect(config.MONGODB_URI).toBe("mongodb://localhost:27017/smart_build_test");
    expect(config.CLIENT_URL).toBe("http://localhost:5173");
  });

  it("should throw a descriptive error when required PORT is missing", () => {
    const invalidEnv = { ...validEnv, PORT: "" };
    expect(() => loadConfig(invalidEnv as NodeJS.ProcessEnv)).toThrow(/Environment validation failed/);
  });

  it("should throw an error when PORT is non-numeric or negative", () => {
    const invalidEnv = { ...validEnv, PORT: "-100" };
    expect(() => loadConfig(invalidEnv as NodeJS.ProcessEnv)).toThrow(/PORT must be a positive integer/);
  });

  it("should throw an error when JWT_SECRET is shorter than 32 characters", () => {
    const invalidEnv = { ...validEnv, JWT_SECRET: "short_secret" };
    expect(() => loadConfig(invalidEnv as NodeJS.ProcessEnv)).toThrow(/JWT_SECRET must be at least 32 characters/);
  });

  it("should throw an error when CLIENT_URL is not a valid URL", () => {
    const invalidEnv = { ...validEnv, CLIENT_URL: "not-a-valid-url" };
    expect(() => loadConfig(invalidEnv as NodeJS.ProcessEnv)).toThrow(/CLIENT_URL must be a valid URL/);
  });

  it("should throw an error when NODE_ENV is not one of development, production, test", () => {
    const invalidEnv = { ...validEnv, NODE_ENV: "staging" };
    expect(() => loadConfig(invalidEnv as NodeJS.ProcessEnv)).toThrow(/NODE_ENV/);
  });
});
