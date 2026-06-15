# SANAD Health — Execution Backlog

**Context:** This execution backlog translates the Post-Demo Production Roadmap into actionable items. It is designed to be handed directly to engineering agents (Claude, Codex, etc.) or human engineers for the next implementation phases.

---

## ⚠️ Known Demo-Build Limitations

These are intentional simplifications made for the demo build. They are not bugs in the current context, but must be addressed before any real clinical use.

### L1. Inter-Clinician BOLA Not Enforced (No Institutional Scoping)
* **What it means:** Clinical roles (`doctor`, `emergency`) have read access to any patient record regardless of hospital affiliation. A doctor credentialed at Hospital A can retrieve records for a patient registered at Hospital B.
* **Root cause:** The `patients` table has no `hospitalId` or `assignedDoctor` foreign key. No staff-assignment table exists.
* **Risk:** Violates PDPL data minimization. Would be caught by a real Ministry pen-test.
* **Fix:** Add `hospital_id` to patients + a `patient_assignments` table; scope `requireOwnPatient` to clinical roles via assignment lookup.
* **Recommended owner:** Codex / Backend

### L2. 30 `as any` Casts in Frontend Screens
* **What it means:** API response shapes in `src/screens/*.tsx` are typed as `any`, bypassing TypeScript's type checker at the data boundary.
* **Root cause:** Screens were written against an evolving API without shared response types.
* **Risk:** Silent type mismatches will only surface at runtime; refactors will not produce compile errors.
* **Fix:** Generate a shared `@workspace/api-types` package from route handlers (or use `zod` schemas with `z.infer<>`); replace `as any` with inferred types.
* **Recommended owner:** Codex / Frontend

### L3. Family Portal Uses Numeric ID-Adjacency, Not a Relationship Model
* **What it means:** `family.ts:182` determines household membership by checking `fp.id >= p.id - 3 && fp.id <= p.id + 5` — patients with nearby numeric IDs are treated as relatives.
* **Root cause:** The seed inserts the Al-Ghamdi household as IDs 1–5, making adjacency work for the demo. No `family_relationships` table exists.
* **Risk:** For any real patient population, this logic will return random unrelated patients as "family members."
* **Fix:** Create a `family_relationships(patient_id, relative_id, relationship_type, verified_at)` table; enforce mutual consent before linking.
* **Recommended owner:** Codex / Backend

---

## 🚨 Top 10 Highest-Risk Items if Ignored

1. **In-Memory SSE Map:** Prevents horizontal scaling; clients will disconnect or miss events if multiple API replicas exist.
2. **Missing Formal Migrations:** Using `drizzle-kit push` in production will cause destructive schema drift and data loss.
3. **Hardcoded/Env JWT Secrets:** No rotation mechanism. If leaked, all sessions are compromised indefinitely.
4. **Missing Immutable Audit Logs:** Storing logs only in the primary DB violates PDPL compliance if the DB is tampered with or corrupted.
5. **No Point-in-Time Recovery (PITR):** Complete data loss is possible in the event of database corruption or accidental drop.
6. **Synchronous AI Execution:** Heavy AI queries will block the Node.js event loop and cause API Gateway timeouts at scale.
7. **Missing Terraform IaC:** Manual infrastructure deployment guarantees configuration drift and prevents disaster recovery.
8. **Missing CI/CD Deploy Automation:** Manual deployments increase human error and downtime risk.
9. **Missing Audit Chain Tests:** Without integration tests for the Isnād cryptographic chain, silent breaks could go unnoticed.
10. **No Base Metrics (Prometheus):** Cannot implement Horizontal Pod Autoscaling (HPA) or alert on downtime without metrics.

---

## 🚀 PHASE 1 — BEFORE PILOT (P0)
*Required to safely deploy the system for initial clinical testing and pilot users.*

### 1. Redis Pub/Sub Adapter for SSE
* **Why it matters:** In-memory maps break when scaling beyond 1 Node.js process. Redis Pub/Sub ensures events reach the correct client across any node.
* **Estimated effort:** M
* **Dependencies:** None (requires Redis instance).
* **Recommended owner:** Codex

### 2. Generate Formal Drizzle Migrations & CI Check
* **Why it matters:** Establishes schema history and allows safe rollbacks.
* **Estimated effort:** S
* **Dependencies:** None.
* **Recommended owner:** Codex

