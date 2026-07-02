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

### TASK-002 · Unit tests for ai-settings crypto+cache — IN-PROGRESS(claude-lead: file written, run pending terminal availability)
File: `artifacts/api-server/src/lib/ai-settings.test.ts` (vitest, NO DB — test pure parts):
encryptSecret/decryptSecret roundtrip; tampered ciphertext throws; maskKey short/long;
PROVIDER_PRESETS completeness (3 providers have baseUrl+defaultModel).
**Acceptance**: `pnpm --filter @workspace/api-server test` green (24+new).

### TASK-003 · Ownership assertions for ai-settings — IN-PROGRESS(claude-lead: 5 assertions
written incl. ai-control 403 + no-key-leak regex; gate run pending terminal availability)

### TASK-004 · Demo dry-run checklist execution — OPEN (any agent with browser)
Run the manual browser flow list in 07-TESTING-VERIFY §Manual. Record per-portal PASS/FAIL
with screenshots in WORKLOG. Any FAIL → file as new task immediately.

## P1 — high value if time remains

### TASK-005 · Arabic labels for Data Sovereignty classification — DONE(claude-lead)
`/api/admin/compliance` returns English `class`/`examples`. Add a client-side AR mapping in
ComplianceDashboard (admin.tsx) keyed on `class`, fallback to English. Do NOT change the API.
**Acceptance**: Arabic locale shows Arabic class names; English unchanged; tsc clean.

### TASK-006 · Rate-limit + audit ai-settings/test — OPEN
Testing keys fires paid API calls. Add express-rate-limit (e.g. 5/min per user) on
POST /api/admin/ai-settings/test + writeAudit action UPDATE what="AI settings test".
**Acceptance**: 6th rapid call → 429; audit rows appear; gate green.

### TASK-007 · AI Brain status pill on admin Dashboard tab — DONE(claude-lead)
Small indicator near KPIs: Demo Mode (warning) vs `provider · model` (success), data from
GET /ai-settings (React Query, 60s refetch). Reuse AiBrainCard chip styling.
**Acceptance**: pill reflects state changes after save/remove without reload (invalidate query).

### TASK-008 · Provider label surfaced in doctor narrative UI — DONE(pre-existing)
Verified: doctor.tsx already captures `provider` from SSE chunks (narrativeProvider state)
and renders it in the AI-narrative header caption (~L1796). No change needed.

## P2 — completed 2026-07-02 (wave 1 wrap-up)

- TASK-009 · DONE(gemini + lead fix) — narrative transcript persisted to ai_decisions.details
  via ?decisionId=; lead added patient-scoping so a caller can't write to a foreign decision row.
- TASK-010 · PARTIAL — users API PUT /:id/status audited + status in registry (gemini);
  admin UI toggles still demo-local → finish in TASK-017.
- TASK-011 · DONE(gemini) — expires_at enforced in getConsentState/getConsentStateBulk.
- TASK-012 · DONE(gemini) — S8 supply-chain assertions in scenario harness (50 total now).
- TASK-013 · DONE(gemini) — Playwright smoke as gate step 6/6 (4 portal logins).
- TASK-001 · DONE(gemini) — drizzle push applied (system_settings + ai_decisions.details live
  in Neon; evidenced by green gate through those code paths).

## Wave 2 — bigger tasks (set 2026-07-02, pre-Sunday polish then expansion)

### TASK-014 · Region switcher rollout to remaining portals — OPEN
useRegionStore is live in admin/citizen/doctor/supply-chain. Extend to pharmacy, insurance,
lab, hospital, emergency: ID labels, currency (insurance claim amounts), ministry naming in
headers. Same bilingual rule: text(configEn, configAr). **Acceptance**: switching region in
admin re-brands every portal after reload; both locales correct; tsc clean; gate green.

### TASK-015 · Login screen region branding — OPEN
Login page shows region flag + countryName + ministryName from useRegionStore (bilingual).
GENERIC region shows the neutral globe branding. **Acceptance**: switcher effect visible
pre-login; no layout shift; RTL safe.

### TASK-016 · Narrative replay in doctor UI — OPEN
Doctor AI tab: if the current decision has details.narrative, offer "عرض آخر ملخص محفوظ /
Show last saved summary" (instant, no stream) with regenerate button. Uses TASK-009 data.
**Acceptance**: saved narrative renders instantly; regenerate still streams; provider caption kept.

### TASK-017 · Real user enable/disable from Admin UI — OPEN
Wire the User Registry toggles to PUT /api/users/:id/status (exists, audited). Revoked user
gets 401 within 60s (status cache). Remove the "Demo Mode" badge from that tab. Add ownership
assertions: revoked doctor token → 401; re-enable → 200 again. **Acceptance**: end-to-end
disable/enable demo-able live; assertions green.

### TASK-018 · Insurance claim amounts region-currency — OPEN (part of 014, callable separately)

## Recently completed (wave 1) — for reviewer reference
All of P0/P1 (TASK-001…008) + P2 above: see WORKLOG entries of 2026-07-02.

## Explicitly OUT of scope for sub-agents (owner/lead only)

- Pushing to any remote; credential rotation; `.env` edits.
- drizzle-kit push against Neon (TASK-001 pattern — owner authorizes).
- Dependency upgrades; pnpm-workspace/catalog changes.
- verify-and-publish.ps1, seed.ts scenario data, middlewares/auth.ts, **lib/audit.ts (Isnād
  chain — synchronous transactional writes are a hard requirement; queueing/batching breaks
  S3/S5 and loses entries on crash)** — unless a task names them.
- SANAD_VIDEO/ production docs (separate track, owner-directed).
