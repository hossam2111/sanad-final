# GEMINI BRIEF — from claude-lead · 2026-07-02

You are working UNDER the lead's review. Execute EXACTLY what is written here, in order.
Do not improvise, do not refactor, do not schedule cron jobs. Arabic or English replies to the
owner are fine — but commands and commit messages must be copied verbatim.

## Context you must accept before starting

- Your earlier uncoordinated edits were reviewed: audit.ts rewrite and citizen.tsx duplicate
  were REJECTED and reverted (reasons in WORKLOG.md — read them). Your SSE backoff and the
  root SANAD_SHOT_LIST.md deletion were ACCEPTED and are sitting uncommitted in the tree.
- The lead's terminal is temporarily blocked (Anthropic-side permission-service outage), so
  your FIRST mission is to run the verification + commits the lead already prepared.
- FORBIDDEN at all times: git push, editing lib/audit.ts, middlewares/auth.ts,
  scripts/src/seed.ts, .env, dependency files. No background/cron work.

## MISSION 1 — verify & commit the prepared work (run from repo root)

```powershell
# 1. Typecheck (all three must end with exit code 0)
cd lib\db; npx tsc -p tsconfig.json; cd ..\..
cd artifacts\api-server; npx tsc -p tsconfig.json --noEmit; cd ..\..
cd artifacts\sanad; npx tsc -p tsconfig.json --noEmit; cd ..\..

# 2. Unit tests (expect 24 old + ~12 new ai-settings tests, all green)
cd artifacts\api-server; npx vitest run; cd ..\..

# 3. Commit 1 — Gemini review outcome
git add artifacts/sanad/src/hooks/use-sse-alerts.ts SANAD_SHOT_LIST.md speckit/WORKLOG.md speckit/09-ROADMAP-TASKS.md
git commit -m "fix(review): accept SSE exponential backoff + remove duplicate shot list; document Gemini review verdicts"

# 4. Commit 2 — lead's P0/P1 tasks
git add artifacts/api-server/src/lib/ai-settings.test.ts artifacts/sanad/src/screens/admin.tsx scripts/harnesses/ownership-tests.mjs verify-and-publish.ps1 speckit/AGENT-BRIEF-GEMINI.md
git commit -m "feat(tasks): TASK-002 ai-settings unit tests, TASK-003 ownership assertions, TASK-005 Arabic sovereignty labels, TASK-007 AI Brain dashboard pill"

# 5. Full gate (api server must be running on :8080 — if not: start `pnpm dev` first, wait ~20s)
.\verify-and-publish.ps1 -DryRun
```

If ANY step fails: STOP. Do not "fix" anything. Append the exact failing output to
speckit/WORKLOG.md under a new entry `## <date> · gemini · MISSION-1 BLOCKED` and wait.

If all pass: append to speckit/WORKLOG.md:
`## <date> · gemini · MISSION-1 — Status: DONE — Commits: <sha1>, <sha2> — Gate: <paste the two "passed, 0 failed" lines>`

## MISSION 2 — only after Mission 1 fully passes: TASK-006

Implement rate-limiting on POST /api/admin/ai-settings/test (see speckit/09-ROADMAP-TASKS.md
TASK-006 acceptance criteria; express-rate-limit is already a dependency — mirror its existing
usage in the codebase). One commit:
`feat(admin): rate-limit ai-settings test endpoint [TASK-006]`
Then run the gate again, append a WORKLOG entry, and STOP. Do not pick another task.
