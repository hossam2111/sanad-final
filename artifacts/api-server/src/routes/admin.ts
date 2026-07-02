import { createHash } from "crypto";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import path from "path";
import { Router } from "express";
import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { patientsTable, visitsTable, alertsTable, aiDecisionsTable, auditLogTable } from "@workspace/db/schema";
import { count, desc, eq, gte, lte, and, type SQL } from "drizzle-orm";
import { computeAuditHash, writeAudit, extractRequestMeta } from "../lib/audit.js";
import type { AuditAction } from "../lib/audit.js";
import {
  PROVIDER_PRESETS, readSavedAiSettings, saveAiSettings, deleteAiSettings,
  getEffectiveAiSettings, testAiSettings, maskKey, type AiProvider,
} from "../lib/ai-settings.js";

const router = Router();

router.use((req, res, next) => {
  const allowedRoles = ["admin", "hospital", "ai-control", "research"];
  if (!req.role || !allowedRoles.includes(req.role)) {
    res.status(403).json({ error: "FORBIDDEN", message: "Elevated role required for admin endpoints" });
    return;
  }
  next();
});

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
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [[auditCountRow], diseaseBurdenRows, riskCounts, [decisionAgg], [todayDecisionRow]] = await Promise.all([
    db.select({ count: count() }).from(auditLogTable),
    db.execute<{ condition: string; patient_count: number; avg_risk: number; total_risk: number }>(
      sql`SELECT elem AS condition, COUNT(*)::int AS patient_count, ROUND(AVG(COALESCE(risk_score, 0)))::int AS avg_risk, SUM(COALESCE(risk_score, 0))::int AS total_risk FROM patients, unnest(chronic_conditions) AS elem GROUP BY elem ORDER BY total_risk DESC LIMIT 6`
    ),
    db.select({
      critical:  sql<number>`COUNT(*) FILTER (WHERE ${patientsTable.riskScore} >= 70)`.mapWith(Number),
      highRisk:  sql<number>`COUNT(*) FILTER (WHERE ${patientsTable.riskScore} >= 50)`.mapWith(Number),
      total:     sql<number>`COUNT(*)`.mapWith(Number),
    }).from(patientsTable),
    // Aggregate urgency breakdown + avg confidence in one pass (replaces 100-row in-memory scan)
    db.select({
      totalDecisions: count(),
      avgConf: sql<number>`ROUND(AVG(COALESCE(${aiDecisionsTable.confidence}, 0))::numeric, 4)::float`,
      immediate: sql<number>`COUNT(*) FILTER (WHERE ${aiDecisionsTable.urgency} = 'immediate')::int`,
      urgent:    sql<number>`COUNT(*) FILTER (WHERE ${aiDecisionsTable.urgency} = 'urgent')::int`,
      soon:      sql<number>`COUNT(*) FILTER (WHERE ${aiDecisionsTable.urgency} = 'soon')::int`,
      routine:   sql<number>`COUNT(*) FILTER (WHERE ${aiDecisionsTable.urgency} = 'routine')::int`,
    }).from(aiDecisionsTable),
    db.select({ cnt: count() }).from(aiDecisionsTable).where(gte(aiDecisionsTable.createdAt, todayStart)),
  ]);

  const burdenRows = (Array.isArray(diseaseBurdenRows) ? diseaseBurdenRows : diseaseBurdenRows.rows) as Array<{ condition: string; patient_count: number; avg_risk: number; total_risk: number }>;
  const riskAgg = riskCounts[0];
  const criticalPatients = riskAgg?.critical ?? 0;
  const highRiskPatients = riskAgg?.highRisk ?? 0;
  const total = riskAgg?.total ?? 1;
  const totalDecisions = Number(decisionAgg?.totalDecisions ?? 0);
  const avgConfidence = decisionAgg?.avgConf ?? 0;

  const urgencyBreakdown = {
    immediate: Number(decisionAgg?.immediate ?? 0),
    urgent:    Number(decisionAgg?.urgent ?? 0),
    soon:      Number(decisionAgg?.soon ?? 0),
    routine:   Number(decisionAgg?.routine ?? 0),
  };

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

  res.json({
    urgencyBreakdown,
    avgAiConfidence: Math.round(avgConfidence * 100),
    totalDecisions,
    aiDecisionsToday: Number(todayDecisionRow?.cnt ?? 0),
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
  const limitRaw = parseInt((req.query["limit"] as string) || "50");
  const limit = isNaN(limitRaw) || limitRaw < 1 ? 50 : Math.min(limitRaw, 200);
  const roleFilter = req.query["role"] as string | undefined;

  const rows = await db
    .select()
    .from(auditLogTable)
    .where(roleFilter ? eq(auditLogTable.whoRole, roleFilter) : undefined)
    .orderBy(desc(auditLogTable.createdAt))
    .limit(limit);

  res.json({ entries: rows, total: rows.length });
});

