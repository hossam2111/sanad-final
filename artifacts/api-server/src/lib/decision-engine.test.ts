import { describe, it, expect } from "vitest";
import { runDecisionEngine, type DecisionInput } from "./decision-engine.js";

const TODAY = new Date().toISOString().split("T")[0]!;
const THREE_MONTHS_AGO = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]!;
const ONE_MONTH_AGO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]!;

function dob(age: number): string {
  return `${new Date().getFullYear() - age}-01-01`;
}

const healthyYoung: DecisionInput = {
  patient: { dateOfBirth: dob(28), chronicConditions: [], allergies: [], riskScore: 0 },
  medications: [],
  labResults: [],
  visits: [],
};

const diabeticElderly: DecisionInput = {
  patient: {
    dateOfBirth: dob(72),
    chronicConditions: ["السكري من النوع الثاني", "ارتفاع ضغط الدم"],
    allergies: ["Penicillin"],
    riskScore: 45,
  },
  medications: [
    { drugName: "Metformin", isActive: true, startDate: "2023-01-01" },
    { drugName: "Lisinopril", isActive: true, startDate: "2023-01-01" },
    { drugName: "Atorvastatin", isActive: true, startDate: "2023-06-01" },
    { drugName: "Aspirin", isActive: true, startDate: "2022-01-01" },
  ],
  labResults: [
    { testName: "HbA1c", result: "8.8", status: "abnormal", testDate: TODAY, unit: "%" },
    { testName: "Creatinine", result: "1.3", status: "abnormal", testDate: TODAY, unit: "mg/dL" },
  ],
  visits: [
    { visitDate: ONE_MONTH_AGO, visitType: "outpatient", diagnosis: "Diabetes follow-up" },
  ],
};

const criticalPatient: DecisionInput = {
  patient: {
    dateOfBirth: dob(65),
    chronicConditions: ["heart failure", "chronic kidney disease"],
    allergies: [],
    riskScore: 70,
  },
  medications: [
    { drugName: "Furosemide", isActive: true, startDate: "2023-01-01" },
    { drugName: "Digoxin", isActive: true, startDate: "2023-01-01" },
    { drugName: "Warfarin", isActive: true, startDate: "2022-01-01" },
    { drugName: "Amiodarone", isActive: true, startDate: "2024-01-01" },
    { drugName: "Spironolactone", isActive: true, startDate: "2023-06-01" },
    { drugName: "Lisinopril", isActive: true, startDate: "2022-01-01" },
  ],
  labResults: [
    { testName: "Creatinine", result: "4.2", status: "critical", testDate: TODAY, unit: "mg/dL" },
    { testName: "Potassium", result: "6.8", status: "critical", testDate: TODAY, unit: "mEq/L" },
  ],
  visits: [
    { visitDate: ONE_MONTH_AGO, visitType: "emergency", diagnosis: "Heart failure exacerbation" },
    { visitDate: THREE_MONTHS_AGO, visitType: "inpatient", diagnosis: "AKI" },
  ],
};

// ─── Urgency classification ───────────────────────────────────────────────────

describe("urgency classification", () => {
  it("healthy young patient → routine", () => {
    const result = runDecisionEngine(healthyYoung);
    expect(result.urgency).toBe("routine");
  });

  it("critical lab values → immediate", () => {
    const result = runDecisionEngine(criticalPatient);
    expect(result.urgency).toBe("immediate");
  });

  it("risk score ≥ 80 → immediate", () => {
    const input: DecisionInput = {
      patient: { dateOfBirth: dob(80), chronicConditions: ["heart failure", "cancer"], allergies: [], riskScore: 85 },
      medications: Array.from({ length: 5 }, (_, i) => ({ drugName: `Drug${i}`, isActive: true, startDate: "2023-01-01" })),
      labResults: [{ testName: "Hemoglobin", result: "6.0", status: "abnormal", testDate: TODAY, unit: "g/dL" }],
      visits: [],
    };
    const result = runDecisionEngine(input);
    expect(result.urgency).toBe("immediate");
  });

  it("uncontrolled HbA1c + abnormal labs → at least soon (not routine)", () => {
    const result = runDecisionEngine(diabeticElderly);
    expect(result.urgency).not.toBe("routine");
  });
});

