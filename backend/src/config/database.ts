import mongoose from "mongoose";
import config from "./index.js";

export type DatabaseStatus = "connected" | "connecting" | "disconnecting" | "disconnected" | "uninitialized";

export interface DatabaseHealth {
  status: DatabaseStatus;
  isConnected: boolean;
  readyState: number;
  host?: string;
  name?: string;
}

const READY_STATE_MAP: Record<number, DatabaseStatus> = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
};

export const getDatabaseHealth = (): DatabaseHealth => {
  const readyState = mongoose.connection.readyState;
  const status = READY_STATE_MAP[readyState] || "uninitialized";
  const isConnected = readyState === 1;

  return {
    status,
    isConnected,
    readyState,
    ...(isConnected && mongoose.connection.host ? { host: mongoose.connection.host } : {}),
    ...(isConnected && mongoose.connection.name ? { name: mongoose.connection.name } : {}),
  };
};

export const connectDatabase = async (uri: string = config.MONGODB_URI): Promise<typeof mongoose> => {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: config.NODE_ENV !== "production",
    });

    if (config.NODE_ENV !== "test") {
      console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}, database: ${conn.connection.name}`);
    }

    return conn;
  } catch (error) {
    if (config.NODE_ENV !== "test") {
      console.error("[MongoDB] Connection error:", error instanceof Error ? error.message : error);
    }
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    if (config.NODE_ENV !== "test") {
      console.log("[MongoDB] Disconnected successfully");
    }
  }
};
