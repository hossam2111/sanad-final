# 08 — Conventions & Recipes

## Git

- Commit locally to `main`; NEVER push (owner pushes to `sanad-final` after review).
- Message: `feat|fix|docs|chore(scope): imperative summary [TASK-ID]` + trailer
  `Co-Authored-By: <YourModelName> <noreply@example.com>`.
- One task = one commit. Don't mix refactors with features.

## TypeScript / Code style

- Strict mode everywhere; `process.env["KEY"]` bracket access (noPropertyAccessFromIndexSignature).
- ESM with `.js` extensions in relative imports inside api-server (`from "../lib/audit.js"`).
- Drizzle: prefer query builder; raw `sql\`\`` only for aggregations (see research.ts pattern —
  handle both array and `.rows` shapes when using db.execute).
- Errors: `{ error: "CODE", message }` + correct status. Never leak stack traces to clients.
- Async Express 5 handlers can throw — the error middleware catches; still prefer explicit
  status responses for expected failures.
- Comments: only for non-obvious constraints (hash-chain exclusions, PS quirks, scoping rules).
  Match the existing terse density — no narration comments.

## Recipe: add an API endpoint
1. Route file → handler with zod `validate()` if body.
2. Ownership guard for patient-scoped params.
3. `writeAudit()` on writes/sensitive reads.
4. ROLE_PERMISSIONS update if new path prefix.
5. Typecheck api-server → run gate → WORKLOG entry.

## Recipe: add a DB table
See 02-DATA-MODEL "Changing the Schema". Key trap: rebuild lib/db composite (`npx tsc`)
BEFORE typechecking dependents, and decide truncate-vs-persist in seed deliberately.

## Recipe: add an admin tab
1. `<TabsTrigger value="x">` in the TabsList (admin.tsx ~line 520 area).
2. Self-contained component function above `AdminDashboard` (pattern: AuditFeed,
   ComplianceDashboard, AiBrainCard) — own fetch, loading, error states.
3. `<TabsContent value="x"><XComponent/></TabsContent>` before `</Tabs>`.
4. Bilingual + RTL rules from 06-FRONTEND. Match API field names EXACTLY (verify with a curl
   before wiring — the tier/class mismatch bug happened here).

## Recipe: extend drug interactions
Add lowercase key(s) in INTERACTION_DATABASE (ai-engine.ts) with
`{drug, severity: critical|high|moderate, description, recommendation}`.
Bidirectional lookup exists, but keep clinically-important pairs declared on both sides for
clarity. If demo-relevant, add a scenario assertion.

## Recipe: change AI provider behavior
All provider logic is ai-settings.ts + claude-brain.ts ONLY. UI is AiBrainCard (admin.tsx).
Never reintroduce module-level clients or env gates in routes (ai.ts must stay gate-free —
Demo Mode guarantees a response).

## PowerShell 5.1 survival (Windows dev machine)

- No `&&` / `||`; use `;` or `if ($?)`.
- Native stderr + ErrorActionPreference=Stop = fake failures → wrap noisy natives in
  `cmd /c "… 2>&1"`.
- Multi-line strings to git: here-string `@'…'@` with closing `'@` at column 0, or `-m $var`.
- Prefer forward-slash paths in node/pnpm args.

## Documentation upkeep

Any behavior change that affects demos → update DEMO_RUNBOOK.md.
Any completed/started task → update PROJECT_STATUS.md + speckit/WORKLOG.md.
New reusable knowledge (gotcha, pattern) → the matching speckit file, tersely.
