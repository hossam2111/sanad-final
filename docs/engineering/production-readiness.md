# SANAD Production Readiness Plan

Read-only audit date: 2026-06-15. This is a plan only. Backend-only items are safe to start in parallel on a separate branch; frontend error-boundary and UI-state work should wait until the localization branch merges.

## Area Plans

| Area | Current state | Risk | Recommended approach | Effort | Priority |
|---|---|---|---|---|---|
| Auth robustness | Login issues an 8-hour JWT (`artifacts/api-server/src/routes/auth.ts:9`, `:82`) and the frontend stores it in `localStorage("sanad_jwt")` (`artifacts/sanad/src/contexts/auth-context.tsx:39-40`, `:119`). Middleware verifies bearer tokens and role paths (`middlewares/auth.ts:42-95`). Auth rate limit defaults to 50/15 min (`app.ts:75`). | XSS can exfiltrate bearer tokens; no refresh rotation, server-side session revocation, logout invalidation, device/session view, or token-expiry UX beyond startup cleanup (`auth-context.tsx:72-80`). | Move to short-lived access tokens plus httpOnly, Secure, SameSite refresh cookies. Add refresh-token rotation with reuse detection, server session table, logout revocation, optional token family invalidation, and a 401 interceptor that refreshes once then redirects with localized expiry messaging. Keep role claims short-lived and enforce authorization server-side. | L | P0 |
| Auth credentials | Demo credentials are hardcoded and plaintext by design (`routes/auth.ts:28-65`). | Production deployment could accidentally ship demo auth posture. | Gate demo credentials behind `NODE_ENV !== "production"` or a `DEMO_AUTH_ENABLED` flag; production path should integrate SSO/IdP or bcrypt/argon2-backed users. Add startup fail-fast if production lacks auth provider config. | M | P0 |
| Rate limits | Global, auth, and AI limiters exist (`app.ts:73-96`, `:128-130`), skipping tests. | General limiter is not env-tunable; no per-user/token limit for authenticated AI or SSE endpoints; auth limit is IP-based only behind trusted proxy. | Make all limits env-configurable; add username+IP auth keying, per-user AI quotas, and Prometheus counters for limited requests. | M | P1 |
| Observability | Pino logger exists with redaction (`lib/logger.ts:3-17`); pino-http logs method/url/status (`app.ts:109-121`); `X-Request-ID` is accepted/exposed (`app.ts:101-104`, `:58-59`). | Correlation ID middleware and pino `genReqId` can diverge because both generate IDs independently; logs omit user/role/route latency buckets; no metrics or error tracking. | Assign `req.id` once, validate inbound `X-Request-ID`, log role/userId after auth, add structured error codes, add OpenTelemetry or Prometheus metrics (`http_request_duration_seconds`, status totals, DB latency, SSE clients, AI call latency), and integrate Sentry/OTel exporter. | M-L | P0/P1 |
| Health checks | `/api/healthz` pings DB and reports latency/status/version (`routes/health.ts:8-34`); auth middleware bypasses it (`middlewares/auth.ts:43`). | One endpoint mixes liveness and readiness. DB outage returns 503, which is right for readiness but too strict for liveness. No dependency thresholds or pool stats. | Split `/api/livez` no-dependency liveness from `/api/readyz` DB/readiness. Keep `/api/healthz` as human summary. Include DB latency threshold, pool wait/idle/total where available, migration version, and build SHA. | S-M | P0 |
| Frontend error boundaries | App has `not-found.tsx` only (`artifacts/sanad/app/not-found.tsx:2`); no `error.tsx`, `global-error.tsx`, or route-level loading files found. Screens render local loading/error blocks inconsistently (`lab.tsx:164-171`, `pharmacy.tsx:564-571`, `family.tsx:172-200`). | Runtime React errors or failed data paths can blank a route or produce inconsistent, untranslated recovery UI. | After localization merges, add App Router `global-error.tsx`, root `error.tsx`, localized route error/loading components, and standard `LoadingState/ErrorState/EmptyState` primitives. Map API 401/403/404/429/5xx to localized recovery actions. | M | P0 frontend, wait |
| API failure UX | Generated client throws `ApiError` with parsed body (`lib/api-client-react/src/custom-fetch.ts:292-344`); many queries set `retry:false` (`emergency.tsx:68`, `family.tsx:117`, `lab.tsx:58`, `pharmacy.tsx:320`). | No centralized retry/backoff policy, token refresh, request ID display, or "try again" pattern. | Add a React Query default policy: no retry for 400/401/403/404, bounded backoff for 429/5xx, request ID capture, and localized retry affordances. | M | P1 frontend, wait |
| SSE resilience | Server flushes headers and an initial comment (`lib/sse.ts:11-23`), heartbeats every 25s (`:27-33`), and cleans on close (`:36-39`). Client reconnects after 5s on error (`hooks/use-sse-alerts.ts:49-52`). | JWT travels in query string because EventSource cannot set headers (`routes/events.ts:14-18`, `hooks/use-sse-alerts.ts:28-31`), which can leak via logs. Reconnect has no exponential backoff/jitter and no cleanup guard for pending timeouts. No last-event-id replay. | Prefer cookie-authenticated SSE after refresh-token work. Add exponential backoff with jitter, clear pending reconnects on unmount, cap retries with UI state, send event IDs, support `Last-Event-ID`, and add connected-client metrics. | M | P1 |
| Audit chain resilience | `writeAudit` serializes writers with `pg_advisory_xact_lock` inside a transaction and orders by id (`lib/audit.ts:64-76`). Hash canonicalization handles jsonb key order and float precision (`:35-60`). | Design is sound for concurrency, but audit write failures are swallowed with `console.error` (`:113-117`), so critical audit loss could go unnoticed. No retry/dead-letter path. | Keep advisory lock. Replace `console.error` with pino and metrics; add an audit-failure counter/alert, optional outbox/dead-letter table, and admin verifier schedule. Consider making selected high-risk audit writes fail-closed. | M | P0/P1 |
| DB readiness/migrations | DB pool is a default `pg.Pool` from `DATABASE_URL` (`lib/db/src/index.ts:10-12`); Drizzle config exists (`lib/db/drizzle.config.ts:8-14`). No migrations folder was present in `lib/db`. | Unknown pool sizing/timeouts; schema drift risk; deploys may start before migrations; readiness cannot report migration state. | Add explicit pool config (`max`, timeouts, SSL mode), migration generation/application workflow, CI migration check, and deployment step that runs migrations before new app instances become ready. | M | P0 |
| CI/CD | GitHub Actions typechecks API, runs API tests, and Docker-builds API (`.github/workflows/*:1-43`). Frontend Next config ignores TS/ESLint build errors (`artifacts/sanad/next.config.ts:4-9`). | CI does not build Next app, typecheck all artifacts, enforce lint, run migrations, or scan secrets. Ignoring frontend build errors can hide production breakage. Known `.next` contention footgun can affect local builds while dev server is running. | Add gates: root `pnpm typecheck`, API tests with coverage, Next build in clean CI, no ignored build errors for production, Drizzle migration check, Docker image scan, env/secrets validation, and a local release checklist that stops dev server/removes `.next` before build. | M-L | P0/P1 |
| Security headers/CORS | Helmet configured with CSP/HSTS (`app.ts:18-35`); CORS allowlist with credentials is present (`app.ts:41-61`). | API CSP may not protect Next pages; Next frontend lacks explicit security headers in `next.config.ts`. `connectSrc: 'self'` could be too narrow if API origin differs in production. | Define production origins once, validate at startup, set Next security headers, and align CSP/connect-src with deployed API/SSE domains. | S-M | P1 |
| Shutdown/draining | HTTP server handles SIGTERM/SIGINT and force-exits after 15s (`index.ts:18-31`). | DB pool and SSE clients are not explicitly drained; readiness does not flip false during shutdown. | On shutdown, mark readiness false, close SSE responses, close HTTP server, then `pool.end()` with timeout. | S-M | P1 |

