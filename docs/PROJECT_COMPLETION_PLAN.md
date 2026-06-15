# SANAD — Project Completion Plan (Master)

**Owner of this plan:** you (the operator). **Goal:** drive SANAD to a
presentation-ready state with three agents working in parallel **without
collisions**, and a clear fallback if Claude hits a usage limit.

> Read order: §1 (the fence) is the most important. Everything else depends on it.

---

## 0. Status snapshot (where we are)

| Workstream | Owner | State |
|---|---|---|
| Phases 1–5 (landing, parity, UX audit, doctor/patient IA, ownership/BOLA) | Claude | ✅ done |
| Demo environment (seed + 7 scenarios + DEMO_PLAYBOOK.md) | Claude | ✅ done |
| Ministry & Executive Readiness Audit (fixes shipped) | Claude | ✅ done |
| **Localization** — foundation + 12 portals chrome | Claude | 🟡 ~90% (Family done; backend engine strings + QA remain) |
| **Backend hardening** (auth/observability/health/CI/tests) | Codex | 🟡 in progress on its branch |
| **Executive/Government docs** (7 × EN/AR) | Gemini | 🟡 in progress |
| Design-system + production-readiness audit reports | Codex | ✅ delivered (`docs/engineering/`) |

---

## 1. FILE-OWNERSHIP FENCE (anti-collision — do not violate)

Two agents touch `artifacts/api-server`. They must never edit the same file.

### Claude (Localization) owns — exclusive write
- **All** of `artifacts/sanad/**` (entire frontend)
- `artifacts/sanad/src/lib/terms.ts` (the bilingual glossary)
- Backend **engine + AI routes only**, for `?lang` output localization:
  - `artifacts/api-server/src/lib/decision-engine.ts`
  - `artifacts/api-server/src/lib/ai-engine.ts`
  - `artifacts/api-server/src/routes/ai.ts`
  - `artifacts/api-server/src/routes/patients.ts`
  - `artifacts/api-server/src/routes/emergency.ts`
  - `artifacts/api-server/src/routes/research.ts`

### Codex (Hardening) owns — exclusive write, on branch `hardening/backend`
- Everything else in `artifacts/api-server/**`: `app.ts`, `index.ts`,
  `routes/auth.ts`, `routes/health.ts`, `middlewares/*`, `lib/audit.ts`,
  `lib/sse.ts`, `lib/logger.ts`
- `lib/db/**` (pool config + migrations), `.github/workflows/**`, new `*.test.ts`
- **FROZEN:** must not change the LOGIC of `computeAuditHash` / `canonicalize`
  in `audit.ts` (breaks the Isnād chain). Add-around only.

### Gemini (Docs) owns — exclusive write
- `docs/**` only (never code).

> If a task seems to need a file outside your set → STOP and flag it for the
> operator to re-assign. Never reach across the fence.

---

## 2. WORKSTREAM A — Localization (Claude, or Sonnet fallback)

The pattern, glossary, RTL conventions and terminology are **already decided**.
The rest is mechanical + one bounded engine task.

**Conventions (must follow exactly):**
- Wrap every user-facing string: `text("English", "العربية")` from `useLanguage()`.
- Reuse `lib/terms.ts` (`text(...T.riskScore)`) for shared terms; add new shared
  terms there, don't duplicate inline.
- Add `localized` to `<Layout role=...>` on every screen you complete.
- RTL: use logical utilities — `ms/me`, `ps/pe`, `start/end`, `text-start` —
  never `ml/mr/pl/pr/left/right/text-left`. Add `rtl:-scale-x-100` to directional
  arrows/chevrons.
- Keep **numbers, National IDs, dates, ref numbers, blood types, dosages** with
  `dir="ltr"`.
- Keep clinical proper nouns in English (drug names, condition names like
  "Hypertension", lab names like "HbA1c") — this is correct Saudi clinical
  register. Localize only the sentence scaffolding around them.
- Arabic must read as MOH-register native Arabic, not literal translation.

### A1. Finish Family portal (~5 min)
- Verify `FamilyMemberCard` sub-component strings are wrapped (relationship,
  "No chronic conditions", any labels). Grep `family.tsx` for remaining raw
  English in JSX.

### A2. Backend engine output localization (the one architectural piece)
**Problem:** factor labels, recommendations, predictions, clinical actions,
digital-twin strings render in English inside Arabic screens (they come from the
server engines).