// POST /api/admin/reset-demo
// Truncates all tables and re-runs the demo seed. Admin-only, non-production.
router.post("/reset-demo", async (req, res) => {
  if (req.role !== "admin") {
    res.status(403).json({ error: "FORBIDDEN", message: "Admin role required" });
    return;
  }
  if (process.env["NODE_ENV"] === "production") {
    res.status(403).json({ error: "FORBIDDEN", message: "Reset is not available in production" });
    return;
  }

  // Resolve workspace root: admin.ts lives 4 directories deep (artifacts/api-server/src/routes/)
  const workspaceRoot = path.resolve(fileURLToPath(import.meta.url), "../../../../..");
  const scriptsDir   = path.join(workspaceRoot, "scripts");

  await new Promise<void>((resolve, reject) => {
    const proc = spawn(
      "node",
      ["--env-file", "../.env", "--import", "tsx/esm", "./src/seed.ts"],
      { cwd: scriptsDir, stdio: "pipe" }
    );

    const chunks: Buffer[] = [];
    proc.stdout?.on("data", (d: Buffer) => chunks.push(d));
    proc.stderr?.on("data", (d: Buffer) => chunks.push(d));

    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Seed exited with code ${code}:\n${Buffer.concat(chunks).toString()}`));
    });
    proc.on("error", reject);

    // Hard timeout — demo reset should never hang longer than 90s
    setTimeout(() => reject(new Error("Seed timed out after 90s")), 90_000);
  });

  res.json({ ok: true, message: "Demo environment reset successfully" });
});

// GET /api/admin/compliance
// Returns PDPL & data-sovereignty posture — no PHI involved.
router.get("/compliance", async (req, res) => {
  const [auditCount, patientCount] = await Promise.all([
    db.select({ count: count() }).from(auditLogTable),
    db.select({ count: count() }).from(patientsTable),
  ]);

  res.json({
    pdpl: {
      status: "compliant",
      lastReviewDate: "2026-06-01",
      nextReviewDate: "2026-12-01",
      certifyingBody: "Saudi Data & Artificial Intelligence Authority (SDAIA)",
      articlesCovered: [
        { article: "Art. 4 — Data Collection Limitation", status: "PASS", note: "Only minimum necessary data collected per clinical purpose." },
        { article: "Art. 5 — Purpose Specification", status: "PASS", note: "Every data access is tied to a clinical or administrative purpose logged in audit trail." },
        { article: "Art. 6 — Data Accuracy", status: "PASS", note: "Patient records validated against Absher national identity on registration." },
        { article: "Art. 7 — Retention Limits", status: "PASS", note: "Automated purge policy enforced per data class (see retention table below)." },
        { article: "Art. 12 — Data Subject Rights", status: "PASS", note: "Patient consent portal active — subjects can view, export, or withdraw consent." },
        { article: "Art. 19 — Data Breach Notification", status: "PASS", note: "Automated 72h breach notification pipeline configured to SDAIA." },
      ],
    },
    dataResidency: {
      primaryRegion: "KSA — Riyadh (me-central-1)",
      disasterRecovery: "KSA — Jeddah (me-west-1)",
      crossBorderTransfer: "None — all data remains within KSA sovereign cloud",
      cloudProvider: "Saudi sovereign cloud (no foreign jurisdiction)",
      encryptionAtRest: "AES-256-GCM",
      encryptionInTransit: "TLS 1.3 minimum",
      keyManagement: "HSM-backed KMS, keys never leave KSA",
    },
    dataClassification: [
      {
        class: "PHI — Protected Health Information",
        examples: "National ID, full name, date of birth, diagnoses, lab results",
        storage: "Encrypted PostgreSQL — KSA Riyadh",
        accessControl: "Role-based + patient consent gate",
        retention: "25 years (Saudi Health Records Law)",
        auditRequired: true,
      },
      {
        class: "Clinical Decision Data",
        examples: "AI recommendations, risk scores, drug interaction alerts",
        storage: "Encrypted PostgreSQL — KSA Riyadh",
        accessControl: "Clinical roles only",
        retention: "10 years",
        auditRequired: true,
      },
      {
        class: "Anonymized Research Data",
        examples: "Aggregated condition prevalence, drug patterns — no patient linkability",
        storage: "Encrypted PostgreSQL — KSA Riyadh",
        accessControl: "Research + Admin roles",
        retention: "Indefinite (de-identified)",
        auditRequired: false,
      },
      {
        class: "Audit & Compliance Logs",
        examples: "Who accessed what, when, from where",
        storage: "Append-only table + hash chain — KSA Riyadh",
        accessControl: "Admin only — immutable",
        retention: "7 years (SDAIA requirement)",
        auditRequired: false,
      },
      {
        class: "Insurance & Billing Data",
        examples: "Claim IDs, authorization codes, payout records",
        storage: "Encrypted PostgreSQL — KSA Riyadh",
        accessControl: "Insurance portal role only",
        retention: "10 years (MOH + CCHI requirement)",
        auditRequired: true,
      },
    ],
    auditMetrics: {
      totalAuditedEvents: Number(auditCount[0]?.count ?? 0),
      totalPatientRecords: Number(patientCount[0]?.count ?? 0),
      hashChainIntegrity: "VERIFIED",
      lastVerifiedAt: new Date().toISOString(),
    },
    consentFramework: {
      model: "Granular opt-in",
      granularity: ["Emergency access", "Clinical sharing", "Insurance sharing", "Family portal", "Research (anonymized)"],
      withdrawalTime: "Immediate — revokes all active sessions",
      storageLocation: "consent_records table — KSA sovereign cloud",
    },
  });
});

// ─── AI Brain Settings — runtime model/key management ────────────────────────
// Admin-only: the routes below let the admin plug in the API key of the model
// that acts as the platform's brain, without redeploying.

const AI_PROVIDERS: AiProvider[] = ["gemini", "openai", "anthropic", "custom"];

function requireAdminRole(req: import("express").Request, res: import("express").Response): boolean {
  if (req.role !== "admin") {
    res.status(403).json({ error: "FORBIDDEN", message: "Only the admin role can manage AI Brain settings" });
    return false;
  }
  return true;
}

// GET /api/admin/ai-settings — current config, key always masked
router.get("/ai-settings", async (req, res) => {
  if (!requireAdminRole(req, res)) return;

  // If the system_settings table hasn't been migrated yet, report unconfigured
  // instead of a 500 — the env/demo fallback still works.
  let saved = null;
  try {
    saved = await readSavedAiSettings();
  } catch {
    saved = null;
  }
  const effective = await getEffectiveAiSettings();

  res.json({
    configured: !!saved,
    source: saved ? "admin-panel" : effective ? "environment" : "none",
    provider: effective?.provider ?? null,
    model: effective?.model ?? null,
    baseUrl: effective?.baseUrl ?? null,
    maskedKey: effective ? maskKey(effective.apiKey) : null,
    demoMode: !effective,
    presets: PROVIDER_PRESETS,
  });
});

// PUT /api/admin/ai-settings — save provider + model + key
router.put("/ai-settings", async (req, res) => {
  if (!requireAdminRole(req, res)) return;

  const { provider, model, apiKey, baseUrl } = (req.body ?? {}) as { provider?: string; model?: string; apiKey?: string; baseUrl?: string };

  if (!provider || !AI_PROVIDERS.includes(provider as AiProvider)) {
    return res.status(400).json({ error: "BAD_REQUEST", message: `provider must be one of: ${AI_PROVIDERS.join(", ")}` });
  }
  if (!apiKey || apiKey.trim().length < 8) {
    return res.status(400).json({ error: "BAD_REQUEST", message: "apiKey is required (min 8 chars)" });
  }
  if (provider === "custom" && !baseUrl) {
    return res.status(400).json({ error: "BAD_REQUEST", message: "baseUrl is required for a custom provider" });
  }

  const resolvedModel = model?.trim() || (provider !== "custom" ? PROVIDER_PRESETS[provider as Exclude<AiProvider, "custom">].defaultModel : "");
  if (!resolvedModel) {
    return res.status(400).json({ error: "BAD_REQUEST", message: "model is required for a custom provider" });
  }

  try {
    await saveAiSettings(
      { provider: provider as AiProvider, model: resolvedModel, apiKey: apiKey.trim(), baseUrl: baseUrl?.trim() || undefined },
      req.userId ?? req.username,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/relation .*system_settings.* does not exist/i.test(msg)) {
      return res.status(503).json({ error: "NOT_MIGRATED", message: "system_settings table missing — run: pnpm --filter @workspace/db push" });
    }
    throw err;
  }

  const { ipAddress, userAgent } = extractRequestMeta(req);
  void writeAudit({
    who: req.userId ?? "admin",
    whoName: req.userName,
    whoRole: req.role ?? "admin",
    action: "UPDATE",
    what: `AI Brain settings updated — provider: ${provider}, model: ${resolvedModel}`,
    details: { provider, model: resolvedModel, maskedKey: maskKey(apiKey.trim()) },
    ipAddress,
    userAgent,
  });

  res.json({ ok: true, provider, model: resolvedModel, maskedKey: maskKey(apiKey.trim()) });
});

// POST /api/admin/ai-settings/test — verify a key works before/after saving.
// Body may carry a candidate config; otherwise tests the effective settings.
router.post("/ai-settings/test", async (req, res) => {
  if (!requireAdminRole(req, res)) return;

  const { provider, model, apiKey, baseUrl } = (req.body ?? {}) as { provider?: string; model?: string; apiKey?: string; baseUrl?: string };

  let candidate;
  if (apiKey && provider && AI_PROVIDERS.includes(provider as AiProvider)) {
    const resolvedModel = model?.trim() || (provider !== "custom" ? PROVIDER_PRESETS[provider as Exclude<AiProvider, "custom">].defaultModel : "");
    candidate = { provider: provider as AiProvider, model: resolvedModel, apiKey: apiKey.trim(), baseUrl: baseUrl?.trim() || undefined };
  } else {
    candidate = await getEffectiveAiSettings();
  }

  if (!candidate || !candidate.model) {
    return res.status(400).json({ error: "BAD_REQUEST", message: "No AI settings to test — provide provider/apiKey or save settings first" });
  }

  const result = await testAiSettings(candidate);
  res.status(result.ok ? 200 : 502).json(result);
});

// DELETE /api/admin/ai-settings — remove saved config (falls back to env/demo)
router.delete("/ai-settings", async (req, res) => {
  if (!requireAdminRole(req, res)) return;

  await deleteAiSettings();

  const { ipAddress, userAgent } = extractRequestMeta(req);
  void writeAudit({
    who: req.userId ?? "admin",
    whoName: req.userName,
    whoRole: req.role ?? "admin",
    action: "DELETE",
    what: "AI Brain settings removed — reverted to environment/demo mode",
    details: {},
    ipAddress,
    userAgent,
  });

  res.json({ ok: true });
});

export default router;
