import config from "./config/index.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { createApp } from "./app.js";
import http from "node:http";

let server: http.Server | null = null;

const startServer = async (): Promise<void> => {
  try {
    // 1. Connect to MongoDB
    await connectDatabase(config.MONGODB_URI);

    // 2. Create Express Application
    const app = createApp();

    // 3. Start HTTP Server
    server = app.listen(config.PORT, () => {
      console.log(`[Smart Build API] Server running in ${config.NODE_ENV} mode on port ${config.PORT}`);
    });
  } catch (error) {
    console.error("[Smart Build API] Fatal startup error:", error);
    process.exit(1);
  }
};

const handleShutdown = async (signal: string): Promise<void> => {
  console.log(`\n[Smart Build API] Received ${signal}. Starting graceful shutdown...`);

  if (server) {
    server.close(async () => {
      console.log("[Smart Build API] HTTP server closed");
      try {
        await disconnectDatabase();
        console.log("[Smart Build API] Graceful shutdown complete");
        process.exit(0);
      } catch (err) {
        console.error("[Smart Build API] Error during database disconnect:", err);
        process.exit(1);
      }
    });

    // Force close after 10 seconds if graceful shutdown hangs
    setTimeout(() => {
      console.error("[Smart Build API] Forced shutdown due to timeout");
      process.exit(1);
    }, 10000).unref();
  } else {
    process.exit(0);
  }
};

process.on("SIGINT", () => handleShutdown("SIGINT"));
process.on("SIGTERM", () => handleShutdown("SIGTERM"));

// Start server if executed directly
if (process.env.NODE_ENV !== "test") {
  startServer();
}

export { startServer, handleShutdown };
