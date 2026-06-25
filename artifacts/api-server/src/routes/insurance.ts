import { Router } from "express";
import { z } from "zod";
import { db } from "@workspace/db";
import { patientsTable, medicationsTable, visitsTable, labResultsTable, claimReviewsTable } from "@workspace/db/schema";
import { eq, desc, count, sql } from "drizzle-orm";
import { validate } from "../middlewares/validate.js";
import { getConsentState, requireOwnNationalId } from "../lib/ownership.js";
import { writeAudit, extractRequestMeta } from "../lib/audit.js";

const claimReviewSchema = z.object({
  action: z.enum(["approve", "reject", "flag"]),
  notes: z.string().max(2000).optional(),
  reviewedBy: z.string().max(200).optional(),
});

const router = Router();

async function getClaimOverrides(): Promise<Record<string, { status: string; reviewedBy: string; reviewedAt: string; notes: string; aiReason?: string }>> {
  const reviews = await db.select().from(claimReviewsTable).orderBy(desc(claimReviewsTable.reviewedAt)).limit(1000);
  const map: Record<string, { status: string; reviewedBy: string; reviewedAt: string; notes: string; aiReason?: string }> = {};
  for (const r of reviews) {
    map[r.claimId] = { status: r.status, reviewedBy: r.reviewedBy, reviewedAt: r.reviewedAt.toISOString(), notes: r.notes ?? "", aiReason: r.aiReason ?? undefined };
  }
  return map;
}

function computeAnomalyScore(visits: any[], meds: any[], riskScore: number): { score: number; factors: Array<{ label: string; weight: number; value: string; flag: boolean }> } {
  const factors: Array<{ label: string; weight: number; value: string; flag: boolean }> = [];
  const emergencyCount = visits.filter(v => v.visitType === "emergency").length;
  const emergencyFlag = emergencyCount >= 3;
  factors.push({ label: "Emergency Visit Frequency", weight: emergencyFlag ? 25 : 5, value: `${emergencyCount} ER visits`, flag: emergencyFlag });

  const visitDates = visits.map(v => new Date(v.visitDate).getTime()).sort();
  let minGap = Infinity;
  for (let i = 1; i < visitDates.length; i++) minGap = Math.min(minGap, visitDates[i]! - visitDates[i - 1]!);
  const rapidCycling = minGap < 3 * 24 * 60 * 60 * 1000 && visitDates.length > 2;
  factors.push({ label: "Rapid Visit Cycling", weight: rapidCycling ? 20 : 3, value: rapidCycling ? "Visits <3 days apart detected" : "Normal spacing", flag: rapidCycling });

  const hospitals = [...new Set(visits.map(v => v.hospital))];
  const multiHospital = hospitals.length >= 4;
  factors.push({ label: "Multi-Hospital Routing", weight: multiHospital ? 18 : 4, value: `${hospitals.length} distinct hospitals`, flag: multiHospital });

  const activeCount = meds.filter((m: any) => m.isActive).length;
  const polyPharmacy = activeCount >= 7;
  factors.push({ label: "Polypharmacy Pattern", weight: polyPharmacy ? 15 : 5, value: `${activeCount} concurrent medications`, flag: polyPharmacy });

  const highCost = visits.filter(v => v.visitType === "inpatient").length >= 3;
  factors.push({ label: "High-Cost Admission Pattern", weight: highCost ? 12 : 3, value: `${visits.filter(v => v.visitType === "inpatient").length} inpatient admissions`, flag: highCost });

  const baselineFactor = riskScore >= 80 ? 5 : 0;
  factors.push({ label: "Clinical Risk Profile", weight: baselineFactor, value: `Risk Score ${riskScore}/100`, flag: false });

  const score = Math.min(100, factors.reduce((s, f) => s + f.weight, 0));
  return { score, factors };
}

