# SANAD Health — National Rollout Strategy

**From Pilot to National Fabric: A Phased Deployment Plan**

*Behind Every Decision*

---

## Executive Overview

This document outlines the national rollout strategy for SANAD Health — a phased, gated approach to deploying Sovereign Health Intelligence across the Kingdom's health system. Each phase has defined scope, success gates, change-management provisions, and data-governance milestones. No phase advances until its gates are met.

The strategy is designed to be realistic, auditable, and aligned with MOH institutional processes. Timelines are expressed as phases with durations, not as calendar dates, because the pace of deployment depends on institutional readiness, regulatory engagement, and integration complexity at each site.

---

## Phase 1: Pilot Deployment

**Scope:** 2–3 pilot hospitals

### 1.1 Objectives

- Validate SANAD's operational stability in a production clinical environment.
- Demonstrate clinical value to frontline physicians and pharmacy staff.
- Establish the Isnād audit chain in a live institutional setting.
- Initiate formal PDPL compliance certification.
- Build the evidence base for Phase 2 expansion.

### 1.2 Site Selection Criteria

Pilot facilities should be selected based on:

- **Digital maturity:** Existing hospital information system (HIS) with API capability or structured data export, enabling integration without ground-up digitization.
- **Institutional willingness:** Leadership endorsement and a designated clinical champion willing to drive adoption within the facility.
- **Patient-volume diversity:** A mix of primary, secondary, and/or tertiary care volumes to validate the platform across different clinical complexity levels.
- **Geographic accessibility:** Proximity to the implementation team for rapid iteration and support during the pilot period.

### 1.3 Deployment Scope

All twelve SANAD portals are deployed at each pilot site:

- **Physician Portal:** Clinical decision support, drug-interaction checking, digital-twin projection, AI-generated recommendations.
- **Citizen Portal:** Patient-facing health record, privacy dashboard, consent management.
- **Emergency Portal:** Break-glass patient retrieval with audited access.
- **Pharmacy Portal:** Dispensing with drug-interaction safety checks and server-issued reference numbers.
- **Laboratory Portal:** Lab result submission with AI interpretation (significance, trend, action).
- **Hospital Portal:** Bed management, capacity tracking, department operations.
- **Insurance Portal:** Claims processing, fraud-detection scoring (activated with participating insurers).
- **Ministry/Admin Portal:** Facility-level dashboard, audit-chain verification.
- **AI Control Center:** Engine monitoring, confidence tracking, drift detection.
- **Research Portal:** Anonymized data access under consent governance.
- **Family Portal:** Family health linking and genetic risk assessment under consent.
- **Supply Chain Portal:** Facility-level drug inventory and shortage tracking.

### 1.4 Integration Requirements

- **HIS integration:** Bi-directional data exchange with the pilot facility's existing hospital information system. Patient demographics, medications, lab results, visit history, and allergies must flow into SANAD. Approach: API-based integration where available; structured data import as fallback.
- **Authentication:** Integration with the facility's identity management system, or deployment of SANAD's role-based authentication with facility-specific credentials.
- **Network:** SANAD servers deployed within the facility's network perimeter or in a MOH-approved data center with secure connectivity to pilot sites.

### 1.5 Change Management: Clinician Adoption

Clinician adoption is the single largest determinant of pilot success. The change-management approach:

- **Clinical champion model:** Each pilot site designates a senior physician as the clinical champion — the internal advocate who understands the platform and can address peer concerns. The champion receives advanced training and direct access to the implementation team.
- **Structured onboarding:** All participating physicians receive a half-day onboarding session covering: the Physician Portal workflow, how to read AI-generated decisions and WHY factors, the drug-interaction checker, the digital-twin projection, and the audit trail. Emphasis: the physician retains final decision authority — SANAD informs, it does not override.
- **Shadow period:** For the first two weeks of live operation, SANAD operates alongside existing workflows. Physicians use both systems in parallel. This builds familiarity without forcing immediate workflow disruption.
- **Feedback loop:** Weekly feedback sessions during the first month, transitioning to biweekly. Issues are logged, triaged, and addressed within defined SLAs. The clinical champion escalates systemic concerns.
- **Pharmacy staff training:** Pharmacists receive a focused training session on the dispensing workflow, drug-interaction display, and the server-issued reference number system.

