# SANAD Health — Use Cases

**Concrete Scenarios Grounded in Product Capabilities**

*Behind Every Decision*

---

## Use Case 1: Critical-Patient Decision Support

**Actor:** Physician (Consultant)

**Situation:** A 61-year-old male patient presents with three chronic conditions (Type 2 Diabetes, Hypertension, Coronary Artery Disease), five concurrent medications (polypharmacy), and abnormal laboratory results including elevated HbA1c trending over multiple tests.

**What SANAD does:** The clinical decision engine computes a real-time risk score of 95/100 (Critical), classifies urgency as IMMEDIATE with a 3-hour action window, and produces a ranked list of contributing factors — each with its weight and confidence level. The digital-twin engine projects a 12-month trajectory showing rapid worsening, with an intervention window of 3–6 months. Predictive warnings flag persistently abnormal HbA1c and elevated diabetic complication risk.

**Outcome:** The physician receives structured, explainable intelligence — not raw data — and can act within the SLA window with confidence in the reasoning. The entire decision is recorded in the Isnād audit chain.

**Demonstrated in:** Scenario S1 (Clinical Decision Support), Physician Portal. Patient: محمد الغامدي (1000000001).

---

## Use Case 2: Severity-Graded Drug Interaction Detection

**Actor:** Physician (Prescribing)

**Situation:** A patient on Warfarin and Amiodarone (a known critical interaction pair) requires an additional prescription. The physician considers Metronidazole and, separately, Ciprofloxacin.

**What SANAD does:** The drug-interaction engine evaluates each proposed addition against the patient's active medication list. Metronidazole is flagged as HIGH severity (enhances anticoagulation — unsafe). Ciprofloxacin is flagged as MODERATE (monitor INR). The engine reasons about each pair independently, producing severity-specific guidance rather than a binary warning.

**Outcome:** The physician receives differentiated guidance — not "interaction detected" for everything, but a graded assessment that distinguishes truly dangerous combinations from manageable ones. This reduces alert fatigue while maintaining safety.

**Demonstrated in:** Scenario S2 (Drug Interaction Detection), Physician Portal. Patient: خالد الغامدي (1000000003).

---

## Use Case 3: Cross-Class Interaction Catch (Serotonin Syndrome)

**Actor:** Physician (Prescribing)

**Situation:** A patient on Fluoxetine (SSRI antidepressant) is being considered for Tramadol (opioid analgesic with serotonergic activity). These drugs are from different therapeutic classes, and the interaction is not obvious from class labels alone.

**What SANAD does:** The drug-interaction engine identifies a CRITICAL interaction: serotonin syndrome risk. This cross-class interaction — between an antidepressant and a pain medication — is precisely the type that is easy to miss in manual review because the drugs serve different clinical purposes.

**Outcome:** A potentially life-threatening interaction is caught before prescribing. The alert is graded CRITICAL, not merely "moderate," ensuring it is not dismissed as routine.

**Demonstrated in:** Scenario S2 (Drug Interaction Detection), Physician Portal. Patient: سارة العتيبي (1000000006).

---

## Use Case 4: Emergency Patient Retrieval (Break-Glass)

**Actor:** Emergency Responder

**Situation:** A patient arrives at the emergency department unconscious and unable to provide consent or medical history. The responder needs blood type, allergies, active medications, and risk level within seconds.

**What SANAD does:** The emergency portal retrieves the patient's critical clinical profile by National ID: blood type (B+), allergies (iodine contrast, aspirin, codeine), active medications (Warfarin, Amiodarone), risk level (Critical), and pre-computed clinical actions — DO NOT GIVE aspirin or codeine, ALERT before contrast imaging, Warfarin-Amiodarone flagged for urgent review.

**Outcome:** The responder has actionable, life-saving information in seconds. The access is permitted without prior consent because clinical necessity demands it — but every lookup is permanently logged in the Isnād chain with the accessor's identity, timestamp, and clinical context. Break-glass access is immediate but never silent.

**Demonstrated in:** Scenario S3 (Emergency Patient Retrieval), Emergency Portal. Patient: خالد الغامدي (1000000003).