// ─── Risk level thresholds ────────────────────────────────────────────────────

describe("risk level thresholds", () => {
  it("score 0 → low risk", () => {
    const result = runDecisionEngine(healthyYoung);
    expect(result.riskLevel).toBe("low");
  });

  it("critical patient has critical or high risk level", () => {
    const result = runDecisionEngine(criticalPatient);
    expect(["critical", "high"]).toContain(result.riskLevel);
  });

  it("riskScore is capped at 100", () => {
    const input: DecisionInput = {
      patient: {
        dateOfBirth: dob(90),
        chronicConditions: ["heart failure", "chronic kidney disease", "cancer", "cirrhosis", "atrial fibrillation"],
        allergies: ["Penicillin", "Sulfa", "NSAIDs", "Contrast"],
        riskScore: 95,
      },
      medications: Array.from({ length: 8 }, (_, i) => ({ drugName: `Drug${i}`, isActive: true, startDate: "2023-01-01" })),
      labResults: [
        { testName: "Creatinine", result: "5.0", status: "critical", testDate: TODAY, unit: "mg/dL" },
        { testName: "HbA1c", result: "12.0", status: "critical", testDate: TODAY, unit: "%" },
        { testName: "Hemoglobin", result: "5.0", status: "critical", testDate: TODAY, unit: "g/dL" },
      ],
      visits: Array.from({ length: 5 }, (_, i) => ({
        visitDate: new Date(Date.now() - i * 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]!,
        visitType: "emergency",
        diagnosis: "Critical episode",
      })),
    };
    const result = runDecisionEngine(input);
    expect(result.riskScore).toBeLessThanOrEqual(100);
  });
});

// ─── Why factors ──────────────────────────────────────────────────────────────

describe("why factors", () => {
  it("critical lab adds a critical impact factor", () => {
    const result = runDecisionEngine(criticalPatient);
    const criticalFactor = result.whyFactors.find(f => f.impact === "critical");
    expect(criticalFactor).toBeDefined();
  });

  it("polypharmacy (≥5 drugs) adds a factor", () => {
    const result = runDecisionEngine(criticalPatient);
    const polypharmacyFactor = result.whyFactors.find(f => f.factor.toLowerCase().includes("polypharmacy"));
    expect(polypharmacyFactor).toBeDefined();
  });

  it("uncontrolled HbA1c > 8.5% adds critical factor for diabetic", () => {
    const result = runDecisionEngine(diabeticElderly);
    const hba1cFactor = result.whyFactors.find(f => f.factor.toLowerCase().includes("hba1c") || f.factor.toLowerCase().includes("diabetes"));
    expect(hba1cFactor).toBeDefined();
  });

  it("healthy young patient has no why factors", () => {
    const result = runDecisionEngine(healthyYoung);
    expect(result.whyFactors).toHaveLength(0);
  });

  it("returns at most 6 why factors", () => {
    const result = runDecisionEngine(criticalPatient);
    expect(result.whyFactors.length).toBeLessThanOrEqual(6);
  });
});

// ─── Age factors ──────────────────────────────────────────────────────────────

