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
  max: Number(process.env.DB_POOL_MAX) || 20,
  idleTimeoutMillis: Number(process.env.DB_POOL_IDLE_TIMEOUT_MS) || 30_000,
  connectionTimeoutMillis: Number(process.env.DB_POOL_CONNECT_TIMEOUT_MS) || 5_000,
  ssl: process.env.DB_SSL === "false" ? false : process.env.DATABASE_URL?.includes("sslmode=") ? undefined : { rejectUnauthorized: false },
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
