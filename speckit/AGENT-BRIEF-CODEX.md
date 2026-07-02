# CODEX BRIEF — from claude-lead · 2026-07-02 ~12:00

Finish the code-review fix batch (fixes 1–4 already DONE by lead, uncommitted in the tree).
Work from repo root `C:\Users\Hossam\Desktop\sanad_cd_two`. Rules: Edit files surgically
(never bulk-rewrite files containing Arabic via PowerShell pipes), no git push --force,
no touching lib/audit.ts, follow speckit/08-CONVENTIONS.md.

## Already done in working tree (do NOT redo, just keep)
- ai.ts: narrative persisted BEFORE res.end (race fix) + logger import
- users.ts: console.error → logger (×4) + logger import
- ErrorBoundary.tsx: ml-2 → me-2 · insurance.tsx: ml-auto → ms-auto
- admin.ts: `resolveAiModel()` helper added below AI_PROVIDERS (defined but NOT yet used)

## REMAINING STEPS — do in order

### Fix 5b — use the resolveAiModel helper (artifacts/api-server/src/routes/admin.ts)
Two places still have the inline expression. Replace BOTH occurrences of:
```ts
const resolvedModel = model?.trim() || (provider !== "custom" ? PROVIDER_PRESETS[provider as Exclude<AiProvider, "custom">].defaultModel : "");
```
with:
```ts
const resolvedModel = resolveAiModel(model, provider as AiProvider);
```
(one is in the PUT /ai-settings handler, one in POST /ai-settings/test).

### Fix 6 — cache invalidation placement (artifacts/sanad/src/screens/admin.tsx, AiBrainCard)
In `load` remove the invalidate line so it becomes:
```ts
const load = React.useCallback(() => {
  apiFetch("/api/admin/ai-settings").then(r => r.json()).then(setCurrent).catch(() => {});
}, []);
```
Then add `queryClient.invalidateQueries({ queryKey: ["ai-settings"] });` immediately after the
`load();` calls inside BOTH `handleSave` (success branch) and `handleRemove` — so the dashboard
pill refreshes on change but mount doesn't double-fetch.

### Fix 7 — batch the users upsert (scripts/src/seed.ts)
Replace the `for (const u of demoUsers) { await db.insert... }` loop with ONE statement:
```ts
await db.insert(usersTable)
  .values(demoUsers.map(u => ({ ...u, passwordHash: DUMMY_HASH, status: "active" })))
  .onConflictDoUpdate({ target: usersTable.id, set: { status: "active", updatedAt: new Date() } });
```

### Fix 8 — dead code (scripts/harnesses/ownership-tests.mjs ~line 26)
Delete the unused helper line:
```js
const patch = (path, token) => fetch(`${API}${path}`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });
```

### Fix 9 — demo credibility note (DEMO_RUNBOOK.md)
In the "Closing — 1 min" section, on the Data Sovereignty step (step 12), append:
`(switch the region selector back to 🇸🇦 KSA first — the sovereignty data describes the KSA deployment)`

## VERIFY + SHIP (all must pass before commit)
```powershell
cd lib\db; npx tsc -p tsconfig.json; cd ..\..
cd artifacts\api-server; npx tsc -p tsconfig.json --noEmit; npx vitest run; cd ..\..
cd artifacts\sanad; npx tsc -p tsconfig.json --noEmit; cd ..\..
.\verify-and-publish.ps1 -DryRun     # expect 50/50 + 53/53 + 12/12 — NEVER pass -SkipSeed
```
If the gate fails with ECONNRESET/ECONNREFUSED mid-run: that's an external server restart —
just rerun the gate once; do not "fix" anything for that.

Then ONE commit (include the already-done fixes in the tree):
```
git add -A
git commit -m "fix(review): persist narrative before stream end, pino logging, RTL margins, dedup resolveAiModel, batch seed upsert, cache invalidation placement, runbook region note"
git push sanad-final main
```
(Push is owner-authorized for this batch. NO --force, no tags.)

Finally append a WORKLOG entry (speckit/WORKLOG.md, top of the entries, keep existing ones):
date · codex · REVIEW-FIXES — Status/Commit/Gate lines per the format at the top of the file.