**Mechanism (implement exactly this — do not redesign):**
1. **Transport:** the frontend already attaches headers via `apiFetch`
   (`artifacts/sanad/src/lib/api.ts`) and the generated client
   (`lib/api-client-react/src/custom-fetch.ts`). Add an `Accept-Language`
   header (`ar` or `en`) sourced from `localStorage("sanad_locale")` in BOTH
   fetch paths so every API call carries the locale.
2. **Server read:** in `routes/ai.ts`, `patients.ts`, `emergency.ts`,
   `research.ts`, read `const lang = req.headers["accept-language"] === "ar" ? "ar" : "en"`
   and pass `lang` into the engine calls.
3. **Engines:** add an optional `lang: "en" | "ar" = "en"` param to the exported
   functions in `decision-engine.ts` (`runDecisionEngine`) and `ai-engine.ts`
   (`calculateRiskScore`, `generatePredictions`, `generateClinicalActions`,
   `checkDrugInteractions` descriptions). Return Arabic strings when `lang==="ar"`
   for: `whyFactors[].factor/description`, `recommendations[]`, `primaryAction`,
   `timeWindow`, `digitalTwin.predictedConditions/keyDrivers/interventionWindow`,
   `behavioralFlags[].description/recommendation`, `explainability.summary`,
   prediction `title/description/recommendation`, clinical-action
   `description/reason`, interaction `description/recommendation`.
   - Keep the existing Arabic condition-normalization maps; mirror them for output.
   - Keep clinical proper nouns English inside the Arabic sentences.
4. **Do not** change risk math, thresholds, or the audit `source` strings.
5. Add a couple of vitest cases: `runDecisionEngine(input, "ar")` returns Arabic
   `primaryAction`; English path unchanged.

### A3. Typecheck
- `pnpm --filter @workspace/sanad typecheck` and
  `pnpm --filter @workspace/api-server typecheck` → both green.

### A4. Bilingual visual QA (see §5 for the rubric + harness)
- Capture every portal in **AR and EN**, fix stragglers (untranslated strings,
  broken RTL alignment, mixed punctuation, overflow).

### A5. Localization report → `docs/LOCALIZATION_REPORT.md`
- Terminology decisions table, screens audited, remaining issues, readiness
  assessment (Exec/Gov/Investor lens).

---

## 3. WORKSTREAM B — Backend Hardening (Codex, branch `hardening/backend`)

Continue per `docs/engineering/production-readiness.md` and the issued brief.
Remaining backend-safe items (most already in flight):
- [ ] `/api/livez` + `/api/readyz` split (keep `/healthz` summary)
- [x] Correlation ID unified across logs + response header *(done)*
- [x] Audit failure logging + counter *(done — hash logic untouched)*
- [x] Demo-credential gating + auth posture fail-fast *(done)*
- [x] Rate limits env-tunable *(done)*
- [ ] Graceful shutdown: flip readiness false → close SSE → close HTTP → `pool.end()`
- [ ] DB pool config (max/timeouts/SSL) + Drizzle migration workflow + deploy gate
- [ ] CI gates: root typecheck, API tests, clean Next build (no ignored errors), migration check
- [ ] Tests: ownership/BOLA, audit-chain integrity, drug-interaction grading
- [ ] `docs/engineering/hardening-changelog.md` (what shipped, what's gated on the
      localization merge, deployer steps)

**Gated until localization merges (do NOT start in frontend):** `global-error.tsx`,
`error.tsx`, route `loading.tsx`, `LoadingState/ErrorState/EmptyState` primitives,
React Query retry policy. List them in the changelog as "post-merge."

---

## 4. WORKSTREAM C — Executive/Government Docs (Gemini, `/docs`)

Deliver the 7 assets × EN/AR per the issued brief
(`01-sanad-narrative` … `07-rollout-strategy`). Constraints recap: no fabricated
metrics, PDPL not GDPR, frozen brand terms, Arabic = native register.

---

## 5. FINAL QA GATE (run before declaring "presentation ready")

Run from a clean state. **All must pass.**

