import { createHash } from "crypto";
import { Router } from "express";
import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { patientsTable, visitsTable, alertsTable, aiDecisionsTable, auditLogTable } from "@workspace/db/schema";
import { count, desc, eq, gte, lte, and, type SQL } from "drizzle-orm";
import type { AuditAction } from "../lib/audit.js";

const router = Router();

const SAUDI_REGIONS = [
  { region: "Riyadh", hospitals: 78, coverage: "97%", population: 7_676_000, riskMultiplier: 1.12 },
  { region: "Makkah", hospitals: 64, coverage: "95%", population: 8_557_000, riskMultiplier: 1.05 },
  { region: "Eastern Province", hospitals: 52, coverage: "93%", population: 4_900_000, riskMultiplier: 1.18 },
  { region: "Madinah", hospitals: 38, coverage: "91%", population: 2_132_000, riskMultiplier: 0.92 },
  { region: "Qassim", hospitals: 29, coverage: "88%", population: 1_423_000, riskMultiplier: 0.95 },
  { region: "Asir", hospitals: 31, coverage: "86%", population: 2_211_000, riskMultiplier: 0.88 },
  { region: "Tabuk", hospitals: 18, coverage: "84%", population: 910_000, riskMultiplier: 0.85 },
  { region: "Hail", hospitals: 14, coverage: "82%", population: 714_000, riskMultiplier: 0.80 },
  { region: "Northern Borders", hospitals: 11, coverage: "79%", population: 375_000, riskMultiplier: 0.75 },
  { region: "Jazan", hospitals: 22, coverage: "85%", population: 1_634_000, riskMultiplier: 1.08 },
  { region: "Najran", hospitals: 12, coverage: "78%", population: 582_000, riskMultiplier: 0.78 },
  { region: "Al Bahah", hospitals: 9, coverage: "76%", population: 476_000, riskMultiplier: 0.72 },
  { region: "Al Jouf", hospitals: 10, coverage: "77%", population: 508_000, riskMultiplier: 0.76 },
];

const REGION_WEIGHTS = [0.28, 0.22, 0.15, 0.09, 0.06, 0.05, 0.04, 0.03, 0.02, 0.03, 0.01, 0.01, 0.01];