### 1.6 Data Governance Milestones

- **PDPL compliance review initiated:** Formal engagement with the PDPL regulatory authority begins during Phase 1. The compliance posture is documented and submitted for review.
- **Consent architecture validated:** All six consent types (data sharing, emergency access, insurance, AI processing, research, family linking) are operational and tested with real consent-change scenarios.
- **Isnād chain established:** The audit chain is activated from day one of the pilot. Chain integrity is verified weekly during the pilot period.
- **Data-residency confirmed:** All patient data, AI decisions, and audit logs reside within approved infrastructure. No data leaves the Kingdom.

### 1.7 Success Gates (must be met before advancing to Phase 2)

| Gate | Criteria |
|---|---|
| **Operational stability** | Platform runs in production clinical environment with no critical-severity availability incidents for a sustained period (illustrative target: 30 consecutive days). |
| **Clinician adoption** | Participating physicians use the platform in their daily clinical workflow. Target: majority of physicians at pilot sites actively using the system (illustrative). |
| **Clinical value signal** | At least one documented instance where SANAD's drug-interaction engine or clinical-decision engine surfaced a clinically significant finding that the existing workflow would have missed or delayed. |
| **PDPL compliance** | Compliance review completed with no unresolved critical findings. |
| **Isnād integrity** | Audit chain integrity maintained and verified throughout the pilot period with zero integrity failures. |
| **Consent enforcement verified** | Consent-change propagation tested and confirmed (e.g., insurance revocation blocks insurer access within target SLA). |

### 1.8 Dependencies

- MOH designation of pilot sites and institutional endorsement.
- Availability of HIS integration documentation and API access at pilot sites.
- PDPL regulatory engagement channel established.
- Implementation team access to pilot-site premises and clinical staff.

---

## Phase 2: Regional Expansion

**Scope:** Additional facilities within a target region

### 2.1 Objectives

- Validate cross-facility interoperability — patient records accessible across institutions with appropriate consent.
- Expand drug-interaction engine coverage to the regional formulary.
- Activate the Insurance portal with regional insurers.
- Deliver regional population-health analytics on the Ministry dashboard.
- Stress-test the Isnād chain at multi-facility scale.

### 2.2 Expansion Approach

Phase 2 applies the pilot playbook — refined by Phase 1 learnings — to additional facilities within a single target region. The region is selected based on:

- **Referral network density:** Facilities that refer patients to each other, creating natural cross-facility data-sharing needs.
- **Insurer participation:** At least one regional insurer willing to activate the Insurance portal for claims processing and fraud scoring.
- **Regulatory clearance:** Phase 1 PDPL compliance review completed; no blocking findings.

### 2.3 New Capabilities Activated

- **Cross-facility patient access:** A physician at Facility A can access a patient's record from Facility B, subject to the patient's data-sharing consent and the Isnād audit trail.
- **Regional formulary integration:** The drug-interaction engine is expanded to cover medications listed in the regional formulary, not just those in the pilot-site medication databases.
- **Insurance portal — live:** Claims processing, premium calculation, and fraud-detection scoring are activated with participating regional insurers.
- **Regional population health:** The Ministry dashboard aggregates data across all regional facilities, providing prevalence, risk distribution, and visit trends at the regional level.

### 2.4 Change Management Additions