---

## Use Case 5: Real-Time Consent Revocation

**Actor:** Citizen (Patient)

**Situation:** A citizen decides they no longer wish their insurance provider to access their clinical record for claims processing. They want the change to take effect immediately — not after a review cycle or an administrative request.

**What SANAD does:** The citizen opens their privacy dashboard in the Citizen portal and toggles Insurance Data Access to OFF. The consent change is enforced instantly at the data boundary. When the insurer next attempts to access the citizen's record through the Insurance portal, access is denied with a clear message: "Insurance Data Access consent revoked."

**Outcome:** The citizen's choice has immediate, verifiable effect. The insurer is locked out in the moment the citizen decides — not after an administrative process. The consent change is recorded in the Isnād chain with its timestamp and legal basis.

**Demonstrated in:** Scenario S4 (Consent Management), Citizen Portal → Insurance Portal. Patient: محمد الغامدي (1000000001). Contrast case: لطيفة الحربي (1000000008), who has pre-revoked insurance consent.

---

## Use Case 6: National Audit Chain Verification

**Actor:** Ministry Official / Regulator

**Situation:** A deputy minister needs to verify that the national AI-decision audit trail has not been tampered with — that every decision, every access event, and every consent change is intact and unaltered.

**What SANAD does:** The Ministry portal provides a one-click "Verify Integrity" function on the Isnād audit chain. The system traverses the entire hash chain (SHA-256), verifying that each record's hash matches the chain. The result: VERIFIED or INTEGRITY FAILURE. The audit log contains all events — including break-glass emergency access, consent changes, medication dispensing, and AI decisions — with WHO, WHAT, WHEN, and WHY for each.

**Outcome:** The ministry has mathematical assurance of audit integrity. Any tampering — even a single altered record — would produce a chain-integrity failure. This is not a compliance report generated on request; it is a structural property of the system that can be verified at any time.

**Demonstrated in:** Scenario S5 (National Health Intelligence), Ministry/Admin Portal.

---

## Use Case 7: Family Genetic Risk Screening

**Actor:** Family Member (Spouse)

**Situation:** A wife wants to understand hereditary health risks that may affect her family — particularly shared conditions between her husband and his siblings that could indicate genetic predisposition in their children.

**What SANAD does:** The Family portal loads the family tree for members who have granted family-linking consent. Each family member's AI-computed risk score is displayed. Shared conditions are highlighted (e.g., Type 2 Diabetes, Hypertension across multiple siblings). A Genetic Risks tab identifies hereditary risk patterns, provides heritability scores, and generates a family-wide screening plan. Relatives' National IDs are masked (displayed as "••••••0002") to protect privacy even within the family view.

**Outcome:** The family gains actionable insight into hereditary risks and a concrete screening plan — powered by real clinical data, not self-reported questionnaires. Access is gated entirely by individual consent: a family member who has not granted linking (e.g., سعاد الغامدي) cannot be viewed, and the attempt is logged.

**Demonstrated in:** Scenario S6 (Family Access Workflow), Family Portal. Family: the Al-Ghamdi family. Consent-denied contrast: سعاد الغامدي (1000000002).

---

## Use Case 8: Insurance Fraud Pattern Detection

**Actor:** Insurance Analyst

**Situation:** An insurer needs to identify potentially fraudulent claim patterns without relying on subjective review or crude cost thresholds that flag genuinely sick patients.

**What SANAD does:** The behavioral anomaly engine scores each patient's claim pattern against behavioral indicators: number of emergency visits across distinct facilities, visit frequency (e.g., two visits 2 days apart), consistency of findings across visits, and hospital-shopping signatures. For سعد العنزي, the engine identifies HIGH fraud risk based on 4 emergency visits across 4 different hospitals with unremarkable findings — classic doctor-shopping. For محمد الغامدي, the engine distinguishes genuine clinical severity (risk 95/100, three chronic conditions) from billing anomaly and does NOT flag him as a fraud risk.

