# 09 — Roadmap & Task Backlog

**Deadline context: Ministry of Health meeting SUNDAY 2026-07-05.** Priority = demo readiness.
Pick the highest OPEN task you can complete fully. One task → one commit → WORKLOG entry.
Statuses: OPEN / IN-PROGRESS(agent) / DONE(commit) / BLOCKED(reason).

## P0 — must be done before Sunday

### TASK-001 · Apply system_settings migration to Neon — **BLOCKED (owner action)**
`pnpm --filter "@workspace/db" push` (needs DATABASE_URL; interactive). Owner must run or
explicitly authorize — shared-infra write. Until then the AI Brain card saves return
503 NOT_MIGRATED (graceful). **Acceptance**: PUT /api/admin/ai-settings 200; key survives
`POST /reset-demo`; GET shows source=admin-panel.

### TASK-002 · Unit tests for ai-settings crypto+cache — OPEN
File: `artifacts/api-server/src/lib/ai-settings.test.ts` (vitest, NO DB — test pure parts):
encryptSecret/decryptSecret roundtrip; tampered ciphertext throws; maskKey short/long;
PROVIDER_PRESETS completeness (3 providers have baseUrl+defaultModel).
**Acceptance**: `pnpm --filter @workspace/api-server test` green (24+new).

### TASK-003 · Ownership assertions for ai-settings — OPEN
Extend `scripts/harnesses/ownership-tests.mjs`: admin GET /api/admin/ai-settings → 200 with
maskedKey|null and no full key anywhere in body; doctor → 403; citizen → 403 (blocked at
prefix layer already — assert it stays). **Acceptance**: gate shows new assertions passing.

### TASK-004 · Demo dry-run checklist execution — OPEN (any agent with browser)
Run the manual browser flow list in 07-TESTING-VERIFY §Manual. Record per-portal PASS/FAIL
with screenshots in WORKLOG. Any FAIL → file as new task immediately.

## P1 — high value if time remains

### TASK-005 · Arabic labels for Data Sovereignty classification — OPEN
`/api/admin/compliance` returns English `class`/`examples`. Add a client-side AR mapping in
ComplianceDashboard (admin.tsx) keyed on `class`, fallback to English. Do NOT change the API.
**Acceptance**: Arabic locale shows Arabic class names; English unchanged; tsc clean.

### TASK-006 · Rate-limit + audit ai-settings/test — OPEN
Testing keys fires paid API calls. Add express-rate-limit (e.g. 5/min per user) on
POST /api/admin/ai-settings/test + writeAudit action UPDATE what="AI settings test".
**Acceptance**: 6th rapid call → 429; audit rows appear; gate green.

### TASK-007 · AI Brain status pill on admin Dashboard tab — OPEN
Small indicator near KPIs: Demo Mode (warning) vs `provider · model` (success), data from
GET /ai-settings (React Query, 60s refetch). Reuse AiBrainCard chip styling.
**Acceptance**: pill reflects state changes after save/remove without reload (invalidate query).

### TASK-008 · Provider label surfaced in doctor narrative UI — OPEN
SSE chunks carry `provider`. Doctor screen AI tab: show it as a small caption under the
narrative ("Powered by: …"/"مدعوم بواسطة: …"). **Acceptance**: visible in both locales; no layout shift.

## P2 — post-Sunday

- TASK-009 · Persist narrative transcripts to ai_decisions.details for audit replay.
- TASK-010 · Admin UI for users table (real enable/disable → users.status, replacing demo-only toggles) + audit.
- TASK-011 · Consent expiry sweep job (expires_at honored server-side).
- TASK-012 · Supply-chain reorder → purchase_orders end-to-end demo scenario (S8) + assertions.
- TASK-013 · e2e Playwright smoke (login each portal, 1 assertion each) wired into gate as step 6.

## Explicitly OUT of scope for sub-agents (owner/lead only)

- Pushing to any remote; credential rotation; `.env` edits.
- drizzle-kit push against Neon (TASK-001 pattern — owner authorizes).
- Dependency upgrades; pnpm-workspace/catalog changes.
- verify-and-publish.ps1, seed.ts scenario data, middlewares/auth.ts — unless a task names them.
- SANAD_VIDEO/ production docs (separate track, owner-directed).