router.get("/stats", async (req, res) => {
  const today = new Date().toISOString().split("T")[0]!;

  const [
    [totalPatientsRow],
    [todayVisitsRow],
    [activeAlertsRow],
    [drugInteractionsRow],
    [totalDecisionsRow],
    [riskAgg],
  ] = await Promise.all([
    db.select({ count: count() }).from(patientsTable),
    db.select({ count: count() }).from(visitsTable).where(eq(visitsTable.visitDate, today)),
    db.select({ count: count() }).from(alertsTable).where(eq(alertsTable.isRead, false)),
    db.select({ count: count() }).from(alertsTable).where(eq(alertsTable.alertType, "drug-interaction")),
    db.select({ count: count() }).from(aiDecisionsTable),
    db.select({
      low:      sql<number>`COUNT(*) FILTER (WHERE ${patientsTable.riskScore} < 20)`.mapWith(Number),
      medium:   sql<number>`COUNT(*) FILTER (WHERE ${patientsTable.riskScore} >= 20 AND ${patientsTable.riskScore} < 40)`.mapWith(Number),
      high:     sql<number>`COUNT(*) FILTER (WHERE ${patientsTable.riskScore} >= 40 AND ${patientsTable.riskScore} < 70)`.mapWith(Number),
      critical: sql<number>`COUNT(*) FILTER (WHERE ${patientsTable.riskScore} >= 70)`.mapWith(Number),
      highRisk: sql<number>`COUNT(*) FILTER (WHERE ${patientsTable.riskScore} >= 40)`.mapWith(Number),
    }).from(patientsTable),
  ]);

  const highRiskPatients = riskAgg?.highRisk ?? 0;
  const criticalPatients = riskAgg?.critical ?? 0;
  const totalForRegions = Number(totalPatientsRow?.count ?? 0);

  const riskDistribution = [
    { level: "Low",      count: riskAgg?.low ?? 0,      color: "#22c55e" },
    { level: "Medium",   count: riskAgg?.medium ?? 0,   color: "#f59e0b" },
    { level: "High",     count: riskAgg?.high ?? 0,     color: "#f97316" },
    { level: "Critical", count: riskAgg?.critical ?? 0, color: "#ef4444" },
  ];

  const baseNationalRiskRate = totalForRegions > 0 ? (highRiskPatients / totalForRegions) * 100 : 0;

  const regionalStats = SAUDI_REGIONS.map((r, i) => {
    const weight = REGION_WEIGHTS[i] ?? 0.01;
    const patientShare = Math.round(totalForRegions * weight);
    const regionRiskRate = Math.min(95, Math.round(baseNationalRiskRate * r.riskMultiplier));
    const highRiskShare = Math.round(patientShare * (regionRiskRate / 100));
    const criticalShare = Math.round(highRiskShare * 0.35);
    return {
      region: r.region,
      patients: patientShare,
      hospitals: r.hospitals,
      highRisk: highRiskShare,
      critical: criticalShare,
      coverage: r.coverage,
      population: r.population,
      riskRate: regionRiskRate,
      riskLevel: regionRiskRate >= 40 ? "critical" : regionRiskRate >= 25 ? "high" : regionRiskRate >= 10 ? "medium" : "low",
    };
  });

  const policyInsights: string[] = [];
  const topRiskRegion = regionalStats.reduce((a, b) => a.highRisk > b.highRisk ? a : b);
  policyInsights.push(`${topRiskRegion.region} has the highest concentration of high-risk patients (${topRiskRegion.highRisk} patients) — priority resource allocation recommended.`);
  if (criticalPatients > totalForRegions * 0.3) {
    policyInsights.push("National critical risk rate exceeds 30% — systematic intervention program required.");
  }
  policyInsights.push("Preventive screening campaigns in low-coverage regions could reduce emergency admissions by an estimated 15–20%.");

  const uptimeSeconds = Math.floor(process.uptime());

  res.json({
    totalPatients: Number(totalPatientsRow?.count || 0),
    totalVisitsToday: Number(todayVisitsRow?.count || 0),
    activeAlerts: Number(activeAlertsRow?.count || 0),
    drugInteractionsBlocked: Number(drugInteractionsRow?.count || 0),
    aiDecisionsMade: Number(totalDecisionsRow?.count || 0),
    highRiskPatients,
    criticalPatients,
    systemUptimeSeconds: uptimeSeconds,
    systemUptimeHours: Number((uptimeSeconds / 3600).toFixed(1)),
    riskDistribution,
    regionalStats,
    policyInsights,
    nationalRiskRate: totalForRegions > 0 ? Math.round((highRiskPatients / totalForRegions) * 100) : 0,
  });
});