### 5.1 Automated (objective — anyone/any model can run)
```
# reseed to canonical demo state
pnpm --filter @workspace/scripts seed

# scenario + ownership harnesses (must be green)
node %TEMP%\sanad-shots\scenario-tests.mjs     # expect 43 passed, 0 failed
node %TEMP%\sanad-shots\ownership-tests.mjs     # expect 41 passed, 0 failed

# typecheck everything
pnpm --filter @workspace/api-server typecheck
pnpm --filter @workspace/sanad typecheck
pnpm --filter @workspace/scripts typecheck

# audit chain integrity (admin token → /api/admin/audit-log/verify) → VERIFIED
```

### 5.2 Bilingual visual QA (judgment — see rubric)
- Harness: `node %TEMP%\sanad-shots\ar-shot.mjs <role> [nationalId]` (forces AR/RTL)
  and `portal-audit.mjs` for the default pass. Capture AR + EN per portal.
- **Rubric (a screen passes only if all true):**
  1. Zero stray English in the AR view except whitelisted clinical proper nouns
     (drug/condition/lab names) and numerics.
  2. RTL mirrored correctly: identity/title on the right, actions on the left;
     tabs flow right-to-left; arrows point inward.
  3. Numbers/IDs/dates stay LTR and don't bidi-mangle.
  4. Arabic reads as native MOH register (not literal); no font-mono/letter-spacing
     on Arabic.
  5. Mobile (390px) and empty/loading/error states render correctly in both langs.

### 5.3 Presentation dry-run
- Walk **DEMO_PLAYBOOK.md** end-to-end in **both** AR and EN. Every scenario
  (S1–S7) must land on the right screen with the right data and read natively.

---

## 6. INTEGRATION & MERGE ORDER

1. **Localization branch first** (touches the most files — frontend + 6 engine/route files).
2. **`hardening/backend` second** (backend-only; near-zero conflict because of the
   fence; the only shared file historically was `app.ts`/`audit.ts` which are now
   Codex-owned and Claude won't touch).
3. **Docs** anytime (no code conflict).
4. After all merge: run §5 once more on the integrated tree.

---

## 7. PRESENTATION-READINESS CHECKLIST (the finish line)
- [ ] §5.1 all green (43/0, 41/0, typecheck ×3, audit VERIFIED)
- [ ] §5.2 every portal passes the bilingual rubric (AR + EN)
- [ ] §5.3 DEMO_PLAYBOOK dry-run clean in both languages
- [ ] `docs/LOCALIZATION_REPORT.md` written
- [ ] `docs/engineering/hardening-changelog.md` written
- [ ] 7 Gemini docs present (EN + AR)
- [ ] Two dev servers start clean (api :8080, next :3001); reseed reproducible
- [ ] No console errors that surface to the user; no debug artifacts; no fake metrics

---

## 8. CONTINGENCY MATRIX — if Claude hits a usage limit

The work is structured so nothing blocks on Claude except final-judgment review.

| Remaining task | If Claude is available | If Claude is limited |
|---|---|---|
| Localization grind (A1, A4 fixes) | Claude/Sonnet (this session) | **Switch session to Sonnet** (`/model sonnet`) — context + this plan are enough; or start a fresh Sonnet session pointed at §2 |
| Engine localization (A2) | Claude/Sonnet | Sonnet, following §2's exact mechanism (no design needed) |
| Backend hardening (B) | — | **Codex continues independently** (already does) |
| Exec/Gov docs (C) | — | **Gemini continues independently** |
| §5.1 automated QA | Anyone | **Operator runs the commands** — objective pass/fail |
| §5.2 bilingual judgment review | **Claude/Opus (best)** | Sonnet can do a first pass against the rubric; flag anything uncertain for Opus when available |
| §5.3 playbook dry-run | Claude/Opus or operator | Operator can run it (DEMO_PLAYBOOK is step-by-step) |
| Final sign-off | Claude/Opus | Operator using §7 checklist |

**Rule of thumb:** Codex and Gemini are fully independent and never need Claude to
proceed. Only the *bilingual native-quality judgment* (§5.2) truly benefits from
Opus — everything else is either mechanical (Sonnet) or checklist-driven (operator).

---

## 9. DEFINITION OF DONE (whole project)
SANAD is presentation-ready when: §7 checklist is fully ticked; a ministry
official using Arabic feels the product was designed in Arabic; an English
stakeholder feels it was designed in English; every demo scenario runs live on
real engines with no mocked data; and the Isnād audit chain verifies intact.
```
