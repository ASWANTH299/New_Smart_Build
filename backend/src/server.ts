import dotenv from "dotenv";
import { createApp } from "./app.js";

// Load environment variables from .env if present
dotenv.config();

const portEnv = process.env.PORT;
if (!portEnv) {
  throw new Error("Missing required environment variable: PORT");
}

const PORT = parseInt(portEnv, 10);
if (isNaN(PORT) || PORT <= 0) {
  throw new Error(`Invalid PORT configuration: "${portEnv}"`);
}

const app = createApp();

app.listen(PORT, () => {
  console.log(`[Smart Build API] Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
});
