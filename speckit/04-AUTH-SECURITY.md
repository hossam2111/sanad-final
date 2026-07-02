# 04 — Auth, Roles, Ownership, Audit (Isnād), PDPL

## JWT Flow

- `POST /api/auth/login` — bcrypt check against `users.password_hash` → JWT signed with
  `JWT_SECRET`, payload: `{userId, role, userName, nationalId, username}`.
- `POST /api/auth/refresh` — valid bearer → new token.
- Middleware `middlewares/auth.ts` (mounted on `/api`):
  1. Allowlist bypass: `/healthz /livez /readyz / /events/stream* /auth/login /auth/refresh`.
  2. Verify JWT → extract role → must be in VALID_ROLES (12 roles).
  3. **User-status revocation check**: `users.status` fetched with a 60s in-memory cache
     (`userStatusCache`). status ≠ 'active' → 401 immediately. Deleted user → treated revoked.
     → Admin can kill any session within 60 seconds without waiting for token expiry.
  4. Path-prefix RBAC: `ROLE_PERMISSIONS[role]` — array of `/api/...` prefixes the role may hit.
     Request path re-prefixed with `/api` before matching. No match → 403.
  5. Decorates `req.role, req.userId, req.userName, req.userNationalId, req.username`.

## ROLE_PERMISSIONS matrix (middlewares/auth.ts — keep in sync when adding routes)

| role | allowed path prefixes |
|------|----------------------|
| emergency | /api/emergency /api/patients /api/ai /api/alerts |
| doctor | /api/patients /api/ai /api/lab /api/lab-results /api/medications /api/visits /api/alerts /api/appointments |
| citizen | /api/patients /api/lab-results /api/medications /api/visits /api/appointments /api/consent /api/ai /api/alerts |
| admin | /api/admin /api/patients /api/ai /api/ai-control /api/alerts /api/lab /api/medications /api/visits /api/appointments |
| lab | /api/lab /api/patients /api/lab-results /api/alerts |
| pharmacy | /api/pharmacy /api/patients /api/medications /api/supply-chain /api/alerts |
| hospital | /api/hospital /api/patients /api/visits /api/appointments /api/alerts |
| insurance | /api/insurance /api/patients /api/medications /api/alerts |
| ai-control | /api/ai-control /api/ai /api/admin /api/alerts |
| research | /api/research /api/alerts |
| family | /api/family /api/alerts   ← family NEVER touches /api/patients directly |
| supply-chain | /api/supply-chain /api/medications /api/alerts |

Second layer: most routers start with their own role guard (e.g. admin.ts allows
admin|hospital|ai-control|research; **AI-settings endpoints additionally require role === "admin"**).

## Ownership (lib/ownership.ts) — BOLA protection

- Citizens: `req.userNationalId` must resolve to the SAME patient row as the requested
  `:patientId`/`:nationalId`, on every patient-scoped endpoint INCLUDING /api/ai. Else 403.
- Doctors: hospital scoping — only patients with matching `hospital_id`
  (via staff_assignments). Emergency role bypasses scoping (break-glass, always audited).
- Family: no direct patient access; `/api/family/patient/:nid` checks `family_relationships`
  edge + active `family_linking` consent → else 403 CONSENT_REQUIRED. Relative IDs masked in responses.
- Insurance: gated on `insurance_sharing` consent → 403 CONSENT_REVOKED after revocation (immediate).
- 42 ownership assertions in `scripts/harnesses/ownership-tests.mjs` enforce all of this — run them.

## Isnād Audit Chain (lib/audit.ts)

- `writeAudit({who, whoName, whoRole, action, what, patientId?, details?, ipAddress, userAgent})`.
- Each row's `hash` = SHA-256 over canonical fields + previous row's hash → tamper-evident chain.
- `GET /api/admin/audit-log/verify` recomputes the chain → `{valid}`.
- **ipAddress/userAgent are merged into stored details but EXCLUDED from the hash** — do not
  duplicate them inside `details` or the chain becomes unverifiable.
- AuditAction union: READ CREATE UPDATE DELETE LOGIN LOGOUT LOGIN_FAILED AI_DECISION
  AI_CHAT_QUERY DRUG_CHECK EXPORT PRESCRIBE_MEDICATION CREATE_VISIT CREATE_LAB_RESULT
  CREATE_APPOINTMENT UPDATE_APPOINTMENT.
- Append-only table. NEVER update/delete audit rows.

## Secrets & PDPL Rules

1. `.env` is gitignored; history was scrubbed once already (BFG) — never recommit secrets.
2. AI narrative prompts: patient `nationalId` **must never be included** (PatientContext carries
   it for ownership only; prompt builders omit it). Names/conditions are allowed in the demo.
3. Research endpoints: aggregate SQL only — never load identifiable rows for research/export;
   exports use `ANON-######` ids and age GROUPS.
4. AI Brain API keys: AES-256-GCM encrypted (key derived `sha256("sanad-ai-settings:"+JWT_SECRET)`),
   masked (`sk-1…abcd`) in every response and audit entry. Rotating JWT_SECRET orphans the stored
   key by design (decrypt fails → treated unset → env/demo fallback).
5. Data-residency narrative (compliance endpoint): KSA sovereign cloud, no cross-border — keep
   demo claims consistent with `GET /api/admin/compliance`.
