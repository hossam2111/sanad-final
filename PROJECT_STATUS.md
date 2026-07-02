# PROJECT STATUS — SANAD Platform
# حالة المشروع — منصة سند

> **Handoff file**: any AI model (Codex / Gemini / Claude / other) resuming work MUST read this
> file + `speckit/README.md` first. Update this file whenever a step completes or starts.
> **آخر تحديث:** 2026-07-02 · **الموعد الحرج: اجتماع وزارة الصحة — الأحد 2026-07-05**

---

## 1) Where we are — الوضع الحالي

**Quality gate: ALL GREEN (2026-07-02)** — 46/46 scenario + 42/42 ownership + 24/24 unit +
TypeScript clean in all 3 packages + seed OK. The platform is demo-ready except the ONE
blocked item below.

**⛔ Single blocking item — needs the OWNER (Hossam) to run one command:**

```powershell
# from repo root (creates the new system_settings table in Neon — additive, no data touched)
pnpm --filter "@workspace/db" push
```

Until then: the new AI Brain card works read-only (shows env/demo status); saving a key
returns a graceful 503 NOT_MIGRATED. Everything else on the platform is unaffected.

---

## 2) Completed steps — الخطوات المكتملة

| # | Step | Evidence |
|---|------|----------|
| 1 | Monorepo platform: 12 portals, Express 5 API, Neon PostgreSQL, 17-table schema | repo + verify gate |
| 2 | Auth: JWT + 12-role RBAC + 60s revocation cache; ownership/BOLA guards; hospital scoping | 42/42 ownership tests |
| 3 | Isnād tamper-evident audit chain + verify endpoint + CSV export | S5 assertions |
| 4 | Consent framework (5 types) with immediate revocation (insurance/family gates) | S4/S4b/S6 |
| 5 | Clinical decision engine (Priority Index 0–100, why-factors, digital twin) + 24 unit tests | S1 |
| 6 | Drug interaction DB expanded to 30+ classes, bidirectional | S2/S2b, commit b749c02 |
| 7 | LLM clinical narrative + Q&A (SSE streaming, AR/EN auto, Demo-Mode fallback) | doctor portal AI tab |
| 8 | 7 seeded demo scenarios (50 patients, Al-Ghamdi household) + DEMO_RUNBOOK (fixed step 9) | commit 16909ca |
| 9 | Admin Control Center 8 tabs incl. **Data Sovereignty (PDPL)** tab + compliance endpoint | commit fa575bf + field-mismatch fix |
| 10 | **AI Brain runtime key management** — encrypted (AES-256-GCM) provider/model/key via Admin → Maintenance; endpoints GET/PUT/DELETE/test; claude-brain refactored to dynamic provider resolution (DB → env → demo); removed false 503 env-gates on /narrative & /chat | this session |
| 11 | verify-and-publish.ps1 hardened (PS 5.1 stderr-warning crash fixed) | this session |
| 12 | **SpecKit** — complete implementation spec for external agents (`speckit/` 10 files) | this session |
| 13 | Presentation HTML: KSA/UAE/Qatar comparison + "intelligence layer" positioning | commit df0bfda |
| 14 | Git hygiene: .env scrubbed from history; auth status-check hardening | commit d6abea6 |

## 3) Current step — الخطوة الحالية (غير مكتملة)

**Ministry-demo hardening sprint (P0 tasks in `speckit/09-ROADMAP-TASKS.md`):**
- TASK-001 migration — ⛔ owner command above.
- TASK-002 ai-settings unit tests — OPEN.
- TASK-003 ai-settings ownership assertions — OPEN.
- TASK-004 full manual browser dry-run of the 8-min demo flow — OPEN.

## 4) Remaining steps — الخطوات المتبقية

Ordered backlog with acceptance criteria lives in **`speckit/09-ROADMAP-TASKS.md`**
(P0 → P2). Summary: P1 = Arabic labels for sovereignty classes, rate-limit key-test endpoint,
AI-status pill on dashboard, provider label in doctor UI. P2 = narrative persistence, real
user enable/disable, consent expiry sweep, supply-chain S8 scenario, Playwright smoke.

## 5) Unpushed commits — كوميتات غير مدفوعة (بانتظار إذن المالك)

`git log sanad-final/main..HEAD` at last update:
- (new) speckit + PROJECT_STATUS + AI Brain + verify fix ← this session's commits
- 16909ca fix(runbook) · fa575bf feat(admin) Data Sovereignty · b749c02 feat(ai-engine) ·
  df0bfda feat(presentation) UAE · d6abea6 fix(auth)

Push (owner only): `git push -u sanad-final main`

## 6) Rules for whoever picks this up — قواعد لمن يستكمل

1. اقرأ `speckit/README.md` ثم الملف المطابق لمهمتك. Read speckit first.
2. مهمة واحدة = كوميت واحد + سطر في `speckit/WORKLOG.md`. One task, one commit, one worklog entry.
3. شغّل بوابة التحقق قبل اعتبار أي شيء منجزاً: `.\verify-and-publish.ps1 -DryRun`
4. ممنوع: الدفع للريموت، تعديل .env، ترقية الاعتماديات، لمس بيانات السيناريوهات.
5. القائد (جلسة Claude في هذا الريبو) يراجع WORKLOG عند العودة — لا تحذف مداخل سابقة.