- **Train-the-trainer model:** Clinical champions from Phase 1 pilot sites train champions at new facilities. This scales adoption without requiring the central implementation team at every site.
- **Pharmacy cross-site workflow:** Pharmacists are trained on cross-facility prescription visibility — seeing medications prescribed at other facilities before dispensing.
- **Insurance staff onboarding:** Insurer analysts receive training on the claims-processing workflow, fraud-scoring interpretation, and the distinction between clinical severity and billing anomaly.

### 2.5 Data Governance Milestones

- **Cross-facility consent propagation verified:** A citizen's consent change at Facility A is enforced at Facility B within the target SLA.
- **Regional Isnād chain:** All facilities contribute to a single regional audit chain. Integrity is verifiable across the region.
- **PDPL compliance — ongoing:** Regulatory engagement transitions from initial review to ongoing compliance monitoring.
- **Data-sharing agreements:** Formal data-sharing agreements are in place between all participating facilities and the SANAD platform.

### 2.6 Success Gates (must be met before advancing to Phase 3)

| Gate | Criteria |
|---|---|
| **Cross-facility interoperability** | Patient records accessible across facilities with consent verification and audit trail. |
| **Regional formulary coverage** | Drug-interaction engine covers the regional formulary with zero gaps in high-risk drug classes. |
| **Insurance activation** | At least one insurer actively using the claims-processing and fraud-detection workflow. |
| **Regional analytics** | Ministry dashboard displaying accurate regional population health data. |
| **Isnād at scale** | Audit chain integrity maintained across all regional facilities with no integrity failures. |
| **PDPL — no critical findings** | Ongoing compliance monitoring yields no unresolved critical findings. |

### 2.7 Dependencies

- Phase 1 success gates met.
- Regional facility identification and institutional agreements.
- Insurer participation agreements.
- HIS integration at each new facility (leveraging patterns established in Phase 1).

---

## Phase 3: National Deployment

**Scope:** Public and private sector facilities nationwide

### 3.1 Objectives

- Deploy SANAD across the Kingdom's health system as the national health-intelligence infrastructure.
- Establish Isnād as the national standard for AI-decision auditability in healthcare.
- Activate the Supply Chain portal for national drug-shortage monitoring.
- Deliver national population-health intelligence on the Ministry dashboard.
- Enable the AI Control Center as the national AI governance instrument for healthcare.

### 3.2 Deployment Approach

National deployment proceeds in regional waves, applying the refined playbook from Phases 1–2. Each new region follows the same integration, training, and validation sequence, with progressively less central-team involvement as the train-the-trainer model scales.

**Priority ordering of regions** is based on:
- Population density and patient volume.
- Digital maturity of regional health infrastructure.
- Regulatory and institutional readiness.
- Strategic alignment with MOH transformation priorities.

### 3.3 New Capabilities Activated

- **National Isnād chain:** A single, verifiable audit chain spanning all participating facilities nationwide.
- **National population-health intelligence:** Disease prevalence, risk distribution, visit trends, and epidemic-radar analysis at the national level.
- **AI Control Center — national scope:** Monitoring all AI engines across all facilities, with national-level confidence trends, decision volumes, and drift detection.
- **Supply Chain portal — national:** Drug-shortage monitoring and distribution optimization across the Kingdom.
- **Research portal — national:** Anonymized research datasets drawn from the national consented population.

### 3.4 Change Management at Scale

- **Regional training hubs:** Each region establishes a training hub staffed by clinical champions from earlier phases. New facility onboarding is managed regionally, not centrally.
- **Continuous education:** Quarterly refresher sessions and new-feature briefings for clinical staff.
- **Feedback aggregation:** Regional feedback is aggregated nationally. Systemic issues are prioritized for platform updates.
- **Citizen communication:** National public-information campaign explaining SANAD's citizen portal, consent rights, and privacy controls. Coordinated with MOH communications.

### 3.5 Data Governance Milestones

