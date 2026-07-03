# Qatar Deployment Checklist

This is a meeting-readiness checklist, not a claim that Qatar production deployment is complete.

## Phase 0: Discovery

- Confirm sponsor and decision owner.
- Confirm pilot scope: specialty, facility, patient cohort, or ministry command use case.
- Map existing systems: HMC/PHCC EHR/CIS, MyHealth, Nar'aakom, identity, labs, payer interfaces,
  and reporting/BI systems.
- Identify integration method: API, FHIR/HL7, extracts, sandbox feeds, or read-only pilot data.
- Confirm data-residency and hosting preference.
- Map privacy/legal requirements against Qatar Personal Data Privacy Protection Law and local
  health-sector policies.
- Define clinical governance: who reviews AI output, override rules, escalation rules, incident
  review.

## Phase 1: Reference Pilot

- Use a narrow workflow, such as high-risk chronic disease triage, medication safety, emergency
  consent, or ministry command visibility.
- Keep AI assistive, explainable, and human-confirmed.
- Run with synthetic, de-identified, sandbox, or approved pilot data until legal/clinical approval.
- Configure roles: doctor, patient/citizen, family, insurer, admin/ministry.
- Configure consent policies and audit export.
- Define success metrics before launch.

## Phase 2: Integration And Governance

- Connect approved data sources.
- Align QID/Tawtheeq or approved identity pattern.
- Configure sovereign AI provider/model/key policy.
- Establish audit retention and reporting.
- Establish clinical safety review board.
- Establish privacy and security review cadence.
- Train pilot users and prepare support playbook.

## Phase 3: Scale

- Expand by facility, pathway, or national command use case.
- Add more providers and payer workflows only after governance is stable.
- Add advanced AI use cases after audit and human override are proven.
- Convert pilot results into a leadership evidence pack.

## Red Lines

- No autonomous clinical decisioning.
- No autonomous insurance denial.
- No production data use without approved legal/clinical/security path.
- No claim that SANAD replaces existing national systems.
- No country rebrand of SANAD; Qatar is a deployment profile.
