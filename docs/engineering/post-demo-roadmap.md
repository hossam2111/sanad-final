# SANAD Health — Post-Demo Production Roadmap

**Author:** Gemini (Docs/Analysis Agent)
**Date:** 2026-06-15
**Context:** This document outlines the execution roadmap for the phase immediately following the Demo Localization and Backend Hardening workstreams. It identifies architectural gaps, technical debt, and missing operational requirements needed before SANAD can be deployed to production under Saudi PDPL compliance.

---

## A. Production Readiness Matrix

| Item | Priority | Effort | Risk if Ignored | Recommended Owner |
|---|---|---|---|---|
| **Redis Pub/Sub for SSE** | P0 | Medium | **High:** In-memory SSE Map breaks under horizontal scaling (multiple API replicas). Clients won't receive events if connected to the wrong node. | Backend / Infrastructure |
| **Prometheus Metrics Export** | P0 | Low | **High:** Lack of real-time monitoring; cannot auto-scale (HPA) without standard metrics. | Backend |
| **Terraform IaC (VPC, K8s, RDS)** | P0 | High | **High:** Manual infrastructure provisioning leads to configuration drift and deployment failures. | DevOps |
| **Migration Job / Init Container** | P0 | Medium | **High:** Using `drizzle-kit push` in production causes destructive schema drifts. Need formal migration runner. | Backend / DevOps |
| **OpenTelemetry (APM & Tracing)** | P1 | Medium | **Medium:** Inability to trace latency bottlenecks between API, AI services, and Postgres. | Backend |
| **Immutable Audit Log Archiving** | P1 | Medium | **High:** PDPL violation if local DB size is exceeded or corrupted. Needs sync to WORM storage (e.g. S3 Object Lock). | Data Engineering |
| **Background Job Queue (BullMQ)** | P1 | High | **Medium:** Heavy AI inference or batch report generation will block Node.js event loop causing API timeouts. | Backend |
| **Secret Management (Vault/KMS)** | P1 | Medium | **High:** `JWT_SECRET` as env var is a security risk. Needs dynamic retrieval and rotation mechanism. | Security / DevOps |
| **Point-in-Time Recovery (PITR)** | P1 | Low | **High:** Data loss in case of DB corruption. Needs WAL archiving and automated snapshots. | DBA / DevOps |
| **Log Shipper (FluentBit/Datadog)**| P1 | Low | **Medium:** `pino` JSON logs are ephemeral. Need to be shipped to a centralized dashboard (ELK/Datadog). | DevOps |
| **PgBouncer / RDS Proxy** | P2 | Medium | **Low:** Node.js connection pooling is added, but at scale, a centralized connection proxy is required to prevent DB exhaustion. | DBA / DevOps |
| **WAF & DDoS Protection** | P2 | Low | **Medium:** API endpoints exposed to public internet without rate-limiting at the edge. | Infrastructure |

---

## B. Technical Debt Matrix

| Area | Technical Debt Item | Impact | Priority |
|---|---|---|---|
| **Database** | Missing formal migration files (schema history). Currently relies on `push`. | Cannot safely rollback schema changes; breaks CI/CD pipeline verification. | P0 |
| **Architecture** | In-memory SSE connections (`const clients = new Map()`). | Prevents horizontal scaling of the API servers. | P0 |
| **Security** | Hardcoded/Env-driven long-lived JWT secrets. | If leaked, all sessions are compromised. No rotation mechanism exists. | P1 |
| **Performance** | AI Engine and Decision Engine execute synchronously within HTTP request cycle. | Long-running queries will timeout the API Gateway and degrade UX. | P1 |
| **Testing** | Missing integration test coverage for Audit Chain integrity and external AI endpoints. | Risk of breaking the cryptographic Isnād chain without noticing. | P1 |
| **CI/CD** | Docker build step has `push: false`. No deployment automation to Staging/Production. | Manual deployments increase human error and downtime risk. | P1 |
| **Performance** | Missing caching layer (e.g., Redis) for frequent queries (e.g., Clinical Guidelines, Drug Interactions). | High database and AI API costs; slower response times. | P2 |

---

## C. Execution Roadmap

### Phase 1: Next Sprint (Architecture Remediation & Debt)
*Immediate focus on removing horizontal scaling blockers and stabilizing data.*

- **Backend:** Replace in-memory SSE Map with Redis Pub/Sub adapter.
- **Backend:** Generate baseline Drizzle migration files and implement a migration check in CI.
- **Backend:** Decouple heavy AI Engine tasks into a background worker queue (e.g., BullMQ) and return job IDs (Long Polling / Webhooks).
- **Backend:** Add Prometheus `/metrics` endpoint for `pino` and custom health metrics.

### Phase 2: Later Sprint (Observability & Security)
*Focus on production visibility and compliance.*

- **DevOps:** Setup Log Shipping (FluentBit) to centralized storage.
- **Backend:** Instrument Express, Drizzle, and AI calls with OpenTelemetry.
- **Security:** Integrate Key Management Service (AWS KMS or Azure KeyVault) for JWT and DB credentials.
- **Data Eng:** Implement background cron job to sync cryptographic audit logs to immutable cold storage.

### Phase 3: Production Launch Sprint (Infra & Reliability)
*Focus on deployment, high availability, and disaster recovery.*

- **DevOps:** Write Terraform modules for Multi-AZ VPC, EKS/ECS, and RDS PostgreSQL with PgBouncer.
- **DevOps:** Configure automated DB snapshots and WAL archiving (PITR).
- **DevOps:** Complete the GitHub Actions CD pipeline (push to ECR/ACR, apply K8s manifests, run migration init container).
- **Security:** Deploy WAF rules, API Gateway rate limiting, and conduct final penetration testing.
- **QA:** Run k6 load tests against horizontal replicas.