- **National PDPL compliance posture:** Ongoing compliance across all participating facilities, monitored by a dedicated compliance function.
- **National Isnād integrity:** Chain integrity verifiable at national scale. Ministry can verify the entire national audit chain in a single operation.
- **Cross-sector consent enforcement:** Consent changes propagate across all participating institutions nationwide within target SLA.
- **Data classification and retention:** National data-classification and retention policies implemented in alignment with PDPL and MOH directives.
- **Third-party AI governance:** Framework established for third-party clinical AI models to operate within the SANAD trust layer, subject to Isnād audit and explainability requirements.

### 3.6 Success Gates

| Gate | Criteria |
|---|---|
| **National coverage** | SANAD operational at target percentage of public and private health facilities (target defined with MOH). |
| **National Isnād** | Single national audit chain with verified integrity across all participating institutions. |
| **National analytics** | Ministry dashboard providing real-time national population-health intelligence. |
| **Cross-sector consent** | Citizen consent changes propagating across all participating institutions within SLA. |
| **AI governance operational** | AI Control Center monitoring all engines at national scale with drift-detection capability. |
| **Supply chain visibility** | National drug-shortage monitoring and early-warning system operational. |
| **Ongoing PDPL compliance** | No unresolved critical compliance findings in rolling quarterly reviews. |

### 3.7 Dependencies

- Phase 2 success gates met.
- MOH endorsement of national rollout plan and regional prioritization.
- National HIS integration standards established (leveraging Phase 1–2 patterns).
- Insurer participation expanded to national carriers.
- Public-information campaign coordination with MOH communications.

---

## Cross-Phase Considerations

### Training Curriculum Summary

| Audience | Phase 1 | Phase 2 | Phase 3 |
|---|---|---|---|
| **Physicians** | Half-day onboarding + 2-week shadow period | Train-the-trainer | Regional hub + quarterly refreshers |
| **Pharmacists** | Focused dispensing workflow session | Cross-facility visibility training | Regional hub |
| **Insurance analysts** | — | Claims workflow + fraud-scoring training | National onboarding |
| **Ministry officials** | Dashboard orientation | Regional analytics briefing | National intelligence briefing |
| **Citizens** | Pilot-site information materials | Regional communication | National public-information campaign |

### Risk Management (Cross-Phase)

| Risk | Mitigation |
|---|---|
| **Clinician resistance** | Phased introduction, clinical champions, explainable AI, physician retains final authority. |
| **Integration complexity** | Standardized integration patterns from Phase 1, reused across sites. |
| **Data quality variance** | Input validation, graceful degradation, data-quality dashboards for site administrators. |
| **Scaling performance** | Horizontal scaling architecture, load testing before each phase gate. |
| **Regulatory evolution** | Extensible consent model and audit architecture accommodate additional requirements. |
| **Cybersecurity** | Role-based access, object-level authorization, tamper-evident audit, encryption at rest and in transit. |

### Governance Structure

- **Joint oversight committee (MOH + Sanad Technologies):** Established in Phase 1, continuing through all phases. Meets at defined cadence with reporting and escalation procedures.
- **Regional deployment leads:** Appointed in Phase 2 for each target region. Responsible for local coordination, training, and issue resolution.
- **National program office:** Established in Phase 3 for centralized coordination, reporting, and compliance monitoring.

---

## Summary

| Phase | Scope | Key Gates |
|---|---|---|
| **Phase 1** | 2–3 pilot hospitals | Operational stability, clinician adoption, PDPL review, Isnād integrity. |
| **Phase 2** | Regional expansion | Cross-facility interoperability, insurance activation, regional analytics. |
| **Phase 3** | National deployment | National Isnād chain, national analytics, AI governance, supply-chain visibility. |

The rollout is gated, not scheduled. Each phase proves the value and trustworthiness required to justify the next. No fantasy timelines. No invented metrics. Measured progression from pilot to national fabric.

**Behind Every Decision.**

---

**Sanad Technologies**
SANAD Health — لكل قرارٍ سند
