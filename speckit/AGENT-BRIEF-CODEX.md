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

8. Completed Qatar-specific research pack.
   - Added `speckit/14-QATAR-MARKET-RESEARCH-BRIEF.md` for TASK-035.
   - Sources include PHCC/MyHealth, HMC Oracle Cerner EHR, Qatar NHS 2024-2030, HMC Strategy
     2024-2030, TASMU, Nar'aakom, Qatar privacy law, and Qatar AI strategy.
   - Core answer: Qatar has strong systems of record/service channels; SANAD adds the governed
     intelligence, consent, audit, and AI control layer above them.

9. Added Qatar readiness folder.
   - Added `speckit/qatar-readiness/` for TASK-036.
   - Folder contains a start-here README, executive brief, meeting talk track, capability map,
     deployment checklist, and source list.
   - Purpose: keep Qatar material easy to hand to Claude/reviewers or use directly before the
     Sunday leadership meeting.

10. Fixed doctor appointment booking.
    - Added `BookAppointmentModal` to `artifacts/sanad/src/screens/doctor.tsx` for TASK-037.
    - The previous "Book Appt / حجز موعد" button had no click behavior.
    - Playwright audit confirmed: doctor login -> patient `1000000009` -> book appointment modal
      opens -> slot booking confirms with `APT-...`; prescribe-medication modal still opens.

11. Completed all-portal click audit fixes.
    - Ran `output/playwright/portal-click-audit.mjs` across all 12 portals.
    - Fixed admin health URL/soft status, hospital overview role fallback, lab portal demo access,
      and supply-chain low-stock alert fetch.
    - Final audit: 12 portals, 34 safe clicks, 0 bad responses, 0 failed requests, 0 page errors.

## Current Git State To Expect

Local `main` is ahead of `sanad-final/main`. Do not push without explicit owner authorization.

Expected recent commits:

1. TASK-038 all-portal click audit fixes (local, see `git log`).
2. TASK-037 doctor appointment booking button (local, see `git log`).
3. TASK-036 Qatar readiness folder (local, see `git log`).
4. TASK-035 Qatar research pack (`b57cb31`) plus WORKLOG pointer (`017652c`).
5. TASK-030/TASK-031/TASK-032/TASK-033 region audit + stakeholder cue cards + one-pager + Q&A.
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