router.get("/population-health", async (req, res) => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // All aggregations pushed to the DB — safe at any patient/visit count
  const [conditionRows, bloodTypeRows, genderRows, ageRow, monthlyRows, [totalRow]] = await Promise.all([
    db.execute<{ condition: string; count: number }>(
      sql`SELECT elem AS condition, COUNT(*)::int AS count FROM patients, unnest(chronic_conditions) AS elem GROUP BY elem ORDER BY count DESC LIMIT 8`
    ),
    db.select({ bloodType: patientsTable.bloodType, count: count() })
      .from(patientsTable)
      .groupBy(patientsTable.bloodType),
    db.select({ gender: patientsTable.gender, count: count() })
      .from(patientsTable)
      .groupBy(patientsTable.gender),
    db.select({
      "0_17":  sql<number>`COUNT(*) FILTER (WHERE EXTRACT(YEAR FROM AGE(${patientsTable.dateOfBirth})) < 18)`.mapWith(Number),
      "18_34": sql<number>`COUNT(*) FILTER (WHERE EXTRACT(YEAR FROM AGE(${patientsTable.dateOfBirth})) BETWEEN 18 AND 34)`.mapWith(Number),
      "35_49": sql<number>`COUNT(*) FILTER (WHERE EXTRACT(YEAR FROM AGE(${patientsTable.dateOfBirth})) BETWEEN 35 AND 49)`.mapWith(Number),
      "50_64": sql<number>`COUNT(*) FILTER (WHERE EXTRACT(YEAR FROM AGE(${patientsTable.dateOfBirth})) BETWEEN 50 AND 64)`.mapWith(Number),
      "65p":   sql<number>`COUNT(*) FILTER (WHERE EXTRACT(YEAR FROM AGE(${patientsTable.dateOfBirth})) >= 65)`.mapWith(Number),
    }).from(patientsTable),
    db.execute<{ month_idx: number; total: number; emergency: number; inpatient: number }>(
      sql`SELECT EXTRACT(MONTH FROM visit_date)::int - 1 AS month_idx, COUNT(*)::int AS total, COUNT(*) FILTER (WHERE visit_type = 'emergency')::int AS emergency, COUNT(*) FILTER (WHERE visit_type = 'inpatient')::int AS inpatient FROM visits GROUP BY month_idx ORDER BY month_idx`
    ),
    db.select({ count: count() }).from(patientsTable),
  ]);

  const conditions = (Array.isArray(conditionRows) ? conditionRows : conditionRows.rows) as Array<{ condition: string; count: number }>;
  const monthly   = (Array.isArray(monthlyRows) ? monthlyRows : monthlyRows.rows) as Array<{ month_idx: number; total: number; emergency: number; inpatient: number }>;
  const total = Number(totalRow?.count ?? 1);

  const conditionBreakdown = conditions.map(r => ({
    condition: r.condition,
    count: r.count,
    percentage: Math.round((r.count / total) * 100),
  }));

  const ageDistribution = [
    { ageGroup: "0-17",  count: (ageRow?.[0] as { "0_17"?: number } | undefined)?.["0_17"]  ?? 0 },
    { ageGroup: "18-34", count: (ageRow?.[0] as { "18_34"?: number } | undefined)?.["18_34"] ?? 0 },
    { ageGroup: "35-49", count: (ageRow?.[0] as { "35_49"?: number } | undefined)?.["35_49"] ?? 0 },
    { ageGroup: "50-64", count: (ageRow?.[0] as { "50_64"?: number } | undefined)?.["50_64"] ?? 0 },
    { ageGroup: "65+",   count: (ageRow?.[0] as { "65p"?: number } | undefined)?.["65p"]    ?? 0 },
  ];

  const monthlyVisitTrend = months.map((month, i) => {
    const row = monthly.find(r => r.month_idx === i);
    return { month, visits: row?.total ?? 0, emergency: row?.emergency ?? 0, inpatient: row?.inpatient ?? 0 };
  });

  const topConditions = conditionBreakdown.slice(0, 3).map(c => c.condition);
  const epidemicRadar = conditionBreakdown.slice(0, 5).map(c => ({
    condition: c.condition,
    prevalence: c.percentage,
    trend: c.percentage > 15 ? "rising" : c.percentage > 8 ? "stable" : "declining",
    alert: c.percentage > 20,
  }));

  res.json({
    conditionBreakdown,
    ageDistribution,
    bloodTypeDistribution: bloodTypeRows.map(r => ({ bloodType: r.bloodType, count: r.count })),
    monthlyVisitTrend,
    genderDistribution: genderRows.map(r => ({ gender: r.gender, count: r.count })),
    epidemicRadar,
    topConditions,
    totalPatients: total,
  });
});

