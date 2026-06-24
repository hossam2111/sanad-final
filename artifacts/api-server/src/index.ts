import app from "./app.js";
import { logger } from "./lib/logger.js";
import { setReadinessDraining } from "./routes/health.js";
import { closeSseClients } from "./lib/sse.js";
import { pool } from "@workspace/db";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const server = app.listen(port, "0.0.0.0", () => {
  logger.info({ port }, "SANAD API server started");
});

server.on("error", (err: Error) => {
  logger.error({ err }, "Server failed to start");
  process.exit(1);
});

function gracefulShutdown(signal: string) {
  logger.info({ signal }, "Shutdown signal received");
  setReadinessDraining(true);
  const closed = closeSseClients();
  logger.info({ closedSseClients: closed }, "SSE clients closed");
  
  server.close(async () => {
    logger.info("HTTP server closed.");
    await pool.end();
    logger.info("DB pool closed. Exiting.");
    process.exit(0);
  });
  
  // Force exit after 15s if connections don't drain
  setTimeout(() => {
    logger.error("Graceful shutdown timed out. Forcing exit.");
    process.exit(1);
  }, 15_000).unref();
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT",  () => gracefulShutdown("SIGINT"));

// Node 24 exits by default on unhandled rejections — log and survive instead.
process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "unhandledRejection — caught, server will not crash");
});
process.on("uncaughtException", (err) => {
  logger.error({ err }, "uncaughtException — caught, server will not crash");
});
