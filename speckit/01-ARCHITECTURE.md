# 01 — Architecture & Environment

## Monorepo Layout (pnpm workspaces)

```
sanad_cd_two/
├── artifacts/
│   ├── api-server/          # @workspace/api-server — Express 5 API (port 8080)
│   │   └── src/
│   │       ├── index.ts     # app bootstrap, middleware order, route mounting
│   │       ├── routes/      # one file per domain (see 03-API-SPEC.md)
│   │       ├── middlewares/ # auth.ts (JWT+RBAC), validate.ts (zod), correlation.ts
│   │       └── lib/         # decision-engine, ai-engine (drug interactions),
│   │                        # claude-brain (LLM narrative), ai-settings (runtime key mgmt),
│   │                        # audit (Isnād hash chain), ownership (BOLA guards), sse, logger
│   └── sanad/               # @workspace/sanad — Next.js 15 App Router + React 19 (port 3001)
│       ├── app/             # thin route wrappers only: app/<portal>/page.tsx
│       └── src/
│           ├── screens/     # ALL real UI lives here — one file per portal
│           ├── components/  # layout.tsx, shared.tsx (Card/Badge/Input/Tabs/KpiCard…)
│           ├── contexts/    # language-context.tsx (text(), dir, locale)
│           ├── hooks/       # use-ai-decision.ts etc (React Query wrappers)
│           └── lib/         # api.ts → apiFetch() adds JWT header + base URL
├── lib/db/                  # @workspace/db — Drizzle ORM schema + client
│   ├── src/schema/          # one file per table + index.ts barrel
│   ├── drizzle/             # generated SQL migrations
│   └── drizzle.config.ts    # drizzle-kit config (needs DATABASE_URL)
├── packages/api-zod/        # @workspace/api-zod — shared zod schemas (request validation)
├── scripts/
│   ├── src/seed.ts          # THE demo dataset — 50 patients, 7 scenarios (S1–S7)
│   └── harnesses/           # scenario-tests.mjs (46), ownership-tests.mjs (42)
├── speckit/                 # ← you are here
├── DEMO_RUNBOOK.md          # demo credentials + 8-min flow + presentation notes
├── PROJECT_STATUS.md        # live handoff state
├── verify-and-publish.ps1   # THE quality gate (PowerShell 5.1)
└── .env                     # DATABASE_URL, JWT_SECRET, OPENAI_API_KEY, GEMINI_API_KEY (gitignored)
```

## Stack Versions

- Node 22+, pnpm 9 (workspaces + catalog). `autoInstallPeers: false` — see gotcha #1.
- Express **5** (async handlers supported natively), pino logging, helmet, express-rate-limit.
- Next.js 15 App Router, React **19**, Tailwind CSS, recharts, lucide-react, @tanstack/react-query v5.
- Drizzle ORM 0.45.x + node-postgres (`pg`) against **Neon** serverless PostgreSQL.
- Zod (via catalog) for request validation, vitest for unit tests.

## Run Commands

```bash
pnpm install                              # root install
pnpm dev                                  # both servers (api :8080, web :3001)
pnpm --filter "@workspace/api-server" dev # api only
pnpm --filter "@workspace/sanad" dev      # web only
pnpm --filter "@workspace/scripts" seed   # reseed demo data (idempotent, ~20s)
pnpm --filter "@workspace/db" push        # drizzle-kit push schema to Neon (DESTRUCTIVE-capable — confirm prompts)
pnpm --filter "@workspace/api-server" test # vitest unit tests (24 tests, decision-engine)
```

## Environment Variables (.env at repo root)

| Var | Required | Notes |
|-----|----------|-------|
| `DATABASE_URL` | yes | Neon pooled connection string. Connection timeout raised to 15s (cold boots). |
| `JWT_SECRET` | yes | ≥64 chars. Also derives the AES key for AI-settings encryption. **Changing it invalidates saved AI keys.** |
| `OPENAI_API_KEY` | no | Legacy fallback path. Admin-panel key (DB) takes priority. |
| `GEMINI_API_KEY` | no | Legacy fallback path. |
| `PORT` | no | api-server default 8080. |

## Critical Gotchas (violating these wastes hours)

1. **Dual drizzle-orm resolution**: `autoInstallPeers: false` means any workspace package importing
   `drizzle-orm` MUST also declare `pg` + `@types/pg` in its own package.json, or pnpm resolves a
   second drizzle-orm instance and you get ~500 bogus type errors. api-server already does this.
2. **lib/db is a TypeScript composite project** (`composite: true`, `emitDeclarationOnly`).
   After ANY schema change run `cd lib/db && npx tsc -p tsconfig.json` or dependent packages
   read stale `.d.ts` from `dist/` and "table not found" type errors appear.
3. **Windows PowerShell 5.1**: no `&&`/`||` chaining; native stderr under
   `$ErrorActionPreference="Stop"` becomes fatal (verify script wraps seed in `cmd /c … 2>&1` for this).
4. **Never run `next build` while the dev server holds `.next`** — corrupts the build dir.
5. **Neon cold start**: first query after ~5 min idle can ECONNRESET. ALWAYS seed before
   demos/tests (warms pool). The verify gate seeds automatically — never pass `-SkipSeed`.
6. **Remote is `sanad-final`** (github.com/hossam2111/sanad-final.git). `origin` may not exist.
   Pushing needs owner authorization — commit locally only.
7. **Express 5 wildcard routes**: `app.use("/api", authMiddleware)` — `req.path` inside middleware
   is relative to the mount (`/patients/1`, not `/api/patients/1`). ROLE_PERMISSIONS matching
   re-prefixes with `/api`.

## Middleware Order (api-server/src/index.ts)

helmet → cors → compression → cookie-parser → pino-http (correlation id) → rate limit →
`/api` auth middleware (JWT + role + user-status cache) → routers → error handler.
Health endpoints (`/healthz`, `/livez`, `/readyz`), `/auth/login`, `/auth/refresh`,
`/events/stream` bypass auth (see auth.ts allowlist).