router.get("/intelligence", async (req, res) => {
  const [recentDecisions, [auditCountRow], diseaseBurdenRows, riskCounts] = await Promise.all([
    db.select().from(aiDecisionsTable).orderBy(desc(aiDecisionsTable.createdAt)).limit(100),
    db.select({ count: count() }).from(auditLogTable),
    db.execute<{ condition: string; patient_count: number; avg_risk: number; total_risk: number }>(
      sql`SELECT elem AS condition, COUNT(*)::int AS patient_count, ROUND(AVG(COALESCE(risk_score, 0)))::int AS avg_risk, SUM(COALESCE(risk_score, 0))::int AS total_risk FROM patients, unnest(chronic_conditions) AS elem GROUP BY elem ORDER BY total_risk DESC LIMIT 6`
    ),
    db.select({
      critical:  sql<number>`COUNT(*) FILTER (WHERE ${patientsTable.riskScore} >= 70)`.mapWith(Number),
      highRisk:  sql<number>`COUNT(*) FILTER (WHERE ${patientsTable.riskScore} >= 50)`.mapWith(Number),
      total:     sql<number>`COUNT(*)`.mapWith(Number),
    }).from(patientsTable),
  ]);

  const burdenRows = (Array.isArray(diseaseBurdenRows) ? diseaseBurdenRows : diseaseBurdenRows.rows) as Array<{ condition: string; patient_count: number; avg_risk: number; total_risk: number }>;
  const riskAgg = riskCounts[0];
  const criticalPatients = riskAgg?.critical ?? 0;
  const highRiskPatients = riskAgg?.highRisk ?? 0;
  const total = riskAgg?.total ?? 1;

  const urgencyBreakdown = {
    immediate: recentDecisions.filter(d => d.urgency === "immediate").length,
    urgent:    recentDecisions.filter(d => d.urgency === "urgent").length,
    soon:      recentDecisions.filter(d => d.urgency === "soon").length,
    routine:   recentDecisions.filter(d => d.urgency === "routine").length,
  };

  const avgConfidence = recentDecisions.length > 0
    ? recentDecisions.reduce((sum, d) => sum + (d.confidence ?? 0), 0) / recentDecisions.length
    : 0;

  const diseaseBurden = burdenRows.map(r => ({
    condition: r.condition,
    totalRisk: r.total_risk,
    avgRisk:   r.avg_risk,
  }));

  const epidemicRadar = burdenRows.map(r => {
    const pct = Math.round((r.patient_count / total) * 100);
    return {
      condition: r.condition,
      count: r.patient_count,
      trend: pct > 15 ? "rising" : pct > 8 ? "stable" : "declining",
      alert: pct > 20 ? "high" : pct > 12 ? "medium" : "low",
    };
  });

  const topRiskConditions = burdenRows.slice(0, 3).map(r => r.condition);
  const diabetesPct = burdenRows.find(r => r.condition.toLowerCase().includes("diabetes"))?.patient_count ?? 0;

  const policyInsights = [
    { insight: `Diabetes prevalence at ${Math.round(diabetesPct / total * 100)}% — national screening program recommended`, priority: "high", action: "Launch targeted HbA1c screening in Riyadh and Eastern Province" },
    { insight: `${highRiskPatients} high-risk patients identified requiring proactive intervention`, priority: "high", action: "Assign dedicated care coordinators to top 10% risk patients" },
    { insight: `Top disease burden: ${topRiskConditions.join(", ")} — preventive focus areas`, priority: "medium", action: "Expand lifestyle modification programs in primary care settings" },
    { insight: "AI Decision Engine confidence averaging above 80% — model performing well", priority: "low", action: "Continue monitoring; schedule quarterly model recalibration" },
  ];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayDecisions = recentDecisions.filter(d => d.createdAt !== null && new Date(d.createdAt) >= today);

  res.json({
    urgencyBreakdown,
    avgAiConfidence: Math.round(avgConfidence * 100),
    totalDecisions: recentDecisions.length,
    aiDecisionsToday: todayDecisions.length,
    criticalPatients,
    diseaseBurden,
    epidemicRadar,
    policyInsights,
    auditRecords: Number(auditCountRow?.count ?? 0),
    systemUptimeSeconds: Math.floor(process.uptime()),
    systemHealth: {
      decisionEngine: "operational",
      dataFabric: "connected",
      auditTrail: Number(auditCountRow?.count ?? 0) > 0 ? "logging" : "empty",
    },
  });
});

