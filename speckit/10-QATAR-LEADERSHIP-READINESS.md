# 10 — Qatar Leadership Readiness

Purpose: prepare SANAD for a Sunday leadership meeting with a Qatari decision-making audience.
This file is the source of truth for what must feel complete, credible, and locally relevant.

## Meeting Objective

Show that SANAD is a deployable national AI health intelligence layer, not just a demo app.
The message: Qatar can adopt the platform as a sovereign decision-intelligence layer above existing
health systems, with Arabic-first UX, consent, auditability, regional branding, and AI governance.

## Core Positioning

SANAD does not replace existing national systems. It sits above them:

- Clinical intelligence for doctors.
- Trust and consent for citizens.
- Operational visibility for hospitals.
- Policy intelligence for the ministry/government.
- Controlled AI governance for leadership.
- Investment-grade expansion story for the board.

For Qatar, emphasize:

- Sovereignty: data remains under national control.
- Arabic-first experience with English support.
- Configurable region branding: Qatar can be first-class, not an afterthought.
- AI provider control: the government controls the model/key, not the vendor.
- Audit chain: every sensitive action is traceable.

## Stakeholder Messages

### Doctor

What to show:
- Patient risk score, why-factors, clinical narrative, drug interaction blocking.
- The doctor remains in control; AI explains and supports, not replaces.

Winning line:
"SANAD reduces missed risk and gives clinicians an auditable explanation in seconds."

### Patient / Citizen

What to show:
- Consent revoke/re-grant.
- Family access gated by consent.
- Patient can understand who has access and why.

Winning line:
"The citizen owns access to their record, and every access leaves a trace."

### Ministry / Government

What to show:
- National intelligence dashboard.
- Data Sovereignty tab.
- Audit chain verification.
- Region selector returned to Qatar when presenting Qatar-specific story, or KSA when showing the
  existing sovereignty dataset if that screen still uses KSA deployment language.

Winning line:
"SANAD gives leadership a live policy and governance layer across the health system."

### Hospital Operator

What to show:
- Hospital scoped access and operational signals.
- Doctor/hospital roles do not leak across boundaries.

Winning line:
"Hospitals get actionable operational intelligence without breaking national trust boundaries."

### Insurance / Payer

What to show:
- Consent-gated insurer access.
- Claim anomaly scenario.

Winning line:
"Payers get faster review and fraud signals, but only inside consent and policy boundaries."

### Investor / Board

What to show:
- 12 portals already running.
- Green quality gate.
- GCC region switcher.
- Runtime AI provider control.

Winning line:
"This is a regional platform with a defensible moat: clinical workflows, governance, audit, consent,
and sovereign AI control in one system."

## Sunday Critical Path

Must be true before meeting:

1. Full gate green: 50/50 scenario + 53/53 ownership + 12/12 smoke.
2. Demo runbook rehearsed end-to-end once without code changes.
3. Qatar region story rehearsed: know which screens are truly region-branded and which still use
   KSA-specific seeded sovereignty content.
4. AI Brain card demo works in demo mode or configured mode.
5. No server-restarting background job runs during rehearsal or meeting.
6. WORKLOG records last successful gate and any known caveats.

Do not attempt before Sunday unless explicitly requested:

- Real external Qatar integrations.
- Major schema changes.
- Dependency upgrades.
- Rewriting audit/consent/auth foundations.
- New investor dashboard if it risks destabilizing the demo.

## Best Next Work If Time Allows

1. Rehearsal hardening:
   - Run the runbook manually and record pass/fail notes.
   - Fix only issues that affect the Sunday story.

2. Qatar polish:
   - Confirm Qatar region branding appears correctly where region selector is used.
   - Add a short runbook note for when to switch region to Qatar vs KSA.

3. Leadership narrative:
   - Add a compact "Qatar leadership talk track" to DEMO_RUNBOOK.md.
   - Keep it practical: sovereignty, AI governance, citizen trust, clinical safety.

4. Investor fallback:
   - Prepare talking points from existing capabilities rather than building a new dashboard.

