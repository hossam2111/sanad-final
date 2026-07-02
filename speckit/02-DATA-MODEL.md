# 02 — Data Model (Drizzle / PostgreSQL)

Schema lives in `lib/db/src/schema/` — one file per table, re-exported from `index.ts`.
Import in api-server as: `import { patientsTable } from "@workspace/db/schema"` and
`import { db } from "@workspace/db"`.

## Tables (17)

### patients — the core registry
| column | type | notes |
|--------|------|-------|
| id | serial PK | internal id — used in all FKs |
| national_id | text UNIQUE | Saudi national ID (10 digits, demo range 1000000001–1000000050) |
| full_name | text | Arabic names in demo data |
| date_of_birth | date | age derived, never stored |
| gender | text enum male/female | |
| blood_type | text | e.g. "O+" |
| hospital_id | varchar | scoping — doctors only see their hospital's patients (KAMC-RYD etc.) |
| phone, emergency_contact, emergency_phone | text | |
| chronic_conditions | text[] | e.g. `{Type 2 Diabetes,Hypertension}` |
| allergies | text[] | |
| risk_score | integer 0–100 | Clinical Priority Index — recomputed by decision engine |
| created_at, updated_at | timestamp | |

### users — login accounts (12 demo users, one per role)
id (varchar 36 UUID PK), national_id (unique), full_name, role, hospital_id,
password_hash (bcrypt), **status** ('active'|'revoked' — auth middleware checks this with a
60s cache → revoking a user kills their tokens within a minute), created_at, updated_at.

### medications
id PK, patient_id FK→patients, drug_name, dosage, frequency, prescribed_by, hospital,
start_date, end_date, is_active bool, notes, created_at.
Drug names are lowercase-matched against the interaction DB (05-AI-ENGINE.md).

### visits
id PK, patient_id FK, visit_date (date), hospital, department, doctor, diagnosis,
notes, visit_type enum (outpatient|emergency|follow-up|admission), created_at.

### lab_results
id PK, patient_id FK, test_name, test_date, result (text — numeric as string), unit,
reference_range, status enum (normal|abnormal|critical), hospital, notes, created_at.

### alerts
id PK, patient_id FK, alert_type (drug-interaction|critical-lab|risk-escalation|…),
severity (info|warning|critical), title, message, is_read bool, created_at.

### ai_decisions — every decision-engine run is persisted
id PK, patient_id FK, risk_score int, risk_level, urgency, primary_action, time_window,
why_factors jsonb, confidence real, source (default 'clinical_rules'), recommendations jsonb,
digital_twin_projection jsonb, behavioral_flags jsonb, created_at.

### audit_log — Isnād tamper-evident chain
id PK, who, who_name, who_role, action (see AuditAction union in lib/audit.ts),
what, patient_id, details jsonb, ai_decision_id, confidence, **hash** (SHA-256 chained to
previous row — verify endpoint recomputes the whole chain), created_at.
**Append-only. Never UPDATE/DELETE rows in this table.**

### consent_records
id PK, patient_id FK, consent_type (emergency_access|clinical_sharing|insurance_sharing|
family_linking|research_anonymized), purpose, granted_to, granted bool, expires_at,
revoked_at, granted_at, updated_at, ip_address, user_agent, notes.
Consent gates are enforced in routes (insurance.ts, family.ts) — revocation is immediate.

### appointments
id PK, patient_id FK, patient_name, patient_national_id, hospital, department, service,
appointment_date (text YYYY-MM-DD), appointment_time (text HH:mm), status
(confirmed|cancelled|completed), reference_no (server-issued `APT-YYYY-NNNNN`), notes,
cancelled_at, completed_at, created_at, updated_at.

### family_relationships — household graph
id PK, patient_id FK→patients, relative_id FK→patients, relationship_type
(parent|child|spouse|sibling…), created_at. Bidirectional edges seeded both ways.

### claim_reviews — insurance workflow state
id PK, claim_id text UNIQUE, status (approved|denied|flagged|pending_info),
reviewed_by, reviewed_at, notes, ai_reason, created_at.

### purchase_orders — supply chain
id text PK (`PO-…`), drug_name, quantity, supplier, status
(pending_approval|approved|rejected|delivered), requested_by, estimated_delivery,
total_value, created_at, updated_at.

### ai_retrain_jobs — AI-control portal job simulation
id text PK, engine, status (queued|running|completed|failed), progress int,
triggered_by, started_at, completed_at, created_at.

### staff_assignments — doctor↔hospital scoping
username, hospital_id (varchar). Used by hospital scoping joins.

### events — SSE event feed persistence
id PK, event_type, patient_id FK nullable, payload jsonb, processed_at, ai_decision_id, source.

### system_settings — runtime key-value config (NEW)
key text PK, value text (JSON), updated_by, updated_at.
Currently holds `ai_brain` = `{provider, model, encryptedKey (AES-256-GCM), baseUrl}`.
**Deliberately NOT in the seed truncate list — survives demo resets.**

## Changing the Schema — Required Procedure

1. Create/modify `lib/db/src/schema/<table>.ts`; export from `index.ts`.
2. `cd lib/db && npx tsc -p tsconfig.json` ← rebuild the composite `.d.ts` (MANDATORY).
3. Apply to DB: `pnpm --filter "@workspace/db" push` (needs DATABASE_URL in env; interactive
   confirm on destructive changes — read the prompt carefully).
4. If demo data should include the table: extend `scripts/src/seed.ts`
   (add to TRUNCATE list ONLY if the data is demo-resettable — settings/users are NOT).
5. Typecheck api-server, run the verify gate.
