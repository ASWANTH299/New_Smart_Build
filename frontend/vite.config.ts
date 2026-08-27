/// <reference types="vitest" />
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import fs from "node:fs";

export default defineConfig(({ mode, command }) => {
  // Check current directory first, then root directory for monorepo .env
  const rootDir = fs.existsSync(path.resolve(process.cwd(), ".env"))
    ? process.cwd()
    : path.resolve(process.cwd(), "..");

  const env = {
    ...loadEnv(mode, rootDir, ""),
    ...process.env,
  };

  const vitePort = env.VITE_PORT;
  if (!vitePort && command === "serve" && mode !== "test") {
    throw new Error("Missing required environment variable: VITE_PORT");
  }

  const port = vitePort ? parseInt(vitePort, 10) : undefined;
  if (vitePort && (isNaN(port as number) || (port as number) <= 0)) {
    throw new Error(`Invalid VITE_PORT configuration: "${vitePort}"`);
  }

  return {
    plugins: [react()],
    envDir: rootDir,
    server: {
      port,
      host: true,
      strictPort: true,
    },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./src/test/setup.ts",
      css: true,
    },
  };
});
