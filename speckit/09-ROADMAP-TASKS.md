# 09 — Roadmap & Task Backlog

Current baseline: Ministry demo readiness is complete and pushed through `02a9a77`.
Quality gate baseline: TypeScript clean, Vitest 34/34, verify gate 50/50 scenario + 53/53
ownership + 12/12 smoke.

Immediate context: owner has a Qatar leadership meeting on Sunday. Until then, prioritize
rehearsal, credibility, and Qatar-specific story polish over new architecture.

Statuses: OPEN / IN-PROGRESS(agent) / DONE(commit) / BLOCKED(reason).

## P0 — Sunday Qatar Meeting Readiness

### TASK-020 · Qatar leadership speckit refresh — DONE(local docs, commit pending)
Update speckit for the Qatar leadership meeting and future stakeholder expansion.

Acceptance:
- `10-QATAR-LEADERSHIP-READINESS.md` exists and is linked from README.
- Roadmap reflects Sunday priorities, not stale completed tasks.
- WORKLOG and Codex handoff record what changed and what remains.

### TASK-021 · Manual rehearsal pass — DONE(local, see `git log -1`)
Run `DEMO_RUNBOOK.md` end-to-end in the browser with both servers up. Record exact PASS/FAIL notes
in WORKLOG.

Acceptance:
- Admin, doctor, citizen, family, emergency, pharmacy, insurance, research, supply-chain core beats
  are checked.
- Any failure becomes a new TASK with file/route/screen evidence.
- No speculative refactors during rehearsal.

### TASK-022 · Qatar talk-track update — DONE(local docs, commit pending)
Add a compact Qatar leadership talk track to `DEMO_RUNBOOK.md`.

Acceptance:
- Covers sovereignty, AI governance, citizen trust, clinical safety, and GCC scalability.
- Notes when to switch region to Qatar vs when KSA seeded sovereignty data is being shown.
- Stays short enough to use live in the meeting.

### TASK-023 · PROJECT_STATUS reconciliation — OPEN
Update `PROJECT_STATUS.md` to reflect pushed reality, current gate counts, and Sunday Qatar mode.

Acceptance:
- No stale "unpushed commits" language for `02a9a77`.
- Points readers to `speckit/10-QATAR-LEADERSHIP-READINESS.md`.

### TASK-024 · Final gate and freeze note — OPEN
Run the full gate once before the meeting window and record the result.

Acceptance:
- `.\verify-and-publish.ps1 -DryRun` passes 50/50 + 53/53 + 12/12.
- If ECONNRESET/ECONNREFUSED appears mid-run, rerun once only and document it.
- WORKLOG records the exact outcome and whether the platform is frozen for meeting use.

## P1 — Only If Sunday Story Needs It

### TASK-030 · Qatar region polish audit — OPEN
Check all region-aware screens and document whether Qatar branding is fully visible.

Acceptance:
- List screens that correctly show Qatar branding.
- List screens that still use KSA-specific seeded data or language.
- Fix only small copy/UI issues that are low risk.

### TASK-031 · Demo runbook Qatar cue cards — OPEN
Add presenter cue cards for each stakeholder: doctor, citizen, ministry, hospital, insurer,
investor.

Acceptance:
- Each cue is one or two sentences.
- No new functionality required.
- Useful even if internet or external AI provider is unavailable.

## P2 — Post-Meeting Product Expansion

### TASK-040 · Doctor Morning Rounds queue — OPEN
Add a doctor-facing prioritized queue for patients needing attention: risk delta, critical labs,
drug interactions, overdue follow-up, and unread AI decisions.

### TASK-041 · Patient My Health Plan — OPEN
Add a citizen view that translates risk, medications, appointments, consent, and recommendations
into plain-language next steps.

### TASK-042 · Ministry Command Center — OPEN
Expand Admin national intelligence into a government-ready command center: population risk, disease
burden, regional readiness, compliance posture, AI governance, and emergency signals.

### TASK-043 · Hospital Operations board — OPEN
Add hospital-scoped operational KPIs: bed pressure, lab turnaround, critical alerts, follow-up gaps,
readmission risk, and medication safety queue.

### TASK-044 · Insurance prior authorization assistant — OPEN
Add a payer workflow that recommends approve/request-info/deny based on policy evidence and consent.

### TASK-045 · Investor board view — OPEN
Add a board-facing view for market expansion, ROI model, deployment pipeline, defensibility, and
metric provenance. Do not present placeholder business metrics as live.

## Out Of Scope Before Sunday

- Force-push, history rewrite, tags, or remote pushes without explicit owner authorization.
- `.env`, secrets, dependency upgrades.
- `lib/audit.ts` audit-chain semantics.
- Major schema changes.
- Real external Qatar integrations.
- Large new dashboards that risk destabilizing the current green demo.