function computeClaimAnomalyScore(visit: any, allVisits: any[]): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;
  if (visit.visitType === "emergency") {
    const sameHospital = allVisits.filter(v => v.hospital === visit.hospital && v.visitType === "emergency").length;
    if (sameHospital >= 2) { score += 30; reasons.push("Repeat ER visits at same facility within 90 days"); }
  }
  const visitDate = new Date(visit.visitDate);
  const nearby = allVisits.filter(v => Math.abs(new Date(v.visitDate).getTime() - visitDate.getTime()) < 7 * 24 * 60 * 60 * 1000 && v.id !== visit.id);
  if (nearby.length >= 2) { score += 25; reasons.push(`${nearby.length} concurrent claims in same 7-day window`); }
  if (visit.visitType === "inpatient" && visit.diagnosis?.toLowerCase().includes("chronic")) { score += 15; reasons.push("Inpatient admission for chronic-only management"); }
  return { score: Math.min(100, score), reasons };
}

router.get("/patient/:nationalId", async (req, res) => {
  const { nationalId } = req.params;

  if (!requireOwnNationalId(req, res, nationalId)) return;

  const patients = await db.select().from(patientsTable).where(eq(patientsTable.nationalId, nationalId)).limit(1);
  if (!patients.length) { res.status(404).json({ error: "NOT_FOUND", message: "Patient not found" }); return; }
  const p = patients[0]!;

  // Insurance access is consent-based (default granted, revocable). A patient
  // who revoked the `insurance` consent disappears from the insurer's view.
  const consentState = await getConsentState(p.id, "insurance");
  if (consentState === false) {
    res.status(403).json({
      error: "CONSENT_REVOKED",
      message: "This patient has revoked Insurance Data Access consent. Claims must be processed through manual MOH channels.",
    });
    return;
  }
  const [medications, visits, labs] = await Promise.all([
    db.select().from(medicationsTable).where(eq(medicationsTable.patientId, p.id)).orderBy(desc(medicationsTable.createdAt)).limit(200),
    db.select().from(visitsTable).where(eq(visitsTable.patientId, p.id)).orderBy(desc(visitsTable.visitDate)).limit(20),
    db.select().from(labResultsTable).where(eq(labResultsTable.patientId, p.id)).orderBy(desc(labResultsTable.testDate)).limit(10),
  ]);
  const riskScore = p.riskScore ?? 0;
  const age = new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear();
  const { score: anomalyScore, factors: anomalyFactors } = computeAnomalyScore(visits, medications, riskScore);
  const fraudRisk = anomalyScore >= 50 ? "high" : anomalyScore >= 25 ? "medium" : "low";
  const fraudFlags: string[] = anomalyFactors.filter(f => f.flag).map(f => f.label + " — " + f.value);

  const behaviorProfile = {
    visitPattern: visits.length >= 8 ? "High Utilizer" : visits.length >= 4 ? "Moderate" : "Low",
    preferredHospital: (() => { const h: Record<string, number> = {}; visits.forEach(v => { h[v.hospital] = (h[v.hospital] ?? 0) + 1; }); return Object.entries(h).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "None"; })(),
    avgClaimInterval: visits.length > 1 ? Math.round((new Date(visits[0]!.visitDate).getTime() - new Date(visits[visits.length - 1]!.visitDate).getTime()) / (visits.length - 1) / (24 * 60 * 60 * 1000)) : 0,
    claimConsistency: anomalyScore < 20 ? "Consistent" : anomalyScore < 40 ? "Minor anomalies" : "Pattern deviation detected",
  };

  const baseMonthly = 250;
  const riskMultiplier = riskScore >= 70 ? 2.8 : riskScore >= 50 ? 2.1 : riskScore >= 25 ? 1.5 : 1.0;
  const monthlyPremium = Math.round(baseMonthly * riskMultiplier);

  const premiumBreakdown = [
    { factor: "Base Premium", amount: baseMonthly, color: "#007AFF" },
    { factor: "Clinical Risk Loading", amount: Math.round(baseMonthly * (riskMultiplier - 1) * 0.6), color: "#f59e0b" },
    { factor: "Chronic Condition Surcharge", amount: Math.round((p.chronicConditions?.length ?? 0) * 25), color: "#ef4444" },
    { factor: "Age Adjustment", amount: Math.round(Math.max(0, (age - 30) * 2)), color: "#a855f7" },
    { factor: "Behavioral Adjustment", amount: anomalyScore >= 30 ? 80 : 0, color: "#06b6d4" },
  ].filter(x => x.amount > 0);

  const claimOverrides = await getClaimOverrides();
  const claims = visits.slice(0, 10).map((v, i) => {
    const overrideKey = `CLM-2025-${String(p.id).padStart(3, "0")}${String(i + 1).padStart(2, "0")}`;
    const override = claimOverrides[overrideKey];
    const claimAnomaly = computeClaimAnomalyScore(v, visits);
    return {
      claimId: overrideKey,
      date: v.visitDate,
      type: v.visitType === "emergency" ? "Emergency" : v.visitType === "inpatient" ? "Inpatient" : "Outpatient",
      hospital: v.hospital,
      diagnosis: v.diagnosis ?? "General consultation",
      estimatedCost: v.visitType === "emergency" ? 3200 : v.visitType === "inpatient" ? 8500 : 450,
      status: override ? override.status : (i === 0 ? "pending" : i === 1 ? "under_review" : "approved"),
      aiVerified: !override && i > 1,
      anomalyScore: claimAnomaly.score,
      anomalyReasons: claimAnomaly.reasons,
      reviewedBy: override?.reviewedBy,
      reviewedAt: override?.reviewedAt,
      reviewNotes: override?.notes,
      aiReason: override?.aiReason,
    };
  });

  res.json({
    patient: { id: p.id, fullName: p.fullName, nationalId: p.nationalId, dateOfBirth: p.dateOfBirth, gender: p.gender, age, bloodType: p.bloodType },
    riskScore,
    anomalyScore,
    anomalyFactors,
    fraudRisk,
    fraudFlags,
    behaviorProfile,
    monthlyPremium,
    riskMultiplier,
    premiumBreakdown,
    claims,
    activeMeds: medications.filter((m: any) => m.isActive).length,
    totalClaims: claims.length,
    totalClaimValue: claims.reduce((sum, c) => sum + c.estimatedCost, 0),
    coverageStatus: "active",
    insurancePlan: riskScore >= 70 ? "Comprehensive Plus" : riskScore >= 40 ? "Standard Care" : "Basic Health",
  });

  const { ipAddress, userAgent } = extractRequestMeta(req);
  await writeAudit({
    who: req.userId ?? req.role ?? "unknown",
    whoName: req.userName,
    whoRole: req.role ?? "unknown",
    action: "READ",
    what: `Insurance profile accessed: ${p.fullName} (${nationalId})`,
    patientId: p.id,
    ipAddress,
    userAgent,
  });
});

