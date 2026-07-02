# CODEX HANDOFF — Qatar Leadership Readiness

Date: 2026-07-02
Agent: codex
Repo root: `C:\Users\Hossam\Desktop\sanad_cd_two`

## Owner Request

The owner has a Qatar leadership meeting on Sunday. Review and update `speckit` so the project is
ready from doctor, investor, patient, ministry/government, hospital, and insurance perspectives.
Record everything done and everything still intended locally so another agent can continue safely.

## What I Did In This Pass

1. Added `speckit/10-QATAR-LEADERSHIP-READINESS.md`.
   - Defines the meeting objective.
   - Gives Qatar-specific positioning.
   - Adds stakeholder messages for doctor, patient, ministry/government, hospital, insurer, and
     investor/board.
   - Lists the Sunday critical path and what must not be attempted before Sunday.

2. Updated `speckit/README.md`.
   - Linked the new Qatar readiness file.
   - Corrected the verify baseline to 50 scenario + 53 ownership + 12 smoke.

3. Updated `speckit/07-TESTING-VERIFY.md`.
   - Corrected gate counts from old 46/42 wording to current 50/53/12.
   - Added the smoke login layer explicitly.

4. Replaced `speckit/09-ROADMAP-TASKS.md`.
   - Removed stale pre-Sunday/open-task framing.
   - Added Sunday P0 tasks:
     - TASK-020 Qatar leadership speckit refresh.
     - TASK-021 Manual rehearsal pass.
     - TASK-022 Qatar talk-track update.
     - TASK-023 PROJECT_STATUS reconciliation.
     - TASK-024 Final gate and freeze note.
   - Added post-meeting product expansion tasks for doctor, patient, ministry, hospital, insurance,
     and investor tracks.

5. I did not change application code in this pass.

6. Added `DEMO_RUNBOOK.md` Qatar Leadership Talk Track.
   - Opening line for Qatari/GCC leadership.
   - Stakeholder cues for doctor, citizen, ministry/government, hospital, insurance, and investor.
   - Qatar region cue and explicit "do not promise before Sunday" guardrails.

7. Updated `PROJECT_STATUS.md`.
   - Corrected current gate baseline to 50/50 + 53/53 + 12/12.
   - Changed current mode to Sunday Qatar readiness.
   - Removed stale unpushed-commits language for `02a9a77`.

## Current Local Git State To Expect

There was already one local uncommitted WORKLOG change from the previous review-fixes run:

- `speckit/WORKLOG.md` contains a REVIEW-FIXES entry for pushed commit `02a9a77`.

This pass adds/updates speckit docs. Do not delete the existing REVIEW-FIXES entry.

## Next Best Actions

1. Commit the docs refresh when the owner is ready.
   Suggested commit:
   `docs(speckit): prepare Qatar leadership roadmap [TASK-020]`

2. Do TASK-021 next:
   Run the demo manually and record PASS/FAIL notes.

3. Do TASK-024 last before the meeting:
   Run `.\verify-and-publish.ps1 -DryRun` and freeze the platform if green.

## Guardrails Until Sunday

- Prefer docs, rehearsal, and tiny copy fixes.
- Do not start major product builds unless the owner explicitly says to.
- Do not touch `lib/audit.ts`.
- Do not edit `.env` or secrets.
- Do not upgrade dependencies.
- Do not force push.
- If the gate fails with ECONNRESET/ECONNREFUSED mid-run, rerun once and document it before fixing
  anything.
