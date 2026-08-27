import { z } from "zod";
import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";

// Load .env from current directory or monorepo root
const envPath = fs.existsSync(path.resolve(process.cwd(), ".env"))
  ? path.resolve(process.cwd(), ".env")
  : path.resolve(process.cwd(), "../.env");

dotenv.config({ path: envPath });

const configSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]),
  PORT: z.coerce.number().int().positive("PORT must be a positive integer"),
  MONGODB_URI: z.string().min(1, "MONGODB_URI cannot be empty"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters long for security"),
  JWT_EXPIRES_IN: z.string().min(1, "JWT_EXPIRES_IN cannot be empty"),
  CLIENT_URL: z.string().url("CLIENT_URL must be a valid URL"),
  STORAGE_PATH: z.string().min(1, "STORAGE_PATH cannot be empty"),
  LOG_LEVEL: z.enum(["error", "warn", "info", "http", "debug"]),
});

export type Config = z.infer<typeof configSchema>;

export const loadConfig = (envSource: NodeJS.ProcessEnv = process.env): Config => {
  const result = configSchema.safeParse(envSource);
  if (!result.success) {
    const errorDetails = result.error.issues
      .map((err) => `  - ${err.path.join(".")}: ${err.message}`)
      .join("\n");
    throw new Error(`[Configuration Error] Environment validation failed:\n${errorDetails}`);
  }
  return result.data;
};

export const config: Config = ((): Config => {
  // During tests, config may be loaded with test overrides or on demand
  try {
    return loadConfig();
  } catch (error) {
    // If running in test mode where env is set per-test, return empty structure or throw
    if (process.env.NODE_ENV === "test") {
      return {
        NODE_ENV: "test",
        PORT: 5000,
        MONGODB_URI: "mongodb://localhost:27017/smart_build_test",
        JWT_SECRET: "test_jwt_secret_key_minimum_32_characters_long_for_security",
        JWT_EXPIRES_IN: "1d",
        CLIENT_URL: "http://localhost:5173",
        STORAGE_PATH: "./storage_test",
        LOG_LEVEL: "info",
      };
    }
    throw error;
  }
})();

export default config;