## Sequenced Hardening Roadmap

P0, safe backend branch now:

1. Split `/api/livez` and `/api/readyz`; keep `/api/healthz` as summary.
2. Add migration strategy and deploy-time migration gate; expose migration/build version in readiness.
3. Fix request correlation so the same `X-Request-ID` is used in response headers and pino logs.
4. Add audit failure logging/metrics and alerting.
5. Lock production auth posture: disable hardcoded demo credentials in production and design the refresh/session schema.
6. Add CI gates for root typecheck, API tests, API Docker build, and clean Next build without ignored production errors.

P0, wait for localization merge:

1. Add localized App Router `global-error.tsx`, `error.tsx`, and route `loading.tsx` patterns.
2. Add standardized localized `ErrorState`, `LoadingState`, and `EmptyState` primitives.

P1, backend branch can run in parallel:

1. Implement refresh-token rotation, revocation, logout blacklist/session invalidation, and short-lived access tokens.
2. Add Prometheus/OpenTelemetry metrics and a minimal dashboard: request rate/error/latency, DB latency/pool, auth failures, rate-limit hits, SSE connections, audit failures, AI latency.
3. Harden SSE with cookie auth, exponential backoff, event IDs, and replay behavior.
4. Add DB pool tuning and graceful shutdown pool draining.
5. Add production security headers for the Next app and validate allowed origins at startup.

P1, wait for localization merge:

1. Centralize React Query retry/backoff and token-expiry UX.
2. Add localized API error mapping with request ID display for support.

P2:

1. Add synthetic checks for login, health, SSE connection, and critical portal flows.
2. Add scheduled audit-chain verification and alerting.
3. Add release checklist automation: env validation, migration dry-run, test/build, Docker scan, deploy, readiness check, smoke test, rollback criteria.

## Parallelization Rule

Do after localization merges: all frontend error-boundary and UI-state work, plus any design-system edits. Safe to start in parallel on a separate backend branch: auth/session design, observability, health checks, migrations/CI, SSE server hardening, audit reliability, and deployment checklist work, as long as no frontend shared/screen files are edited.
