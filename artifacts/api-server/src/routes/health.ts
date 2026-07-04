import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db, getDbPoolStats } from "@workspace/db";
import { logger } from "../lib/logger.js";
import { getAuditMetrics } from "../lib/audit.js";
import { getSseMetrics } from "../lib/sse.js";

const router: IRouter = Router();

let draining = false;

const DB_LATENCY_THRESHOLD_MS = Number(process.env["DB_READINESS_LATENCY_MS"] ?? 750);

function buildInfo() {
  return {
    version: process.env["npm_package_version"] ?? "unknown",
    buildSha: process.env["GIT_SHA"] ?? process.env["RENDER_GIT_COMMIT"] ?? process.env["VERCEL_GIT_COMMIT_SHA"] ?? "unknown",
    migrationVersion: process.env["DB_MIGRATION_VERSION"] ?? "unknown",
  };
}

export function setReadinessDraining(nextDraining: boolean): void {
  draining = nextDraining;
}

async function checkDatabase() {
  const start = Date.now();
  let ok = false;
  let latencyMs: number | null = null;
  let error: string | null = null;

  try {
    await db.execute(sql`SELECT 1`);
    ok = true;
    latencyMs = Date.now() - start;
  } catch (err) {
    error = err instanceof Error ? err.message : "Database ping failed";
    logger.error({ err }, "Health check: DB ping failed");
  }

  return {
    ok,
    latencyMs,
    withinThreshold: ok && latencyMs !== null && latencyMs <= DB_LATENCY_THRESHOLD_MS,
    thresholdMs: DB_LATENCY_THRESHOLD_MS,
    error,
    pool: getDbPoolStats(),
  };
}

router.get("/livez", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    draining,
    ...buildInfo(),
  });
});

router.get("/readyz", async (_req, res) => {
  const database = await checkDatabase();
  const ready = !draining && database.ok && database.withinThreshold;

  res.status(ready ? 200 : 503).json({
    status: ready ? "ready" : "not_ready",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    draining,
    services: { database },
    ...buildInfo(),
  });
});

router.get("/healthz", async (req, res) => {
  const database = await checkDatabase();
  const ready = !draining && database.ok && database.withinThreshold;
  const soft = req.query["soft"] === "1";

  const payload = {
    status: ready ? "ok" : database.ok ? "degraded" : "unhealthy",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    draining,
    services: {
      database,
      audit: getAuditMetrics(),
      sse: getSseMetrics(),
    },
    ...buildInfo(),
  };

  res.status(soft ? 200 : ready ? 200 : 503).json(payload);
});

export default router;
