# 09 — Roadmap & Task Backlog

Current baseline: Ministry demo readiness is complete and pushed through `02a9a77`.
Quality gate baseline: TypeScript clean, Vitest 34/34, verify gate 50/50 scenario + 53/53
ownership + 12/12 smoke.

Immediate context: owner has a Sunday leadership meeting with a Qatari audience. Do not rebrand the
product around the audience. Keep SANAD positioned as a global sovereign health intelligence
platform, with KSA as the current reference demo dataset and Qatar as one deployment profile.

Statuses: OPEN / IN-PROGRESS(agent) / DONE(commit) / BLOCKED(reason).

## P0 — Sunday Leadership Meeting Readiness

### TASK-020 · Global deployment speckit refresh — DONE(e39fc9a + follow-up local correction)
Update speckit for stable global product identity and future stakeholder expansion.

Acceptance:
- `10-GLOBAL-DEPLOYMENT-READINESS.md` exists and is linked from README.
- Roadmap reflects global platform identity, not stale completed tasks or country rebranding.
- WORKLOG and Codex handoff record what changed and what remains.

### TASK-021 · Manual rehearsal pass — DONE(local, see `git log -1`)
Run `DEMO_RUNBOOK.md` end-to-end in the browser with both servers up. Record exact PASS/FAIL notes
in WORKLOG.

Acceptance:
- Admin, doctor, citizen, family, emergency, pharmacy, insurance, research, supply-chain core beats
  are checked.
- Any failure becomes a new TASK with file/route/screen evidence.
- No speculative refactors during rehearsal.

### TASK-022 · Leadership talk-track update — DONE(local docs)
Add a compact leadership talk track to `DEMO_RUNBOOK.md` that starts from global SANAD identity and
then adapts to the audience.

Acceptance:
- Covers sovereignty, AI governance, citizen trust, clinical safety, and GCC/global scalability.
- Notes that KSA seeded sovereignty data is reference evidence, while region profiles demonstrate configurability.
- Stays short enough to use live in the meeting.

### TASK-023 · PROJECT_STATUS reconciliation — DONE(local docs)
Update `PROJECT_STATUS.md` to reflect pushed reality, current gate counts, and Sunday global-platform mode.

Acceptance:
- No stale "unpushed commits" language for `02a9a77`.
- Points readers to `speckit/10-GLOBAL-DEPLOYMENT-READINESS.md`.

### TASK-025 · Restore global SANAD identity — DONE(local, see `git log -1`)
Correct the over-specific Qatar framing. SANAD must remain a global sovereign health intelligence
platform; KSA is the reference demo dataset; Qatar/UAE/etc. are deployment profiles and audience
talk tracks.

Acceptance:
- No speckit source-of-truth file treats Qatar as the product identity.
- README and DEMO_RUNBOOK start from global positioning.
- Landing page strip/footer use global platform + KSA reference deployment wording in EN/AR.
- WORKLOG and AGENT-BRIEF record what changed and what remains.

### TASK-024 · Final gate and freeze note — DONE(local freeze note, see `git log -1`)
Run the full gate once before the meeting window and record the result.

Acceptance:
- `.\verify-and-publish.ps1 -DryRun` passes 50/50 + 53/53 + 12/12.
- If ECONNRESET/ECONNREFUSED appears mid-run, rerun once only and document it.
- WORKLOG records the exact outcome and whether the platform is frozen for meeting use.

## P1 — Only If Sunday Story Needs It

### TASK-030 · Region profile polish audit — OPEN
Check all region-aware screens and document whether deployment profiles are visible without changing
SANAD's global identity.

Acceptance:
- List screens that correctly show configurable region profile values.
- List screens that still use KSA-specific seeded data or language, and label them as reference dataset.
- Fix only small copy/UI issues that are low risk.

### TASK-031 · Demo runbook stakeholder cue cards — OPEN
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
- Real external country integrations.
- Large new dashboards that risk destabilizing the current green demo.
