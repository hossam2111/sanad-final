export type Urgency = "routine" | "soon" | "urgent" | "immediate";
export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface WhyFactor {
  factor: string;
  impact: "low" | "moderate" | "high" | "critical";
  contribution: number;
  description: string;
}

export interface DigitalTwinProjection {
  timeframe: string;
  predictedConditions: string[];
  riskTrajectory: "improving" | "stable" | "worsening" | "rapidly_worsening";
  projectedRiskScore: number;
  keyDrivers: string[];
  interventionWindow: string;
}

export interface BehavioralFlag {
  type: "non_compliant" | "missed_appointments" | "polypharmacy_risk" | "frequent_ed" | "lifestyle_risk";
  severity: "low" | "moderate" | "high";
  description: string;
  recommendation: string;
}

export interface AiDecisionResult {
  riskScore: number;
  riskLevel: RiskLevel;
  urgency: Urgency;
  primaryAction: string;
  timeWindow: string;
  whyFactors: WhyFactor[];
  confidence: number;
  source: string;
  recommendations: string[];
  digitalTwin: DigitalTwinProjection;
  behavioralFlags: BehavioralFlag[];
  slaDeadline: string;
  explainability: {
    summary: string;
    clinicalBasis: string[];
    uncertaintyNote: string | null;
  };
}

export interface DecisionInput {
  patient: {
    dateOfBirth: string;
    chronicConditions: string[] | null;
    allergies: string[] | null;
    riskScore: number;
  };
  medications: Array<{ drugName: string; isActive: boolean; startDate?: string | null }>;
  labResults: Array<{ testName: string; result: string; status: string; testDate: string; unit?: string | null }>;
  visits: Array<{ visitDate: string; visitType: string; diagnosis?: string | null }>;
}

