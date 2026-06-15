import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import path from "path";
import url from "url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const { Pool } = pg;

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
  const db = drizzle(pool);
  
  console.log("Running migrations...");
  // When run from dist/migrate.js, __dirname is lib/db/dist
  // We want to point to lib/db/drizzle
  const migrationsFolder = path.resolve(__dirname, "../drizzle");
  await migrate(db, { migrationsFolder });
  
  console.log("Migrations complete.");
  await pool.end();
}

main().catch((err) => {
  console.error("Migration failed", err);
  process.exit(1);
});
