# 05 — AI Layer: Decision Engine, Drug Interactions, LLM Brain, Runtime Settings

Four modules in `artifacts/api-server/src/lib/`:

## decision-engine.ts — deterministic clinical rules (unit-tested, 24 vitest tests)

`computeDecision(patient, medications, labResults, visits) → AiDecisionResult`:
- `riskScore` 0–100 (**Clinical Priority Index** — NEVER present as a probability; see
  DEMO_RUNBOOK "Correct framing"), `riskLevel` low|medium|high|critical, `urgency`
  routine|soon|urgent|immediate, `primaryAction`, `timeWindow`, `confidence` 0–1,
  `whyFactors[{factor, impact, description}]` (explainability — ≥4 for critical patients),
  `recommendations[]`, `digitalTwin{riskTrajectory, projectedRiskScore, predictedConditions[]}`.
- Weighted inputs: chronic conditions, polypharmacy count, abnormal/critical labs
  (HbA1c, INR, eGFR, BNP…), visit frequency/recency, age.
- Every run persists to `ai_decisions` and feeds admin national-intelligence aggregates.
- If you tune weights: update `decision-engine.test.ts` and re-verify S1 scenario
  (patient 1000000001 must stay CRITICAL/95 — the demo script depends on it).

## ai-engine.ts — drug interaction database

`INTERACTION_DATABASE: Record<string, Array<{drug, severity, description, recommendation}>>`
- 30+ drug classes: warfarin, heparin, dabigatran, rivaroxaban, aspirin, clopidogrel, metformin,
  insulin, glibenclamide, lisinopril, losartan, metoprolol, verapamil, diltiazem, amiodarone,
  digoxin, furosemide, spironolactone, atorvastatin, simvastatin, clarithromycin, ciprofloxacin,
  metronidazole, rifampicin, fluconazole, itraconazole, fluoxetine, sertraline, tramadol,
  carbamazepine, phenytoin, lithium, omeprazole, cyclosporine, tacrolimus, paracetamol,
  colchicine, theophylline, NSAIDs …
- Severity: critical | high | moderate. Matching is lowercase substring, **bidirectional**
  (checkInteraction looks up both A→B and B→A).
- Demo-critical pairs (assertions depend on them): warfarin+amiodarone HIGH/critical INR,
  metronidazole+warfarin HIGH, ciprofloxacin+warfarin MODERATE, tramadol+fluoxetine CRITICAL
  serotonin syndrome, clarithromycin+colchicine CRITICAL, verapamil+metoprolol,
  itraconazole+rivaroxaban.
- Adding drugs: add BOTH directions or rely on the bidirectional lookup; keep lowercase keys;
  include actionable `recommendation`.

## claude-brain.ts — LLM clinical narrative + Q&A

- `streamClinicalNarrative(ctx, onChunk, onDone, onError)` — SSE-streamed summary.
- `askClinicalQuestion(ctx, question)` — single turn.
- Language auto-detect from patient name (Arabic regex → Arabic output).
- **Provider resolution (in order):**
  1. `getEffectiveAiSettings()` — admin-panel key from DB (30s cache),
  2. env fallback (GEMINI_API_KEY → OPENAI_API_KEY),
  3. null → **Demo Mode**: rich mock narrative streamed word-by-word (20ms/word), provider
     label "SANAD Clinical AI (Demo Mode)". The demo NEVER breaks without keys.
- Mid-request failure of configured provider → one retry with legacy env OpenAI key (gpt-4o)
  if present and different.
- PatientContext: name, age, conditions, allergies, meds, labs, visits, decision.
  `nationalId` is in the type but **excluded from prompts** (PDPL).

## ai-settings.ts — runtime model/key management (NEW — powers the Admin "AI Brain" card)

- Storage: `system_settings` row `key='ai_brain'`, value JSON
  `{provider, model, encryptedKey, baseUrl?}`.
- Encryption: AES-256-GCM, key = sha256(`sanad-ai-settings:` + JWT_SECRET), format
  `v1:<iv>:<tag>:<ciphertext>` base64. Decrypt failure (rotated secret) → treated unset.
- `getEffectiveAiSettings()` — DB → env → null, cached 30s (`invalidateAiSettingsCache()` on save/delete).
- `PROVIDER_PRESETS`: gemini (`generativelanguage.googleapis.com/v1beta/openai/`,
  gemini-2.5-flash), openai (api.openai.com/v1, gpt-4o-mini), anthropic
  (api.anthropic.com/v1/ **OpenAI-compat endpoint**, claude-haiku-4-5-20251001),
  custom (admin supplies any OpenAI-compatible baseUrl+model).
- `buildClient(settings)` → configured `openai` SDK client. `testAiSettings()` → 10-token ping
  `{ok, message, latencyMs}`.
- Endpoints + UI: see 03-API-SPEC (admin.ts) and 06-FRONTEND (AiBrainCard).
- ⚠️ **Migration prerequisite**: the `system_settings` table must exist in Neon —
  `pnpm --filter "@workspace/db" push`. Until then GET reports unconfigured and PUT returns
  503 NOT_MIGRATED with the exact command.

## Fraud / anomaly engine (insurance.ts inline)

ER-frequency + hospital-cycling heuristics → fraud risk level + named factors.
Demo patient 1000000007 (سعد العنزي, 4 ER visits / 4 hospitals) must flag HIGH; normal
patients must NOT flag (S7 assertions).