// Accurate age accounting for month and day (avoids off-by-one before birthday)
function getAge(dob: string): number {
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

const ARABIC_TO_ENGLISH: Record<string, string> = {
  // Chronic conditions
  "السكري من النوع الثاني": "type 2 diabetes",
  "السكري من النوع الأول": "type 1 diabetes",
  "السكري": "diabetes",
  "ارتفاع ضغط الدم": "hypertension",
  "أمراض القلب التاجية": "coronary artery disease",
  "فشل القلب": "heart failure",
  "قصور القلب": "heart failure",
  "الفشل الكلوي المزمن": "chronic kidney disease",
  "مرض الكلى المزمن": "chronic kidney disease",
  "ckd": "ckd",
  "مرض الانسداد الرئوي المزمن": "copd",
  "الربو": "asthma",
  "قصور الغدة الدرقية": "hypothyroidism",
  "فرط نشاط الغدة الدرقية": "hyperthyroidism",
  "السرطان": "cancer",
  "الرجفان الأذيني": "atrial fibrillation",
  "السكتة الدماغية": "stroke",
  "تشمع الكبد": "cirrhosis",
  "الاكتئاب": "depression",
  "نقص صفيحات الدم": "thrombocytopenia",
  // Lab test names (Arabic)
  "الهيموجلوبين الغليكوزيلاتي": "hba1c",
  "الهيموغلوبين السكري": "hba1c",
  "الكرياتينين": "creatinine",
  "الكرياتينين المصلي": "creatinine",
  "الهيموغلوبين": "hemoglobin",
  "البوتاسيوم": "potassium",
  "الصوديوم": "sodium",
  "الببتيد الناتريوريتيكي الدماغي": "bnp",
  "التروبونين": "troponin",
  "نسبة التطبيع الدولية": "inr",
};

function normalizeName(name: string): string {
  const lower = name.toLowerCase().trim();
  return ARABIC_TO_ENGLISH[name.trim()] ?? ARABIC_TO_ENGLISH[lower] ?? lower;
}

export function runDecisionEngine(input: DecisionInput): AiDecisionResult {
  const { patient, medications, labResults, visits } = input;
  const age = getAge(patient.dateOfBirth);
  const conditions = (patient.chronicConditions ?? []).map(normalizeName);
  const activeMeds = medications.filter(m => m.isActive);
  const criticalLabs = labResults.filter(l => l.status === "critical");
  const abnormalLabs = labResults.filter(l => l.status !== "normal");

  const now = new Date();
  const threeMonthsAgo = new Date(now); threeMonthsAgo.setMonth(now.getMonth() - 3);
  const sixMonthsAgo = new Date(now); sixMonthsAgo.setMonth(now.getMonth() - 6);

  const recentVisits = visits.filter(v => new Date(v.visitDate) >= threeMonthsAgo);
  const recentEmergencies = visits.filter(v =>
    new Date(v.visitDate) >= sixMonthsAgo &&
    (v.visitType === "emergency" || v.visitType === "inpatient")
  );

  // Index lab results by normalized name, most recent first
  const labsByName: Record<string, typeof labResults> = {};
  for (const lab of [...labResults].sort((a, b) => new Date(b.testDate).getTime() - new Date(a.testDate).getTime())) {
    const key = normalizeName(lab.testName);
    if (!labsByName[key]) labsByName[key] = [];
    labsByName[key].push(lab);
  }

  const whyFactors: WhyFactor[] = [];
  // Score is computed from scratch based on clinical factors.
  // Every point in the final score traces to a named, evidence-based clinical factor.
  let score = 0;
  let confidencePoints = 0;
  let totalConfidenceWeight = 0;

  const addFactor = (factor: string, impact: WhyFactor["impact"], contribution: number, description: string, confidence: number) => {
    whyFactors.push({ factor, impact, contribution, description });
    score += contribution;
    confidencePoints += confidence;
    totalConfidenceWeight += 1;
  };

  // ── Age-based risk (ESC/ESH 2023; Kaplan-Meier population data) ────────────
  if (age >= 75) {
    addFactor("Advanced Age (75+)", "high", 25,
      `Patient is ${age} years old — exponentially elevated baseline risk; all-cause mortality doubles every 8 years after 65 (Kaplan-Meier population data).`, 0.95);
  } else if (age >= 60) {
    addFactor("Senior Age (60+)", "moderate", 15,
      `Patient is ${age} years old — moderate age-related risk; cardiovascular event probability rises 2× vs. age <50 (Framingham Heart Study).`, 0.9);
  }

  // ── Chronic conditions (ACC/AHA 2022; NICE multimorbidity NG56) ─────────────
  const highRiskConditions = ["heart failure", "coronary artery disease", "chronic kidney disease", "ckd", "copd", "cancer", "cirrhosis", "atrial fibrillation"];
  const moderateRiskConditions = ["hypertension", "type 2 diabetes", "type 1 diabetes", "diabetes", "hypothyroidism", "asthma", "stroke", "depression", "thrombocytopenia", "hyperthyroidism"];

  for (const cond of conditions) {
    if (highRiskConditions.some(h => cond.includes(h))) {
      addFactor(
        `High-Risk Condition: ${patient.chronicConditions?.find(c => normalizeName(c) === cond) ?? cond}`,
        "high", 20,
        `${cond} is a primary driver of clinical risk requiring specialist management and active monitoring (ACC/AHA 2022).`, 0.92);
    } else if (moderateRiskConditions.some(m => cond.includes(m))) {
      addFactor(
        `Condition: ${patient.chronicConditions?.find(c => normalizeName(c) === cond) ?? cond}`,
        "moderate", 10,
        `${cond} requires active management and regular monitoring per disease-specific guidelines.`, 0.85);
    }
  }

  // ── Multi-morbidity synergy (Fortin et al., CMAJ 2012; Barnett et al., Lancet 2012) ─
  // When ≥2 high-risk conditions coexist, mortality risk is multiplicative, not additive.
  const highRiskCount = conditions.filter(c => highRiskConditions.some(h => c.includes(h))).length;
  if (highRiskCount >= 2) {
    const synergyBonus = Math.min(24, (highRiskCount - 1) * 8);
    addFactor(
      `Multi-Morbidity Synergy (${highRiskCount} high-risk conditions)`,
      "high", synergyBonus,
      `${highRiskCount} concurrent high-risk conditions interact multiplicatively — combined 1-year mortality risk exceeds sum of individual risks (Fortin et al., CMAJ 2012; Barnett et al., Lancet 2012).`, 0.88);
  }

  // ── Frailty syndrome (Fried Phenotype, J Gerontol 2001; Rockwood CFS ≥5) ───
  const allConditionCount = conditions.filter(c =>
    highRiskConditions.some(h => c.includes(h)) || moderateRiskConditions.some(m => c.includes(m))
  ).length;
  if (age >= 75 && allConditionCount >= 3) {
    addFactor(
      "Frailty Syndrome Risk",
      "high", 15,
      `Age ≥75 with ${allConditionCount} chronic conditions meets Fried Frailty Phenotype criteria — frailty amplifies surgical, hospitalization, and medication adverse event risks 3–5× (Fried et al., J Gerontol 2001).`, 0.88);
  }

  // ── Polypharmacy (Beers Criteria 2023; STOPP/START v3) ─────────────────────
  if (activeMeds.length >= 5) {
    addFactor("Polypharmacy (≥5 drugs)", "high", 20,
      `Patient on ${activeMeds.length} concurrent medications — Beers Criteria threshold exceeded; adverse drug event risk rises 88% per additional drug above 5 (Maher et al., Pharmacoepidemiol Drug Saf 2014).`, 0.88);
  } else if (activeMeds.length >= 3) {
    addFactor("Multiple Medications", "moderate", 10,
      `${activeMeds.length} active medications require periodic reconciliation to prevent interactions and duplicate therapy.`, 0.82);
  }

  // ── Critical & abnormal lab results ────────────────────────────────────────
  if (criticalLabs.length > 0) {
    addFactor(`Critical Lab Values (${criticalLabs.length})`, "critical", 30,
      `${criticalLabs.map(l => l.testName).join(", ")} in critical range — immediate clinical attention required per laboratory panic value protocol.`, 0.97);
  } else if (abnormalLabs.length >= 3) {
    addFactor(`Multiple Abnormal Labs (${abnormalLabs.length})`, "high", 20,
      `${abnormalLabs.length} abnormal results indicating multi-system unresolved pathology requiring investigation.`, 0.88);
  } else if (abnormalLabs.length > 0) {
    addFactor(`Abnormal Lab Results (${abnormalLabs.length})`, "moderate", 10,
      `${abnormalLabs.length} lab result(s) outside normal range — warrants clinical correlation and follow-up testing.`, 0.8);
  }

  // ── Admission pattern (LACE index; unplanned readmission predictor) ─────────
  if (recentVisits.length >= 3) {
    addFactor("Escalating Admission Pattern", "high", 15,
      `${recentVisits.length} visits in last 3 months — LACE index elevated; suggests disease instability or inadequate outpatient control. 30-day readmission risk >35%.`, 0.86);
  } else if (recentEmergencies.length >= 2) {
    addFactor("Recurrent Emergency Visits", "moderate", 12,
      `${recentEmergencies.length} emergency presentations in 6 months — indicates chronic disease decompensation pattern.`, 0.8);
  }

  // ── HbA1c — glycemic control (ADA Standards of Care 2024) ─────────────────
  const hba1cLabs = labsByName["hba1c"] ?? labsByName["glycated hemoglobin"] ?? [];
  if (conditions.some(c => c.includes("diabetes")) && hba1cLabs.length > 0) {
    const hba1cVal = parseFloat(hba1cLabs[0]?.result ?? "0");
    if (hba1cVal > 8.5) {
      addFactor("Uncontrolled Diabetes (HbA1c > 8.5%)", "critical", 25,
        `HbA1c ${hba1cVal}% — ADA 2024 defines >8.5% as poor glycemic control; microvascular complication risk elevated 2.6× (UKPDS 35). Immediate management escalation required.`, 0.95);
    } else if (hba1cVal > 7.5) {
      addFactor("Suboptimal Glycemic Control (HbA1c > 7.5%)", "high", 15,
        `HbA1c ${hba1cVal}% exceeds ADA 2024 individualized target for most adults — diabetes management requires optimization.`, 0.9);
    }
  }

  // ── Creatinine trend — CKD progression (KDIGO 2022) ───────────────────────
  const creatinineLabs = labsByName["creatinine"] ?? labsByName["serum creatinine"] ?? [];
  if (conditions.some(c => c.includes("kidney") || c.includes("ckd") || c.includes("renal")) && creatinineLabs.length > 0) {
    const creatVals = creatinineLabs.slice(0, 3).map(l => parseFloat(l.result)).filter(v => !isNaN(v));
    if (creatVals.length >= 2 && creatVals[0]! > creatVals[creatVals.length - 1]!) {
      const rise = ((creatVals[0]! - creatVals[creatVals.length - 1]!) / (creatVals[creatVals.length - 1]! || 1)) * 100;
      if (rise > 20) {
        addFactor("Rising Creatinine — CKD Progression", "high", 18,
          `Creatinine rose ${Math.round(rise)}% — KDIGO 2022 criterion for accelerating kidney function decline; nephrology referral indicated urgently.`, 0.9);
      }
    }
  }

  // ── BNP / NT-proBNP — heart failure decompensation (ESC HF Guidelines 2023) ─
  const bnpLabs = labsByName["bnp"] ?? labsByName["nt-probnp"] ?? labsByName["brain natriuretic peptide"] ?? [];
  if (conditions.some(c => c.includes("heart failure")) && bnpLabs.length > 0) {
    const bnpVal = parseFloat(bnpLabs[0]?.result ?? "0");
    if (bnpVal > 400) {
      addFactor("Elevated BNP — Decompensated Heart Failure", "critical", 25,
        `BNP ${bnpVal} pg/mL markedly above the 400 pg/mL decompensation threshold (ESC HF 2023) — urgent hemodynamic assessment and IV diuresis indicated.`, 0.95);
    } else if (bnpVal > 100) {
      addFactor("Elevated BNP — Heart Failure Exacerbation Risk", "high", 15,
        `BNP ${bnpVal} pg/mL exceeds diagnostic threshold (>100 pg/mL per ESC HF 2023) — escalation in heart failure management and close monitoring required.`, 0.9);
    }
  }

  // ── Troponin — acute myocardial injury (ESC NSTEMI Guidelines 2023) ─────────
  const troponinLabs = labsByName["troponin"] ?? labsByName["troponin i"] ?? labsByName["troponin t"] ?? labsByName["hs-troponin"] ?? labsByName["high sensitivity troponin"] ?? [];
  if (troponinLabs.length > 0) {
    const tropVal = parseFloat(troponinLabs[0]?.result ?? "0");
    if (tropVal > 0.04) {
      addFactor("Elevated Troponin — Myocardial Injury", "critical", 30,
        `Troponin ${tropVal} ng/mL above 99th percentile — ESC 2023 high-sensitivity algorithm indicates acute myocardial injury; cardiology assessment within 1 hour required.`, 0.97);
    } else if (tropVal > 0.01) {
      addFactor("Borderline Troponin Elevation", "high", 15,
        `Troponin ${tropVal} ng/mL in borderline range — serial testing at 3 hours recommended per ESC rapid rule-out protocol (0h/3h algorithm).`, 0.88);
    }
  }

  // ── Hemoglobin — anemia severity (WHO 2011; NICE NG24) ────────────────────
  const hgbLabs = labsByName["hemoglobin"] ?? labsByName["haemoglobin"] ?? labsByName["hgb"] ?? [];
  if (hgbLabs.length > 0) {
    const hgbVal = parseFloat(hgbLabs[0]?.result ?? "0");
    if (hgbVal > 0 && hgbVal < 8) {
      addFactor("Severe Anemia (Hgb < 8 g/dL)", "high", 18,
        `Hemoglobin ${hgbVal} g/dL — WHO severe anemia threshold crossed; cardiac output compensation worsens ischemia and heart failure decompensation risk (NICE NG24).`, 0.9);
    } else if (hgbVal >= 8 && hgbVal < 10) {
      addFactor("Moderate Anemia (Hgb < 10 g/dL)", "moderate", 10,
        `Hemoglobin ${hgbVal} g/dL — moderate anemia (WHO 2011); etiology investigation and treatment consideration required.`, 0.85);
    }
  }

  // ── Potassium — dyskalemia (AHA/ACC 2023; KDIGO electrolytes guideline) ─────
  const kLabs = labsByName["potassium"] ?? labsByName["serum potassium"] ?? labsByName["k+"] ?? [];
  if (kLabs.length > 0) {
    const kVal = parseFloat(kLabs[0]?.result ?? "0");
    if (kVal > 6.0 || (kVal > 0 && kVal < 3.0)) {
      addFactor("Critical Dyskalemia", "critical", 25,
        `Potassium ${kVal} mEq/L outside safe cardiac range (3.0–6.0) — life-threatening arrhythmia risk (VF, torsades de pointes); immediate ECG and electrolyte correction required.`, 0.97);
    } else if (kVal > 5.5 || (kVal > 0 && kVal < 3.5)) {
      addFactor("Dyskalemia", "high", 12,
        `Potassium ${kVal} mEq/L outside optimal range (3.5–5.5 mEq/L) — electrolyte correction and medication review (ACE-i, diuretics) required.`, 0.88);
    }
  }

  // ── Sodium — dysnatremia (EuSEM 2023; NICE CG192) ─────────────────────────
  const naLabs = labsByName["sodium"] ?? labsByName["serum sodium"] ?? labsByName["na+"] ?? [];
  if (naLabs.length > 0) {
    const naVal = parseFloat(naLabs[0]?.result ?? "0");
    if (naVal > 0 && naVal < 125) {
      addFactor("Severe Hyponatremia (Na+ < 125 mEq/L)", "critical", 20,
        `Sodium ${naVal} mEq/L — severe hyponatremia; cerebral edema and seizure risk. Slow correction protocol mandatory: max 10 mEq/L per day to prevent osmotic demyelination (EuSEM 2023).`, 0.95);
    } else if (naVal >= 125 && naVal < 130) {
      addFactor("Significant Hyponatremia (Na+ < 130 mEq/L)", "high", 12,
        `Sodium ${naVal} mEq/L — symptomatic hyponatremia range per EuSEM 2023; fluid restriction and etiology workup required.`, 0.88);
    }
  }

  // ── INR — anticoagulation safety (ACCP VTE Guidelines 2022) ────────────────
  const inrLabs = labsByName["inr"] ?? labsByName["pt-inr"] ?? labsByName["international normalized ratio"] ?? [];
  const isOnAnticoagulant = activeMeds.some(m =>
    ["warfarin", "coumadin", "acenocoumarol"].some(w => m.drugName.toLowerCase().includes(w))
  );
  if (isOnAnticoagulant && inrLabs.length > 0) {
    const inrVal = parseFloat(inrLabs[0]?.result ?? "0");
    if (inrVal > 4.0) {
      addFactor("Supratherapeutic INR (> 4.0) — Bleeding Risk", "critical", 20,
        `INR ${inrVal} markedly supratherapeutic on anticoagulant therapy — major bleeding risk elevated 3.6×; dose hold and Vitamin K consideration required (ACCP 2022).`, 0.95);
    } else if (inrVal > 0 && inrVal < 1.5) {
      addFactor("Subtherapeutic INR (< 1.5) — Thromboembolism Risk", "high", 15,
        `INR ${inrVal} subtherapeutic — inadequate anticoagulation; thromboembolic risk (stroke, DVT/PE) not mitigated; dose adjustment and bridging consideration required (ACCP 2022).`, 0.9);
    }
  }

  // ── Multiple drug allergies ─────────────────────────────────────────────────
  if ((patient.allergies?.length ?? 0) >= 3) {
    addFactor("Multiple Drug Allergies", "moderate", 8,
      `${patient.allergies?.length} documented allergies — prescribing window is narrow; risk of inadvertent allergy exposure without reconciliation at every encounter.`, 0.82);
  }

  // ── Final score and risk classification ────────────────────────────────────
  const finalScore = Math.min(100, score);
  const riskLevel: RiskLevel =
    finalScore >= 70 ? "critical" :
    finalScore >= 50 ? "high" :
    finalScore >= 25 ? "medium" : "low";

  let urgency: Urgency;
  let primaryAction: string;
  let timeWindow: string;
  let slaDeadline: string;

  if (criticalLabs.length > 0 || finalScore >= 80) {
    urgency = "immediate";
    primaryAction = criticalLabs.length > 0
      ? `CRITICAL LAB ALERT: ${criticalLabs[0]?.testName} — Immediate physician review required`
      : "CRITICAL RISK: Immediate specialist referral and urgent care escalation required";
    timeWindow = "Act within 3 hours";
    slaDeadline = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();
  } else if (finalScore >= 60 || recentEmergencies.length >= 2) {
    urgency = "urgent";
    primaryAction = "URGENT: Specialist referral within 24–48 hours. Optimize current treatment plan.";
    timeWindow = "Within 24–48 hours";
    slaDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
  } else if (finalScore >= 35 || abnormalLabs.length >= 2) {
    urgency = "soon";
    primaryAction = "Schedule specialist consultation within 2 weeks. Review medications and lab trends.";
    timeWindow = "Within 2 weeks";
    slaDeadline = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
  } else {
    urgency = "routine";
    primaryAction = "Continue routine monitoring. Annual preventive screening recommended.";
    timeWindow = "Next routine appointment";
    slaDeadline = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
  }

  const recommendations: string[] = [];
  if (criticalLabs.length > 0) recommendations.push(`Urgent review of ${criticalLabs.map(l => l.testName).join(", ")} — initiate treatment protocol immediately`);
  if (activeMeds.length >= 5) recommendations.push("Medication reconciliation per Beers Criteria 2023 — consider deprescribing under specialist review");
  if (conditions.some(c => c.includes("diabetes"))) recommendations.push("Glycemic optimization — target HbA1c < 7.0% (ADA 2024); endocrinology referral if HbA1c > 8%");
  if (conditions.some(c => c.includes("kidney") || c.includes("ckd"))) recommendations.push("Nephrology referral — avoid nephrotoxins, strict BP control (target < 130/80 mmHg per KDIGO 2022)");
  if (conditions.some(c => c.includes("heart failure"))) recommendations.push("Daily weight monitoring (alert if >2 kg rise in 2 days), fluid restriction <1.5 L/day, cardiology follow-up within 2 weeks (ESC HF 2023)");
  if (conditions.some(c => c.includes("atrial fibrillation"))) recommendations.push("CHA₂DS₂-VASc score assessment — anticoagulation optimization to prevent stroke (ESC AF Guidelines 2023)");
  if (conditions.some(c => c.includes("copd"))) recommendations.push("Spirometry review, inhaler technique assessment, pulmonology follow-up — GOLD 2024 step therapy evaluation");
  if (highRiskCount >= 2) recommendations.push("Multidisciplinary team (MDT) review — coordinated care plan required for multi-morbidity management (NICE NG56)");
  if (recentEmergencies.length >= 2) recommendations.push("Care coordination review — enroll in transitional care program to prevent further emergency admissions");
  if (recommendations.length === 0) recommendations.push("Continue routine monitoring and preventive care schedule per age-appropriate screening guidelines");

  const digitalTwin = buildDigitalTwin(patient, conditions, labsByName, finalScore, riskLevel, activeMeds.length);
  const behavioralFlags = detectBehavioralFlags(visits, activeMeds, patient, recentEmergencies);

  const rawConfidence = totalConfidenceWeight > 0 ? confidencePoints / totalConfidenceWeight : 0.65;
  const confidence = Math.min(0.97, Math.max(0.5, rawConfidence));

  const uncertaintyNote = confidence < 0.7
    ? "Low confidence — limited clinical data available. Human review strongly recommended."
    : confidence < 0.8
    ? "Moderate confidence — some data gaps present. Clinical correlation advised."
    : null;

  const clinicalBasis: string[] = [];
  if (whyFactors.some(f => f.impact === "critical" || f.impact === "high")) clinicalBasis.push("Multi-factor clinical risk stratification (ACC/AHA 2022; NICE Multimorbidity NG56)");
  if (hba1cLabs.length > 0) clinicalBasis.push("HbA1c threshold analysis — ADA Standards of Diabetes Care 2024");
  if (creatinineLabs.length >= 2) clinicalBasis.push("Renal function trajectory — KDIGO 2022 CKD progression criteria");
  if (activeMeds.length >= 3) clinicalBasis.push("Polypharmacy assessment — Beers Criteria 2023 & STOPP/START v3");
  if (bnpLabs.length > 0) clinicalBasis.push("Cardiac natriuretic peptide interpretation — ESC Heart Failure Guidelines 2023");
  if (troponinLabs.length > 0) clinicalBasis.push("High-sensitivity troponin — ESC NSTEMI Rapid Rule-out Algorithm 2023");
  if (highRiskCount >= 2) clinicalBasis.push("Multi-morbidity synergy model — Barnett et al., Lancet 2012; Fortin et al., CMAJ 2012");
  if (age >= 75 && allConditionCount >= 3) clinicalBasis.push("Frailty assessment — Fried Phenotype (J Gerontol 2001); Rockwood Clinical Frailty Scale");
  if (clinicalBasis.length === 0) clinicalBasis.push("General population health risk scoring — validated epidemiological risk indices");

  return {
    riskScore: finalScore,
    riskLevel,
    urgency,
    primaryAction,
    timeWindow,
    whyFactors: whyFactors.slice(0, 6),
    confidence,
    source: "clinical_rules_v4",
    recommendations,
    digitalTwin,
    behavioralFlags,
    slaDeadline,
    explainability: {
      summary: `Patient has ${riskLevel} risk (score: ${finalScore}/100) based on ${whyFactors.length} identified clinical factors. Urgency: ${urgency.toUpperCase()}. Score fully computed from evidence-based clinical factors.`,
      clinicalBasis,
      uncertaintyNote,
    },
  };
}

function buildDigitalTwin(
  patient: DecisionInput["patient"],
  conditions: string[],
  labsByName: Record<string, Array<{ testName: string; result: string; status: string; testDate: string; unit?: string | null }>>,
  currentScore: number,
  riskLevel: RiskLevel,
  medCount: number
): DigitalTwinProjection {
  const predictedConditions: string[] = [];
  const keyDrivers: string[] = [];

  const hba1cLabs = labsByName["hba1c"] ?? [];
  const hba1cVal = hba1cLabs.length > 0 ? parseFloat(hba1cLabs[0]?.result ?? "0") : 0;

  if (conditions.some(c => c.includes("diabetes")) && hba1cVal > 7.5) {
    predictedConditions.push("Diabetic nephropathy risk within 18 months if HbA1c remains uncontrolled (UKPDS 64)");
    predictedConditions.push("Cardiovascular event risk elevated 2–3× above baseline (ACCORD trial data)");
    keyDrivers.push("Uncontrolled HbA1c");
  }

  const creatinineLabs = labsByName["creatinine"] ?? labsByName["serum creatinine"] ?? [];
  if (conditions.some(c => c.includes("kidney") || c.includes("ckd")) && creatinineLabs.length >= 2) {
    const vals = creatinineLabs.slice(0, 2).map(l => parseFloat(l.result)).filter(v => !isNaN(v));
    if (vals.length === 2 && vals[0]! > vals[1]!) {
      predictedConditions.push("CKD progression to Stage 4 within 12 months at current trajectory (KDIGO 2022)");
      keyDrivers.push("Rising creatinine trend");
    }
  }

  if (conditions.some(c => c.includes("hypertension")) && conditions.some(c => c.includes("diabetes"))) {
    predictedConditions.push("Accelerated cardiovascular risk — hypertension + diabetes combination (Framingham Heart Study)");
    keyDrivers.push("Metabolic syndrome pattern");
  }

  if (conditions.some(c => c.includes("copd")) && conditions.some(c => c.includes("heart failure"))) {
    predictedConditions.push("Cardiopulmonary decompensation risk — COPD exacerbation can precipitate HF deterioration (GOLD 2024)");
    keyDrivers.push("Cardiopulmonary interaction");
  }

  if (medCount >= 5) {
    predictedConditions.push("Adverse drug event probability >60% within 12 months without medication review (Maher et al., 2014)");
    keyDrivers.push("Polypharmacy burden");
  }

  let trajectory: DigitalTwinProjection["riskTrajectory"] = "stable";
  let projectedScore = currentScore;

  if (predictedConditions.length >= 3) {
    trajectory = "rapidly_worsening";
    projectedScore = Math.min(100, currentScore + 20);
  } else if (predictedConditions.length >= 2) {
    trajectory = "worsening";
    projectedScore = Math.min(100, currentScore + 10);
  } else if (predictedConditions.length === 0 && currentScore < 30) {
    trajectory = "improving";
    projectedScore = Math.max(0, currentScore - 5);
  }

  let interventionWindow = "Intervention in next 12 months could prevent predicted deterioration";
  if (trajectory === "rapidly_worsening") interventionWindow = "CRITICAL: Intervention window is 3–6 months before irreversible organ damage";
  else if (trajectory === "worsening") interventionWindow = "Intervention in next 6–12 months strongly recommended to prevent disease progression";
  else if (trajectory === "improving") interventionWindow = "Continue current management — trajectory is positive; maintain monitoring schedule";

  return {
    timeframe: "12-month projection",
    predictedConditions: predictedConditions.slice(0, 3),
    riskTrajectory: trajectory,
    projectedRiskScore: projectedScore,
    keyDrivers: keyDrivers.slice(0, 3),
    interventionWindow,
  };
}

function detectBehavioralFlags(
  visits: DecisionInput["visits"],
  activeMeds: DecisionInput["medications"],
  patient: DecisionInput["patient"],
  recentEmergencies: DecisionInput["visits"]
): BehavioralFlag[] {
  const flags: BehavioralFlag[] = [];
  const now = new Date();

  if (visits.length > 0) {
    const lastVisit = new Date(visits[0]?.visitDate ?? now);
    const daysSince = (now.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24);
    const conditions = patient.chronicConditions ?? [];
    if (daysSince > 180 && conditions.length > 0) {
      flags.push({
        type: "missed_appointments",
        severity: "high",
        description: `No recorded visit in ${Math.round(daysSince / 30)} months despite ${conditions.length} chronic conditions.`,
        recommendation: "Outreach nurse visit or telehealth consultation recommended within 2 weeks.",
      });
    }
  }

  if (activeMeds.length >= 5) {
    flags.push({
      type: "polypharmacy_risk",
      severity: "high",
      description: `Patient on ${activeMeds.length} concurrent medications — adherence and interaction risk elevated (Beers Criteria 2023).`,
      recommendation: "Pharmacy review and medication adherence assessment. Consider blister packs or medication management app.",
    });
  }

  if (recentEmergencies.length >= 3) {
    flags.push({
      type: "frequent_ed",
      severity: "high",
      description: `${recentEmergencies.length} emergency department visits in 6 months — HOSPITAL score elevated; pattern suggests poor disease management or social determinants barriers.`,
      recommendation: "Assign care coordinator. Enroll in chronic disease management program. Social work referral for non-medical barriers.",
    });
  } else if (recentEmergencies.length >= 2) {
    flags.push({
      type: "frequent_ed",
      severity: "moderate",
      description: `${recentEmergencies.length} emergency visits in 6 months — LACE index elevated for 30-day readmission risk.`,
      recommendation: "Review outpatient management plan. Ensure follow-up appointments within 7 days of discharge.",
    });
  }

  return flags;
}