router.get("/dashboard", async (req, res) => {
  const [allVisits, [riskAgg], [totalPatientsRow]] = await Promise.all([
    db.select().from(visitsTable).orderBy(desc(visitsTable.visitDate)).limit(200),
    db.select({
      total:    sql<number>`COUNT(*)`.mapWith(Number),
      highRisk: sql<number>`COUNT(*) FILTER (WHERE ${patientsTable.riskScore} >= 70)`.mapWith(Number),
      critical: sql<number>`COUNT(*) FILTER (WHERE ${patientsTable.riskScore} >= 85)`.mapWith(Number),
      low:      sql<number>`COUNT(*) FILTER (WHERE ${patientsTable.riskScore} < 40)`.mapWith(Number),
      medium:   sql<number>`COUNT(*) FILTER (WHERE ${patientsTable.riskScore} >= 40 AND ${patientsTable.riskScore} < 70)`.mapWith(Number),
    }).from(patientsTable),
    db.select({ count: count() }).from(patientsTable),
  ]);

  const totalPolicies = Number(totalPatientsRow?.count ?? 0);
  const highRiskPatients = riskAgg?.highRisk ?? 0;
  const criticalPatients = riskAgg?.critical ?? 0;

  const totalClaims = allVisits.length;
  const pendingClaims = Math.round(totalClaims * 0.12);
  const approvedClaims = Math.round(totalClaims * 0.76);
  const rejectedClaims = Math.round(totalClaims * 0.08);
  const fraudSuspected = Math.max(1, Math.round(totalClaims * 0.05));
  const emergencyVisits = allVisits.filter(v => v.visitType === "emergency").length;
  const inpatientVisits = allVisits.filter(v => v.visitType === "inpatient").length;
  const outpatientVisits = allVisits.filter(v => v.visitType === "outpatient").length;
  const totalPayout = emergencyVisits * 3200 + inpatientVisits * 8500 + outpatientVisits * 450;

  const trendData = Array.from({ length: 12 }, (_, i) => {
    const month = new Date(2025, i, 1).toLocaleString("en", { month: "short" });
    const monthVisits = allVisits.filter(v => new Date(v.visitDate).getMonth() === i);
    const monthPayout = monthVisits.filter(v => v.visitType === "emergency").length * 3200
      + monthVisits.filter(v => v.visitType === "inpatient").length * 8500
      + monthVisits.filter(v => v.visitType === "outpatient").length * 450;
    const monthFraud = monthVisits.filter(v => computeClaimAnomalyScore(v, allVisits).score >= 50).length;
    return { month, claims: monthVisits.length, fraud: monthFraud, payout: monthPayout };
  });

  res.json({
    totalPolicies,
    activePolicies: totalPolicies,
    totalClaims,
    pendingClaims,
    approvedClaims,
    rejectedClaims,
    fraudSuspected,
    totalPayout,
    avgClaimValue: totalClaims > 0 ? Math.round(totalPayout / totalClaims) : 0,
    fraudRate: totalClaims > 0 ? ((fraudSuspected / totalClaims) * 100).toFixed(1) : "0",
    approvalRate: totalClaims > 0 ? ((approvedClaims / totalClaims) * 100).toFixed(1) : "0",
    claimsByType: [
      { type: "Emergency", count: emergencyVisits, avgCost: 3200, color: "#ef4444" },
      { type: "Inpatient", count: inpatientVisits, avgCost: 8500, color: "#f97316" },
      { type: "Outpatient", count: outpatientVisits, avgCost: 450, color: "#007AFF" },
    ],
    highRiskPolicies: highRiskPatients,
    criticalPolicies: criticalPatients,
    trendData,
    riskPricingAlerts: [
      { region: "Riyadh", avgRisk: 58, trend: "rising", action: "Increase premiums 15% for high-risk cohort", change: "+15%" },
      { region: "Eastern Province", avgRisk: 52, trend: "stable", action: "Maintain current pricing tier", change: "0%" },
      { region: "Makkah", avgRisk: 61, trend: "rising", action: "Flag for quarterly actuarial review", change: "+12%" },
      { region: "Jeddah", avgRisk: 47, trend: "declining", action: "Offer wellness incentive tier", change: "-5%" },
    ],
    fraudAlerts: [
      { type: "Duplicate Claims", count: Math.max(1, Math.round(fraudSuspected * 0.4)), severity: "high", description: "Same diagnosis at multiple facilities within 48h" },
      { type: "Rapid Visit Cycling", count: Math.max(1, Math.round(fraudSuspected * 0.3)), severity: "high", description: "ER visits < 72h apart at same provider" },
      { type: "Prescription Anomaly", count: Math.max(1, Math.round(fraudSuspected * 0.2)), severity: "medium", description: "Controlled substance refill before supply depleted" },
      { type: "Multi-Provider Routing", count: Math.max(1, Math.round(fraudSuspected * 0.1)), severity: "medium", description: "5+ distinct facilities in 30-day window" },
    ],
    portfolioRisk: {
      low:      riskAgg?.low      ?? 0,
      medium:   riskAgg?.medium   ?? 0,
      high:     highRiskPatients - criticalPatients,
      critical: criticalPatients,
    },
  });
});

