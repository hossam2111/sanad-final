# 07 — Testing & The Verify Gate

**Nothing is "done" until the full gate passes.** The gate is the review currency between
agents: paste its tail output into speckit/WORKLOG.md with your task entry.

## The gate

```powershell
# From repo root, with the api server ALREADY running on :8080 (pnpm dev)
.\verify-and-publish.ps1 -DryRun
```

Steps: (1) .env credential sanity → (2) API liveness :8080 → (3) **seed** (never skip — warms
Neon; PS 5.1 note: seed is invoked via `cmd /c … 2>&1` because pg's SSL-mode stderr warning
would otherwise kill the script under ErrorActionPreference=Stop) → (4) scenario-tests
46 assertions → (5) ownership-tests 42 assertions.

Expected final state: `ALL CHECKS PASSED` + `46 passed, 0 failed` + `4x passed, 0 failed`.
-DryRun only suppresses the final push commands — always use it; pushing is owner-only.

## Test layers

| Layer | Where | Count | Run |
|-------|-------|-------|-----|
| Unit (decision engine) | api-server/src/lib/decision-engine.test.ts | 24 | `pnpm --filter @workspace/api-server test` |
| Scenario S1–S7 + JWT | scripts/harnesses/scenario-tests.mjs | 46 | via gate or `node scripts/harnesses/scenario-tests.mjs` |
| Ownership/BOLA + scoping | scripts/harnesses/ownership-tests.mjs | 42 | via gate or direct node |
| TypeScript | 3 packages | — | see README rule #4 |

## The seven scenarios (seed-engineered patients — DO NOT break them)

| S | Patient (national id) | What must keep working |
|---|----------------------|------------------------|
| S1 | محمد الغامدي 1000000001 | risk 95, CRITICAL, IMMEDIATE, rapidly-worsening twin, ≥4 why-factors, HbA1c prediction |
| S2 | خالد الغامدي 1000000003 | warfarin interactions: +metronidazole HIGH blocked, +ciprofloxacin MODERATE; pharmacy dispense server ref |
| S2b | سارة العتيبي 1000000006 | tramadol+fluoxetine CRITICAL serotonin syndrome |
| S3 | خالد 1000000003 | break-glass: blood type, allergies, DO_NOT_GIVE, warfarin+amiodarone URGENT_REVIEW, audit entry |
| S4 | محمد 1000000001 | consent lifecycle: research opt-in, insurance revoke → insurer 403 → re-grant restores |
| S4b | لطيفة الحربي 1000000008 | revoked insurance consent → 403 |
| S5 | (national view) | 50 patients, live KPIs, audit chain verifies, de-identified export |
| S6 | Al-Ghamdi household | family consent gate, masked relative IDs, hereditary risk, سعاد → 403 |
| S7 | سعد العنزي 1000000007 | fraud engine flags HIGH (4 ER/4 hospitals); normal patient does NOT flag |

If your change breaks an assertion: fix your change, or (only if the task explicitly changes
behavior) update the harness AND note it in WORKLOG.

## Seed (scripts/src/seed.ts)

- Idempotent: TRUNCATE … RESTART IDENTITY on: audit_log, events, ai_decisions, alerts,
  lab_results, visits, medications, consent_records, appointments, claim_reviews,
  purchase_orders, patients, family_relationships.
- **NOT truncated (must survive reset)**: users, staff_assignments, system_settings.
- 50 patients (ids 1–50, national 1000000001–1000000050), Al-Ghamdi household wired via
  family_relationships, hospital scoping (KAMC-RYD → dr.rashidi sees 18).
- Reseed anytime: `pnpm --filter "@workspace/scripts" seed`.

## Manual browser flows (before demos)

With `pnpm dev` up: login each portal from DEMO_RUNBOOK credentials; the three scripted flows
(doctor/citizen/family) live under `%TEMP%\sanad-shots\*.mjs` if present. Minimum manual pass:
admin 8 tabs render → doctor patient 1000000001 CRITICAL → interaction check metronidazole on
1000000003 → citizen consent toggle → family محمد ok/سعاد 403 → Data Sovereignty tab loads →
AI Brain card shows current status.
