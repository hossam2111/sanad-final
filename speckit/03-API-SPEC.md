# 03 — API Specification

Base URL: `http://localhost:8080/api`. All endpoints (except auth/health/SSE) require
`Authorization: Bearer <JWT>`. Role access is enforced twice: path-prefix matrix in
`middlewares/auth.ts` + per-router role guards. See 04-AUTH-SECURITY.md.

Response conventions: errors are `{ error: "CODE", message: "human text" }` with proper
HTTP status (400/401/403/404/503). Success shapes vary per endpoint (documented in route files).

## Route Inventory (mount → file)

### /api/auth — auth.ts (public)
- `POST /login` — body `{username, password}` → `{token, user}`. bcrypt against users table. Rate-limited.
- `POST /refresh` — valid bearer → fresh token.

### /api/health — health.ts (public)
- `GET /livez` · `GET /readyz` (DB ping) · `GET /healthz` (version, buildSha, migrationVersion, latency).

### /api/patients — patients.ts (doctor, citizen*, admin, emergency…)
- `GET /` — list/search (`?q=`), hospital-scoped for doctors, self-only for citizens.
- `GET /national/:nationalId` — lookup by national ID (ownership-gated).
- `GET /:id` — by internal id (ownership-gated).
- `POST /` — register patient (clinical roles only; citizens 403).

### /api/medications · /api/visits · /api/lab-results (medications.ts, visits.ts, lab_results.ts)
- `GET /?patientId=` — patient-scoped list (ownership-gated).
- `POST /` — create (clinical roles; writes audited; med names lowercase-matched for interactions).

### /api/ai — ai.ts (doctor, citizen [own record], admin, emergency, ai-control)
- `POST /check-interaction` — body `{patientId, newDrug}` → severity + description + recommendation.
- `GET /risk-score/:patientId` — engine risk (0–100 Clinical Priority Index).
- `GET /predictions/:patientId` — digital-twin 12-month projection.
- `GET /decision/:patientId` — full decision (why-factors, recommendations, urgency, confidence). Persisted to ai_decisions.
- `GET /events/:patientId` · `GET /audit/:patientId` — patient event/audit slices.
- `GET /narrative/:patientId` — **SSE stream** of LLM clinical narrative. Provider resolution:
  admin-panel key → env key → Demo-Mode mock (no gate; always streams something).
- `POST /chat/:patientId` — body `{question}` → single-turn clinical Q&A (same provider resolution).

### /api/emergency — emergency.ts (emergency role)
- `GET /:nationalId` — break-glass retrieval: blood type, allergies, DO_NOT_GIVE list,
  URGENT_REVIEW interactions. Every call writes a BREAK-GLASS audit entry.

### /api/consent — consent.ts (citizen owns; clinical read)
- `GET /patient/:nationalId` — consent profile (ownership-gated).
- `POST /grant` — grant/revoke `{nationalId, consentType, granted}` — immediate effect.
- `GET /definitions` — static consent-type catalog.

### /api/family — family.ts (family role ONLY path to patient data)
- `GET /patient/:nationalId` — household view. Requires patient's `family_linking` consent →
  else 403 CONSENT_REQUIRED. Relatives' national IDs masked. Hereditary risk surfaced.

### /api/insurance — insurance.ts (insurance role)
- `GET /patient/:nationalId` — gated on insurance_sharing consent → 403 CONSENT_REVOKED if revoked.
- `GET /dashboard` — claims + fraud anomaly engine (ER-frequency/hospital-cycling patterns).
- `POST /claim/:claimId/review` — persist review `{status, notes}`.
- `PATCH /claims/:claimId` — update claim state.
- `GET /claims/:claimId/ai-recommendation` — AI review suggestion.

### /api/lab — lab.ts (lab role)
- `GET /patient/:nationalId` — patient labs. `POST /result` — create result (audited; critical
  results raise alerts).

### /api/pharmacy — pharmacy.ts (pharmacy role)
- `GET /patient/:nationalId` — prescriptions + interaction screen.
- `POST /dispense/:medicationId` — dispense; returns SERVER-issued reference; audited.