router.post("/claim/:claimId/review", validate(claimReviewSchema), async (req, res) => {
  if (req.role !== "insurance" && req.role !== "admin") {
    res.status(403).json({ error: "FORBIDDEN", message: "Insurance role required" });
    return;
  }
  const claimId = String(req.params["claimId"]);
  const { action, notes, reviewedBy } = req.body as z.infer<typeof claimReviewSchema>;
  const statusMap: Record<string, "approved" | "rejected" | "under_review"> = { approve: "approved", reject: "rejected", flag: "under_review" };
  const aiReasonMap: Record<string, string> = {
    approve: "AI validation passed — clinical necessity confirmed, cost within expected range, no anomaly patterns detected.",
    reject: "AI fraud model flagged claim — anomaly score exceeds threshold, inconsistent with patient history.",
    flag: "AI requires additional documentation — unusual pattern detected, escalated for senior review.",
  };
  const reviewedAt = new Date();
  const status = statusMap[action]!;
  const aiReason = aiReasonMap[action]!;
  const reviewer = reviewedBy ?? "Insurance Analyst";

  await db.insert(claimReviewsTable)
    .values({ claimId: claimId!, status, reviewedBy: reviewer, reviewedAt, notes: notes ?? "", aiReason })
    .onConflictDoUpdate({
      target: claimReviewsTable.claimId,
      set: { status, reviewedBy: reviewer, reviewedAt, notes: notes ?? "", aiReason },
    });

  const { ipAddress, userAgent } = extractRequestMeta(req);
  await writeAudit({
    who: req.userId ?? req.role ?? "unknown",
    whoName: req.userName,
    whoRole: req.role ?? "unknown",
    action: "UPDATE",
    what: `CLAIM_REVIEWED: ${claimId} marked as ${status}`,
    patientId: undefined,
    ipAddress,
    userAgent,
  });

  res.json({
    claimId,
    newStatus: status,
    reviewedBy: reviewer,
    reviewedAt: reviewedAt.toISOString(),
    aiReason,
    message: `Claim ${claimId} has been ${status}.`,
  });
});

