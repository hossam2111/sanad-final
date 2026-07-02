# SANAD SpecKit — Complete Implementation Specification

> **Purpose**: This kit contains everything an AI coding agent (Codex, Gemini, Claude, or any other model)
> needs to continue developing SANAD without prior context. Read this file first, then the spec that
> matches your task. **The lead reviewer is Claude (Sonnet/Opus session in this repo) — all work done
> by other agents will be reviewed against these specs when the lead session resumes.**

## What is SANAD?

SANAD (سند) — National AI Health Intelligence Platform for Saudi Arabia. A monorepo demo platform
showcasing an "intelligence layer above existing health systems" (NPHIES-aligned, PDPL-compliant).
12 role-based portals (doctor, citizen, emergency, admin, lab, pharmacy, hospital, insurance,
ai-control, research, family, supply-chain) backed by one Express API and one PostgreSQL (Neon) DB.

**Positioning (for any demo/pitch content):** SANAD does NOT replace Seha/Tatmeen/NPHIES — it is the
decision-intelligence layer on top of them. Arabic tagline: "طبقة ذكاء فوق ما بُني — لا تستبدله".

## Spec Index

| File | Read when you need to… |
|------|------------------------|
| [01-ARCHITECTURE.md](01-ARCHITECTURE.md) | Understand repo layout, run/build commands, env vars, gotchas |
| [02-DATA-MODEL.md](02-DATA-MODEL.md) | Add/modify DB tables, understand relations |
| [03-API-SPEC.md](03-API-SPEC.md) | Add/modify endpoints — full route inventory |
| [04-AUTH-SECURITY.md](04-AUTH-SECURITY.md) | Touch anything auth, roles, ownership, consent, audit |
| [05-AI-ENGINE.md](05-AI-ENGINE.md) | Work on decision engine, drug interactions, AI narrative, AI settings |
| [06-FRONTEND.md](06-FRONTEND.md) | Build/modify screens, components, i18n, RTL |
| [07-TESTING-VERIFY.md](07-TESTING-VERIFY.md) | Run/extend the verify gate before ANY merge |
| [08-CONVENTIONS.md](08-CONVENTIONS.md) | Write code that passes review — style, patterns, recipes |
| [09-ROADMAP-TASKS.md](09-ROADMAP-TASKS.md) | Pick a task — prioritized backlog with acceptance criteria |
| [10-QATAR-LEADERSHIP-READINESS.md](10-QATAR-LEADERSHIP-READINESS.md) | Prepare the Sunday Qatar leadership meeting story and guardrails |

Also read [`PROJECT_STATUS.md`](../PROJECT_STATUS.md) at repo root — live done/in-progress/remaining state.

## Non-Negotiable Rules for Any Agent

1. **Never push to remote.** Commits to local `main` are fine. Pushing requires explicit authorization
   from the project owner (Hossam). The remote is `sanad-final`, NOT `origin`.
2. **Never commit secrets.** `.env` is gitignored and must stay that way. Keys go through the
   Admin panel AI Brain card (encrypted) or `.env` locally.
3. **Run the verify gate before claiming a task done**: `.\verify-and-publish.ps1 -DryRun`
   (current baseline: 50 scenario + 53 ownership + 12 smoke + seed). See 07-TESTING-VERIFY.md.
4. **TypeScript must be clean** in all three packages:
   ```
   cd lib/db && npx tsc -p tsconfig.json          # builds .d.ts (composite project)
   cd artifacts/api-server && npx tsc -p tsconfig.json --noEmit
   cd artifacts/sanad && npx tsc -p tsconfig.json --noEmit
   ```
5. **Bilingual UI is mandatory**: every user-facing string uses `text("English", "العربية")`.
   No `font-mono` on Arabic text. RTL-safe spacing (`ms-`/`me-`/`ps-`/`pe-`, never `ml-`/`mr-` alone).
6. **No PHI to external AI providers**: patient `nationalId` must never appear in prompts sent to
   OpenAI/Gemini/Anthropic (see 05-AI-ENGINE.md).
7. **Every write to patient data must be audited** via `writeAudit()` (see 04-AUTH-SECURITY.md).
8. **Leave a review trail**: for every task you complete, append an entry to
   `speckit/WORKLOG.md` (create if missing) with: date, agent name, task ID from 09-ROADMAP-TASKS,
   files touched, verify-gate result. The lead reviewer reads this first.

## Quick Start for a Fresh Agent

```bash
pnpm install                                  # root — installs all workspaces
pnpm --filter "@workspace/scripts" seed       # seed + warm Neon (MANDATORY before tests/demo)
pnpm dev                                      # starts api-server :8080 + Next.js :3001
```

Login at http://localhost:3001 — credentials in `DEMO_RUNBOOK.md` (e.g. `admin.saad` / `Admin@2026`).

## Review Protocol (lead ↔ sub-agents)

- Sub-agents work ONLY on tasks listed in `09-ROADMAP-TASKS.md`, one task per commit,
  commit message format: `feat|fix(scope): description [TASK-ID]`.
- Do not refactor beyond the task scope. Do not upgrade dependencies. Do not touch
  `verify-and-publish.ps1`, seed data, or auth middleware unless the task says so.
- If blocked, write the blocker in `speckit/WORKLOG.md` and move to the next task.