**Outcome:** The insurer receives risk-calibrated fraud scoring that reasons about behavior patterns, not just cost. Genuinely sick patients are cleared. Behavioral anomalies are surfaced with supporting evidence. Claims can be flagged for review with an auditable basis.

**Demonstrated in:** Scenario S7 (Insurance Authorization Workflow), Insurance Portal. Fraud case: سعد العنزي (1000000007). Contrast: محمد الغامدي (1000000001).

---

## Use Case 9: Pharmacy Dispensing with Safety Checks

**Actor:** Pharmacist

**Situation:** A pharmacist prepares to dispense a medication for a patient who has known drug interactions on their active medication list.

**What SANAD does:** The Pharmacy portal presents the patient's prescriptions with real-time drug-interaction checks — the same engine that informed the prescribing physician. Interactions are severity-graded and visible before dispensing. Each dispense event generates a server-issued reference number (e.g., RX-2026-NNNNN-XXXX) that is written into the Isnād audit trail — not a number generated by the browser.

**Outcome:** The pharmacist has a second safety gate at the dispensing point, independent of the prescribing physician's review. The dispense event is auditable with a tamper-evident reference number. The same drug-interaction intelligence operates at both ends of the medication chain.

**Demonstrated in:** Scenario S2 (Drug Interaction Detection — pharmacy view), Pharmacy Portal. Patient: خالد الغامدي (1000000003).

---

## Use Case 10: Population Health Surveillance

**Actor:** Ministry Epidemiologist / Policy Analyst

**Situation:** A ministry official needs real-time visibility into disease prevalence, risk distribution, and visit trends across the patient population to inform policy decisions and resource allocation.

**What SANAD does:** The Ministry dashboard aggregates population health data from the same clinical records that power individual portals: condition prevalence (with hypertension and diabetes leading), age distribution, risk-level distribution (low through critical), regional statistics, and a 12-month visit trend with emergency and inpatient breakdowns. AI decision metrics show engine activity, and the epidemic radar provides early-warning disease-burden analysis.

**Outcome:** The ministry official sees population health intelligence derived from live clinical data — not a separate analytics system operating on stale exports. The same data that informs a physician's patient decision informs the ministry's policy decision, ensuring consistency between clinical reality and policy visibility.

**Demonstrated in:** Scenario S5 (National Health Intelligence), Ministry/Admin Portal.

---

## Use Case 11: Research Data Access Under Consent

**Actor:** Clinical Researcher

**Situation:** A researcher needs access to population health data for a study, but only from patients who have explicitly opted in to research participation.

**What SANAD does:** The Research portal provides anonymized population health data. Access is gated by the Research Participation consent flag — only patients who have opted in are included. The anonymization process removes identifying information while preserving clinical utility. The researcher's access is logged in the Isnād chain.

**Outcome:** Research proceeds on consented, anonymized data with a clear audit trail. Citizens who have not opted in are excluded automatically — their data is never surfaced to the research portal, regardless of clinical relevance. Consent enforcement is structural, not procedural.

**Demonstrated in:** Research Portal. Consent toggle demonstrated in Scenario S4 (Consent Management).

---

## Use Case 12: AI Engine Monitoring and Drift Detection

**Actor:** AI Governance Officer / Technical Oversight

**Situation:** An oversight official needs to monitor the performance, confidence trends, and decision volumes of all AI engines operating within SANAD to ensure they remain within acceptable parameters.

**What SANAD does:** The AI Control Center provides a nine-engine status grid showing operational status, confidence trends over time, decision volumes, and drift-detection indicators. If an engine's confidence degrades or its outputs diverge from established baselines, the drift-detection system surfaces the anomaly for review.

**Outcome:** AI governance is not a periodic audit — it is continuous monitoring. The oversight official can verify that AI engines are operating as intended, identify degradation before it affects clinical decisions, and maintain an auditable record of AI performance over time.

**Demonstrated in:** AI Control Center Portal.

---

*Each use case above is grounded in a real product capability and, where indicated, directly demonstrable in the seeded demo environment using the Al-Ghamdi family cast and supporting characters.*