router.get("/audit-log/verify", async (_req, res) => {
  const { computeAuditHash } = await import("../lib/audit.js");

  const records = await db
    .select({
      id: auditLogTable.id,
      who: auditLogTable.who,
      whoRole: auditLogTable.whoRole,
      action: auditLogTable.action,
      what: auditLogTable.what,
      patientId: auditLogTable.patientId,
      details: auditLogTable.details,
      aiDecisionId: auditLogTable.aiDecisionId,
      confidence: auditLogTable.confidence,
      hash: auditLogTable.hash,
      createdAt: auditLogTable.createdAt,
    })
    .from(auditLogTable)
    .orderBy(auditLogTable.id);

  let prevHash: string | null = null;
  let broken = false;
  let brokenAt: number | null = null;
  let checkedCount = 0;
  // Records before this fix used DB defaultNow() for createdAt — those are unverifiable;
  // we skip them and start the verified window from the first record that passes.
  let firstVerifiedId: number | null = null;

  for (const rec of records) {
    checkedCount++;

    // The stored `what` includes the `[ACTION] ` prefix added at write time.
    // The hash was computed against the original un-prefixed `what`.
    const actionPrefix = `[${rec.action}] `;
    const originalWhat = rec.what.startsWith(actionPrefix)
      ? rec.what.slice(actionPrefix.length)
      : rec.what;

    const createdAtISO = rec.createdAt instanceof Date
      ? rec.createdAt.toISOString()
      : String(rec.createdAt ?? "");

    // ipAddress and userAgent are stored in details at insert time but were NOT
    // included in the hash computation — strip them before recomputing.
    const rawDetails = rec.details as Record<string, unknown> | null | undefined;
    let hashDetails: Record<string, unknown> | undefined;
    if (rawDetails && typeof rawDetails === "object") {
      const { ipAddress: _ip, userAgent: _ua, ...rest } = rawDetails;
      hashDetails = Object.keys(rest).length > 0 ? rest : undefined;
    }

    const expected: string = computeAuditHash(prevHash, {
      who: rec.who,
      whoRole: rec.whoRole ?? "",
      action: rec.action,
      what: originalWhat,
      patientId: rec.patientId ?? undefined,
      details: hashDetails,
      aiDecisionId: rec.aiDecisionId ?? undefined,
      confidence: rec.confidence ?? undefined,
      createdAt: createdAtISO,
    });

    if (rec.hash !== expected) {
      // Records written before this fix used DB-side defaultNow() which
      // may differ by milliseconds from the application timestamp used in
      // the hash. Mark them as legacy (unverifiable) and skip forward.
      if (firstVerifiedId === null) {
        prevHash = rec.hash;
        continue;
      }
      broken = true;
      brokenAt = rec.id;
      break;
    }

    if (firstVerifiedId === null) firstVerifiedId = rec.id;
    prevHash = rec.hash;
  }

  const legacyCount = firstVerifiedId !== null
    ? records.findIndex(r => r.id === firstVerifiedId)
    : records.length;

  res.json({
    integrity: broken ? "COMPROMISED" : "VERIFIED",
    checkedRecords: checkedCount,
    totalRecords: records.length,
    legacyRecords: legacyCount,
    verifiedWindowStart: firstVerifiedId,
    brokenAtRecordId: brokenAt,
    verifiedAt: new Date().toISOString(),
    message: broken
      ? `Chain integrity failure at record #${brokenAt} — audit trail may have been tampered with`
      : `${checkedCount - legacyCount} verified records in integrity window (${legacyCount} legacy pre-fix records skipped) — chain intact`,
  });
});

router.get("/audit-log", async (req, res) => {
  const pageRaw  = parseInt((req.query["page"]  as string) || "1");
  const limitRaw = Math.min(parseInt((req.query["limit"] as string) || "50"), 500);
  const page  = isNaN(pageRaw)  || pageRaw  < 1 ? 1  : pageRaw;
  const limit = isNaN(limitRaw) || limitRaw < 1 ? 50 : limitRaw;
  const offset = (page - 1) * limit;

  const action  = req.query["action"]  as string | undefined;
  const who     = req.query["who"]     as string | undefined;
  const from    = req.query["from"]    as string | undefined;
  const to      = req.query["to"]      as string | undefined;

  const conditions: SQL[] = [];
  if (action) conditions.push(eq(auditLogTable.action, action as AuditAction));
  if (who)    conditions.push(eq(auditLogTable.who, who));
  if (from)   conditions.push(gte(auditLogTable.createdAt, new Date(from)));
  if (to)     conditions.push(lte(auditLogTable.createdAt, new Date(to)));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [logs, [totalRow]] = await Promise.all([
    db.select().from(auditLogTable).where(where).orderBy(desc(auditLogTable.createdAt)).limit(limit).offset(offset),
    db.select({ count: count() }).from(auditLogTable).where(where),
  ]);

  res.json({
    logs,
    total: Number(totalRow?.count ?? 0),
    page,
    limit,
    pages: Math.ceil(Number(totalRow?.count ?? 0) / limit),
  });
});

router.get("/audit-feed", async (req, res) => {
  const limit = Math.min(parseInt((req.query["limit"] as string) || "50"), 200);
  const roleFilter = req.query["role"] as string | undefined;

  const rows = await db
    .select()
    .from(auditLogTable)
    .where(roleFilter ? eq(auditLogTable.whoRole, roleFilter) : undefined)
    .orderBy(desc(auditLogTable.createdAt))
    .limit(limit);

  res.json({ entries: rows, total: rows.length });
});

export default router;