### /api/hospital — hospital.ts (hospital role)
- `GET /overview` — bed/department ops dashboard data.

### /api/appointments — appointments.ts
- `GET /slots` · `GET /hospitals` · `GET /departments` — booking metadata.
- `GET /patient/:patientId` — patient's appointments (ownership-gated).
- `POST /` — book (citizens: self only). `PATCH /:id/cancel` · `PATCH /:id/complete`.
- `GET /all` — staff/admin only (citizens 403).

### /api/alerts — alerts.ts (all roles read)
- `GET /` — patient alerts. `GET /system` — role-aware: non-clinical roles get identity-REDACTED alerts.
- `PATCH /:id/read` · `PATCH /read-all`.

### /api/admin — admin.ts (admin, hospital, ai-control, research)
- `GET /stats` — national KPIs. `GET /population-health` — burden/regions.
  `GET /intelligence` — policy insights.
- `GET /audit-log` · `GET /audit-feed` (`?role=` filter) · `GET /audit-log/verify` — recompute
  full Isnād hash chain → `{valid: true|false}`.
- `POST /reset-demo` — spawns seed subprocess (90s timeout). Blocked in production env.
- `GET /compliance` — PDPL posture: articlesCovered[{article,status,note}], dataResidency,
  dataClassification[{class,examples,storage,accessControl,retention,auditRequired}],
  auditMetrics, consentFramework. (UI: Admin → Data Sovereignty tab.)
- **AI Brain settings (admin role ONLY — stricter than the router guard):**
  - `GET /ai-settings` → `{configured, source: admin-panel|environment|none, provider, model,
    baseUrl, maskedKey, demoMode, presets}` — key NEVER returned in full.
  - `PUT /ai-settings` — body `{provider: gemini|openai|anthropic|custom, model?, apiKey, baseUrl?}`.
    Key AES-256-GCM encrypted (derived from JWT_SECRET) → system_settings. Audited (masked).
  - `POST /ai-settings/test` — body optional candidate config, else tests effective settings.
    Fires a 10-token completion → `{ok, message, latencyMs}` (502 if failed).
  - `DELETE /ai-settings` — remove saved config → falls back to env/demo. Audited.

### /api/ai-control — ai_control.ts (ai-control, admin)
- `GET /features` · `PATCH /features/:feature` — feature flags.
- `GET /metrics` · `GET /drift-analysis` — model governance data.
- `GET /retrain-jobs` · `POST /retrain-jobs` · `POST /engines/:engineName/retrain` ·
  `GET /retraining/jobs` — retrain job simulation.

### /api/research — research.ts (research, admin, hospital, ai-control)
- `GET /insights` — SQL-aggregated population analytics (NO row-level PHI in memory).
- `GET /export?format=csv|json` — de-identified export (ANON-noted ids, age GROUPS not DOB). Audited EXPORT.

### /api/supply-chain — supply_chain.ts (supply-chain, pharmacy)
- `GET /inventory` · `GET /stock-check/:drugName` · `GET /regional-distribution` ·
  `GET /purchase-orders` · `POST /reorder` · `POST /orders` ·
  `PATCH /orders/:id/approve` · `PATCH /orders/:id/reject`.

### /api/events — events.ts (public SSE)
- `GET /stream` — server-sent events feed. `GET /status`.

### /api/users — users.ts
- `GET /` — user registry for admin UI.

## Adding an Endpoint — Checklist

1. Pick the right route file (or create one + mount in `routes/index.ts` + add path to
   `ROLE_PERMISSIONS` in `middlewares/auth.ts` for every role that may call it).
2. Validate body with zod schema from `@workspace/api-zod` via `validate(schema)` middleware.
3. Ownership: any `:patientId`/`:nationalId` param MUST go through `requireOwnPatient()` /
   ownership helpers (lib/ownership.ts) so citizens/family can't read foreign records.
4. Audit every write + sensitive read via `writeAudit()` — pick correct AuditAction.
5. Add scenario/ownership assertions if the endpoint carries PHI (07-TESTING-VERIFY.md).