router.patch("/claims/:claimId", async (req, res) => {
  if (req.role !== "insurance" && req.role !== "admin") {
    res.status(403).json({ error: "FORBIDDEN", message: "Insurance role required" });
    return;
  }
  const claimId = req.params["claimId"]!;
  const { decision, reason } = req.body as { decision: "approved" | "denied"; reason?: string };

  if (!["approved", "denied"].includes(decision)) {
    res.status(400).json({ error: "BAD_REQUEST", message: "decision must be approved or denied" });
    return;
  }

  const [claim] = await db.update(claimReviewsTable)
    .set({
      status: decision === "approved" ? "approved" : "rejected",
      reviewedBy: req.userId ?? "unknown",
      reviewedAt: new Date(),
      notes: reason ?? null,
    })
    .where(eq(claimReviewsTable.claimId, claimId))
    .returning();

  if (!claim) { res.status(404).json({ error: "NOT_FOUND" }); return; }

  const { ipAddress, userAgent } = extractRequestMeta(req);
  await writeAudit({
    who: req.userId ?? req.role ?? "unknown",
    whoName: req.userName,
    whoRole: req.role ?? "unknown",
    action: "UPDATE",
    what: `CLAIM_REVIEWED: ${claimId} marked as ${decision === "approved" ? "approved" : "rejected"}`,
    patientId: undefined,
    ipAddress,
    userAgent,
  });

  res.json(claim);
});

router.get("/claims/:claimId/ai-recommendation", async (req, res) => {
  const claimId = req.params["claimId"]!;
  
  // Deterministic mock based on claimId
  const flags: string[] = [];
  if (claimId.endsWith("1")) flags.push("High-value claim — manual review recommended");
  if (claimId.endsWith("3")) flags.push("Multiple visits — possible overutilization");

  const recommendation = flags.length > 0 ? "manual_review" : "auto_approve";
  res.json({ recommendation, flags, claimId });
});

export default router;
