# SANAD Backend Hardening Changelog

**Date:** 2026-06-15

## 1. What was completed

### Database Module (`@workspace/db`)
- **DB Pool Configuration:** Configured Postgres connection pool with standard production defaults (`max: 20`, `idleTimeoutMillis: 30000`, `connectionTimeoutMillis: 5000`). SSL is dynamically enabled unless explicitly opted out (`DB_SSL=false`).
- **Exported Stats:** Exported `getDbPoolStats` to provide metrics on total, idle, and waiting connections.
- **Migration Workflow:** Established a proper Drizzle migration pipeline using formal migration files (`drizzle/`).
  - Added `generate` script to safely track schema versions.
  - Added `migrate.ts` runner for safe migrations in production.

### API Server (`@workspace/api-server`)
- **Graceful Shutdown Sequence:** Upgraded `SIGTERM` and `SIGINT` handling to safely close connections in four coordinated steps:
  1. Set readiness state to draining to remove the API from load balancer rotation.
  2. Forcibly close all SSE connections with heartbeats using `closeSseClients()`.
  3. Drain active HTTP requests by waiting for the Express server to close.
  4. Explicitly terminate the database connection pool (`pool.end()`).
- **Type Safety:** Resolved a `raw` property typechecking error inside Pino logging `customProps` adapter.

## 2. Dependencies
- These changes are strictly localized to the backend modules (`artifacts/api-server` and `lib/db`).
- They do not conflict with the active localization branch (which focuses on output language translation for the AI engines).

## 3. Deployer Notes
- **Infrastructure:** Be aware that horizontal scaling will still be problematic until SSE switches from an in-memory Map to a Redis Pub/Sub model (scheduled for the next phase).
- **Deployment Process:** When pushing a new version, first run the built `dist/migrate.js` (compiled from `lib/db/src/migrate.ts`) to ensure the schema matches the code. Failure to apply the migrations will result in errors on schema-modified routes.
- **Environment Variables:** Several new env vars dictate pooling (`DB_POOL_MAX`, `DB_POOL_IDLE_TIMEOUT_MS`, `DB_POOL_CONNECT_TIMEOUT_MS`) and SSL (`DB_SSL`). They safely fallback to standard defaults if omitted.
