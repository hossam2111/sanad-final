# PROJECT STATUS — SANAD Platform
# حالة المشروع — منصة سند

> **Handoff file**: any AI model (Codex / Gemini / Claude / other) resuming work MUST read this
> file + `speckit/README.md` first. Update this file whenever a step completes or starts.
> **آخر تحديث:** 2026-07-02 · **الموعد الحرج: اجتماع وزارة الصحة — الأحد 2026-07-05**

---

## 1) Where we are — الوضع الحالي

**Quality gate: ALL GREEN (2026-07-02 06:20)** — 50/50 scenario (incl. new S8 supply-chain)
+ 48/48 ownership (incl. AI-settings admin-only) + 4/4 Playwright smoke + 34/34 unit +
TypeScript clean ×3 packages. **No blocking items — DB fully migrated** (system_settings +
ai_decisions.details are live in Neon; the previous TASK-001 blocker is resolved).

**Platform is Ministry-demo ready.** New since last update: AI Brain runtime key management
(encrypted, admin-only), GCC region switcher (7 regions, bilingual, white-label pitch),
narrative persistence, consent expiry enforcement, users-status revocation pipeline.

⚠️ Operational rule: any background agent cron that restarts servers MUST be off during
gate runs and demos (it broke a gate run mid-flight on 2026-07-02).

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

## 3) Current step — الخطوة الحالية

**Waves 1 AND 2 COMPLETE (TASK-001…019)** — tag `demo-ready-v9`. Latest gate:
50/50 scenario + 53/53 ownership (incl. live user-revocation) + 12/12 portal smoke.
Current mode: **FEATURE FREEZE** — stability and rehearsal only until Sunday.

## 4) Remaining steps — الخطوات المتبقية

1. Owner rehearses the DEMO_RUNBOOK 16-step flow end-to-end in a browser (incl. new beats:
   AI Brain key card, region switcher, live user revocation).
2. Owner decides on pushing the ~24 local commits: `git push -u sanad-final main`.
3. Optional post-Sunday backlog stays in speckit/09-ROADMAP-TASKS.md.
⚠️ Keep any server-restarting background cron OFF during rehearsals and the demo.

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
