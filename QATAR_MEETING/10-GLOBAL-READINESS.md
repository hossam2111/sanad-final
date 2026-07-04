# 10 — Global Deployment Readiness

Purpose: keep SANAD's identity stable as a global sovereign health intelligence platform.
Country-specific meetings such as Qatar, KSA, UAE, or any other national buyer should be handled as
deployment profiles and talk tracks, not as a rebranding of the product.

## Product Identity

SANAD is a sovereign AI health intelligence layer for national and large-scale health systems.
It does not replace existing systems such as Seha, NPHIES, Tatmeen, hospital HIS/EMR, payer systems,
or future country-specific equivalents. It sits above them as the intelligence, governance, consent,
and audit layer.

Stable positioning:

> SANAD is a global sovereign AI health intelligence platform for national health systems.
> The current demo uses a KSA reference dataset because it is the completed proof environment.
> The product itself is configurable for Qatar, Saudi Arabia, UAE, and other deployments through
> regional profiles, policy configuration, integrations, and local regulatory work.

Arabic positioning:

> سند منصة ذكاء صحي سيادية عالمية قابلة للنشر لأي دولة. النسخة الحالية تستخدم بيانات سعودية
> كبيئة مرجعية للعرض، لكن المنتج نفسه قابل للتهيئة حسب الدولة والجهة المنظمة والأنظمة المتكاملة.

## Reference Dataset vs Deployment Profile

Keep these concepts separate everywhere:

- Product identity: global sovereign health intelligence platform.
- Reference demo dataset: current KSA-seeded scenarios, patients, PDPL narrative, and KSA sovereign
  cloud evidence.
- Deployment profiles: configurable country labels, ministry names, ID labels, currency, language,
  branding, policy assumptions, hosting choices, and integrations.
- Production deployment: real integration, hosting, regulatory review, and operating model for a
  specific country or buyer.

Do not say:

- "SANAD is a Saudi product repainted for Qatar."
- "The Qatar deployment is complete" unless actual integrations/hosting/regulatory work exists.
- "The KSA seeded sovereignty data proves another country's deployment."

Do say:

- "KSA is the completed reference demo dataset."
- "Qatar/UAE/etc. are deployment profiles that prove configurability."
- "A production country rollout needs local integrations, hosting decisions, legal review, and data
  governance sign-off."

## Stakeholder Lenses

### Doctor

Message:
"SANAD helps clinicians find risk faster, explains why, and keeps the clinician accountable."

Show:
- Critical patient risk score.
- Why-factors and recommendations.
- Drug interaction safety.
- AI narrative or saved summary.

### Patient / Citizen

Message:
"SANAD makes access transparent and consent controllable."

Show:
- Citizen record.
- Consent grant/revoke.
- Family access gated by consent.
- Auditability in plain language.

### Ministry / Government

Message:
"SANAD gives national leadership a sovereign intelligence and governance layer."

Show:
- National KPIs.
- Data Sovereignty tab as KSA reference evidence.
- Audit chain verification.
- AI Brain model/key control.

Important phrasing:
"This screen uses the KSA reference dataset. The same platform supports country deployment profiles,
but production sovereignty evidence is generated per deployment."

### Hospital Operator

Message:
"SANAD gives hospitals operational intelligence without breaking national trust boundaries."

Show:
- Hospital scoping.
- Alerts, risk, patient throughput, and medication safety signals.

### Insurance / Payer

Message:
"SANAD supports faster review and anomaly detection inside consent and policy boundaries."

Show:
- Insurance access gated by consent.
- Claim anomaly scenario.

### Investor / Board

Message:
"SANAD is a platform, not a one-off demo. The moat is clinical workflow + consent + audit + sovereign
AI governance + regional configurability."

Show:
- 12 portals.
- Full green gate.
- Runtime AI provider control.
- GCC/global region profiles.

## Meeting Playbook

For any country-specific meeting:

1. Start with the global platform identity.
2. State that KSA is the current reference dataset.
3. Use the region selector only to demonstrate configurability.
4. When showing Data Sovereignty, say whether the evidence is KSA reference evidence or deployment
   evidence for the target country.
5. Never imply production integration or regulatory approval exists for a country unless it does.

## Critical Path Before Any Leadership Meeting

1. Full gate green: 50/50 scenario + 53/53 ownership + 12/12 smoke.
2. Browser rehearsal of the critical path.
3. Runbook talk track aligned to global identity.
4. API/web servers stable: web `:3000`, API `:8080`.
5. No server-restarting background jobs during the meeting.
6. Avoid repeated full gates immediately before a meeting; auth rate-limit can create temporary 429s
   unrelated to code.

## Post-Meeting Product Expansion

Use `09-ROADMAP-TASKS.md` for implementation tasks. The next product work should strengthen the
global platform story:

- Doctor Morning Rounds queue.
- Patient My Health Plan.
- Ministry Command Center with metric provenance.
- Hospital Operations board.
- Insurance prior authorization assistant.
- Investor board view with live/demo/placeholder labels.
- Integration boundary spec for national systems.

