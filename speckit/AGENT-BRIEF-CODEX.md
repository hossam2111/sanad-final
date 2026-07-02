# CODEX HANDOFF — Global SANAD Identity + Leadership Freeze

Date: 2026-07-03
Agent: codex
Repo root: `C:\Users\Hossam\Desktop\sanad_cd_two`

## Owner Direction

Do not keep changing SANAD's identity per meeting. SANAD must be positioned as a global sovereign
health intelligence platform. KSA is the current reference demo dataset, not the product identity.
Qatar, UAE, KSA, and others are deployment profiles/audience talk tracks.

## What I Changed

1. Replaced the Qatar-specific readiness spec with a global deployment readiness spec.
   - Added `speckit/10-GLOBAL-DEPLOYMENT-READINESS.md`.
   - Deleted `speckit/10-QATAR-LEADERSHIP-READINESS.md`.
   - The new file defines stable product identity, reference dataset vs deployment profile,
     stakeholder lenses, meeting playbook, and leadership critical path.

2. Updated `speckit/README.md`.
   - SANAD is now described as a global sovereign AI health intelligence platform.
   - KSA is described as the current reference demo dataset.
   - Spec index points to `10-GLOBAL-DEPLOYMENT-READINESS.md`.

3. Updated `DEMO_RUNBOOK.md`.
   - Renamed Qatar-specific talk track to Global Leadership Talk Track.
   - Preserved audience adaptation for Qatar/GCC without changing the product identity.
   - Added explicit language: KSA data is the reference demo dataset; region switcher demonstrates
     deployment configurability.
   - Kept guardrails about 429 auth rate-limit from repeated full gates.

4. Updated `PROJECT_STATUS.md`.
   - Current mode is global leadership freeze.
   - KSA reference dataset is explicitly separated from global product identity.
   - Remote/local state notes explain that local main is ahead with docs-only readiness commits.

5. Updated `speckit/09-ROADMAP-TASKS.md`.
   - P0 is now Sunday Leadership Meeting Readiness, not Qatar rebranding.
   - Region profile polish is framed as deployment-profile audit.
   - Out of scope says no real external country integrations before the meeting.

6. Work already done before this correction:
   - Full verify gate passed this session: 50/50 scenario + 53/53 ownership + 12/12 smoke.
   - Browser rehearsal passed 4/4: admin deployment/Qatar profile readiness, doctor critical patient,
     citizen record/consent, family consented profile.
   - Rehearsal screenshots are local under `output/playwright/` and intentionally not committed.

7. Completed the next low-risk meeting-prep tasks.
   - Added `speckit/11-REGION-PROFILE-AUDIT.md` for TASK-030.
   - Added presenter cue cards to `DEMO_RUNBOOK.md` for TASK-031.
   - Added `speckit/12-LEADERSHIP-ONE-PAGER.md` for TASK-032.
   - Added `speckit/13-LEADERSHIP-QA.md` for TASK-033.
   - These are documentation/readiness changes only.

## Current Git State To Expect

Local `main` is ahead of `sanad-final/main`. Do not push without explicit owner authorization.

Expected recent commits:

1. TASK-030/TASK-031/TASK-032/TASK-033 region audit + stakeholder cue cards + one-pager + Q&A (current local work).
2. TASK-025 global identity correction (docs + small landing copy update, `artifacts/sanad` tsc PASS).
3. TASK-024 freeze note.
4. TASK-021 browser rehearsal record.
5. TASK-020 readiness roadmap on `sanad-final/main`.

There is an untracked local `output/` folder containing Playwright screenshots from rehearsal. It is
evidence only and intentionally not committed.

## Remaining Work

Before Sunday:

1. Avoid product/code changes unless a rehearsal-blocking issue appears.
2. Keep `pnpm dev` servers available when rehearsing: web `:3000`, API `:8080`.
3. If running the full gate repeatedly, restart API once or allow auth limiter cooldown if temporary
   429s appear; do not treat that as a code defect.
4. Use `DEMO_RUNBOOK.md` Global Leadership Talk Track.

After Sunday:

1. Pick from `09-ROADMAP-TASKS.md` P2 product expansion.
2. Strengthen global platform story with metric provenance, integration boundary docs, and
   stakeholder workflows.

## Guardrails

- Do not touch `lib/audit.ts`.
- Do not edit `.env` or secrets.
- Do not upgrade dependencies.
- Do not force push.
- Do not present KSA seeded evidence as proof of another country's production deployment.
