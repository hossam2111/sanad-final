import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.DB_POOL_MAX) || 10,
  idleTimeoutMillis: Number(process.env.DB_POOL_IDLE_TIMEOUT_MS) || 60_000,
  connectionTimeoutMillis: Number(process.env.DB_POOL_CONNECT_TIMEOUT_MS) || 15_000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10_000,
  ssl: process.env.DB_SSL === "false" ? false : process.env.DATABASE_URL?.includes("sslmode=") ? undefined : { rejectUnauthorized: false },
});

// Without this handler, any idle-connection drop from Neon (which closes
// connections after ~5 min inactivity in serverless mode) would emit an
// uncaught 'error' event and crash the Node.js process.
pool.on("error", (err) => {
  console.error("[db-pool] idle client error (connection will be replaced):", err.message);
});

export function getDbPoolStats() {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  };
}

export const db = drizzle(pool, { schema });

export * from "./schema";