### 3. Formal Migration Runner / Init Container
* **Why it matters:** Prevents destructive `drizzle-kit push` commands in production. Ensures the DB schema matches the code before the API boots.
* **Estimated effort:** M
* **Dependencies:** Formal Migrations (Item 2).
* **Recommended owner:** Infrastructure / Operations

### 4. Prometheus Metrics Export
* **Why it matters:** Necessary for basic liveness monitoring and enabling auto-scaling (HPA).
* **Estimated effort:** S
* **Dependencies:** None.
* **Recommended owner:** Codex

### 5. Terraform IaC (VPC, K8s, RDS)
* **Why it matters:** Manual infrastructure provisioning is fragile and cannot be replicated across environments (Staging vs. Prod).
* **Estimated effort:** L
* **Dependencies:** None.
* **Recommended owner:** Infrastructure

---

## 🛡️ PHASE 2 — BEFORE PRODUCTION (P1)
*Required for full national launch, PDPL compliance, and SLA guarantees.*

### 6. Decouple AI Engine Tasks (Background Queue)
* **Why it matters:** Heavy AI inference blocks the HTTP request. Must move to BullMQ (or similar) with job IDs and long polling/webhooks.
* **Estimated effort:** L
* **Dependencies:** Redis instance.
* **Recommended owner:** Codex

### 7. Secret Management Integration (Vault/KMS)
* **Why it matters:** PDPL compliance requires secure key storage and rotation, not static `.env` strings.
* **Estimated effort:** M
* **Dependencies:** Terraform IaC (Item 5).
* **Recommended owner:** Operations / Security

### 8. Immutable Audit Log Archiving
* **Why it matters:** Cryptographic logs must be synced to WORM (Write Once Read Many) storage like S3 Object Lock to guarantee non-repudiation.
* **Estimated effort:** M
* **Dependencies:** AWS/S3 Infrastructure.
* **Recommended owner:** Infrastructure / Codex

### 9. Point-in-Time Recovery (PITR) & Automated Backups
* **Why it matters:** Required for Disaster Recovery (DR) compliance.
* **Estimated effort:** S
* **Dependencies:** Terraform IaC (RDS/Postgres config).
* **Recommended owner:** Operations

### 10. CI/CD Deployment Automation
* **Why it matters:** Automates Docker builds, pushes to ECR/ACR, and applies K8s manifests to eliminate manual deployment errors.
* **Estimated effort:** M
* **Dependencies:** Terraform IaC (Item 5).
* **Recommended owner:** Operations

### 11. Log Shipper (FluentBit/Datadog)
* **Why it matters:** Ephemeral container logs must be aggregated for debugging and security auditing.
* **Estimated effort:** M
* **Dependencies:** None.
* **Recommended owner:** Operations

### 12. OpenTelemetry (APM & Tracing)
* **Why it matters:** Essential for debugging distributed latency across API, AI layers, and the database.
* **Estimated effort:** M
* **Dependencies:** Log Shipper / APM platform.
* **Recommended owner:** Codex

### 13. Integration Test Coverage for Audit Chain & AI
* **Why it matters:** Safeguards the integrity of the Isnād cryptographic chain against future refactoring.
* **Estimated effort:** M
* **Dependencies:** None.
* **Recommended owner:** Codex

---

## 📈 PHASE 3 — SCALE & OPERATIONS (P2)
*Required for handling national-scale traffic, optimization, and edge security.*

### 14. Caching Layer (Redis)
* **Why it matters:** Reduces database and AI API costs by caching frequent queries like clinical guidelines and interactions.
* **Estimated effort:** M
* **Dependencies:** Redis instance.
* **Recommended owner:** Codex

### 15. PgBouncer / RDS Proxy
* **Why it matters:** Prevents database connection exhaustion as the number of API pods scales up.
* **Estimated effort:** M
* **Dependencies:** Terraform IaC (RDS).
* **Recommended owner:** Infrastructure

### 16. WAF & DDoS Protection
* **Why it matters:** Protects the API Gateway from malicious traffic, volumetric attacks, and unauthenticated scraping.
* **Estimated effort:** S
* **Dependencies:** Terraform IaC.
* **Recommended owner:** Operations / Security

### 17. Load Testing (k6) Against Horizontal Replicas
* **Why it matters:** Validates that auto-scaling works, SSE Pub/Sub functions correctly, and database connections don't bottleneck.
* **Estimated effort:** M
* **Dependencies:** All Phase 1 & 2 items.
* **Recommended owner:** QA / Operations