describe("age-based risk factors", () => {
  it("patient age 76 triggers Advanced Age factor", () => {
    const input: DecisionInput = { ...healthyYoung, patient: { ...healthyYoung.patient, dateOfBirth: dob(76) } };
    const result = runDecisionEngine(input);
    const ageFactor = result.whyFactors.find(f => f.factor.toLowerCase().includes("75+") || f.factor.toLowerCase().includes("advanced age"));
    expect(ageFactor).toBeDefined();
    expect(ageFactor?.contribution).toBeGreaterThanOrEqual(20);
  });

  it("patient age 62 triggers Senior Age factor", () => {
    const input: DecisionInput = { ...healthyYoung, patient: { ...healthyYoung.patient, dateOfBirth: dob(62) } };
    const result = runDecisionEngine(input);
    const ageFactor = result.whyFactors.find(f => f.factor.toLowerCase().includes("60+") || f.factor.toLowerCase().includes("senior"));
    expect(ageFactor).toBeDefined();
  });

  it("patient age 30 has no age-based factor", () => {
    const result = runDecisionEngine(healthyYoung);
    const ageFactor = result.whyFactors.find(f => f.factor.toLowerCase().includes("age"));
    expect(ageFactor).toBeUndefined();
  });
});

// ─── Confidence ───────────────────────────────────────────────────────────────

describe("confidence bounds", () => {
  it("confidence is always between 0.5 and 0.97", () => {
    [healthyYoung, diabeticElderly, criticalPatient].forEach(input => {
      const result = runDecisionEngine(input);
      expect(result.confidence).toBeGreaterThanOrEqual(0.5);
      expect(result.confidence).toBeLessThanOrEqual(0.97);
    });
  });

  it("critical patient has high confidence", () => {
    const result = runDecisionEngine(criticalPatient);
    expect(result.confidence).toBeGreaterThan(0.85);
  });
});

// ─── SLA deadline ─────────────────────────────────────────────────────────────

describe("SLA deadlines", () => {
  it("immediate urgency SLA is within 3 hours", () => {
    const result = runDecisionEngine(criticalPatient);
    const deadline = new Date(result.slaDeadline).getTime();
    const threeHoursFromNow = Date.now() + 3 * 60 * 60 * 1000;
    expect(deadline).toBeLessThanOrEqual(threeHoursFromNow + 5000); // 5s tolerance
  });

  it("routine urgency SLA is in the future", () => {
    const result = runDecisionEngine(healthyYoung);
    expect(new Date(result.slaDeadline).getTime()).toBeGreaterThan(Date.now());
  });
});

// ─── Explainability ───────────────────────────────────────────────────────────

describe("explainability", () => {
  it("result includes non-empty summary", () => {
    const result = runDecisionEngine(diabeticElderly);
    expect(result.explainability.summary).toBeTruthy();
    expect(result.explainability.summary.length).toBeGreaterThan(20);
  });

  it("result includes clinicalBasis array", () => {
    const result = runDecisionEngine(diabeticElderly);
    expect(Array.isArray(result.explainability.clinicalBasis)).toBe(true);
    expect(result.explainability.clinicalBasis.length).toBeGreaterThan(0);
  });

  it("source is clinical_rules_v4", () => {
    const result = runDecisionEngine(healthyYoung);
    expect(result.source).toBe("clinical_rules_v4");
  });
});

// ─── Arabic condition normalization ──────────────────────────────────────────

describe("Arabic condition normalization", () => {
  it("Arabic diabetes label triggers diabetes-related factor", () => {
    const input: DecisionInput = {
      patient: { dateOfBirth: dob(55), chronicConditions: ["السكري من النوع الثاني"], allergies: [], riskScore: 30 },
      medications: [],
      labResults: [{ testName: "HbA1c", result: "9.0", status: "abnormal", testDate: TODAY, unit: "%" }],
      visits: [],
    };
    const result = runDecisionEngine(input);
    const diabetesFactor = result.whyFactors.find(f => f.factor.toLowerCase().includes("diabetes") || f.factor.toLowerCase().includes("hba1c") || f.factor.toLowerCase().includes("glycemic"));
    expect(diabetesFactor).toBeDefined();
  });

  it("Arabic hypertension label triggers condition factor", () => {
    const input: DecisionInput = {
      patient: { dateOfBirth: dob(55), chronicConditions: ["ارتفاع ضغط الدم"], allergies: [], riskScore: 0 },
      medications: [],
      labResults: [],
      visits: [],
    };
    const result = runDecisionEngine(input);
    expect(result.whyFactors.length).toBeGreaterThan(0);
  });
});
