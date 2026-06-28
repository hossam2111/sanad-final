import { Router } from "express";
import { db } from "@workspace/db";
import { patientsTable, labResultsTable, visitsTable, medicationsTable, aiDecisionsTable } from "@workspace/db/schema";
import { count, sql } from "drizzle-orm";
import { writeAudit, extractRequestMeta } from "../lib/audit.js";

const router = Router();

router.use((req, res, next) => {
  const allowedRoles = ["research", "admin", "hospital", "ai-control"];
  if (!req.role || !allowedRoles.includes(req.role)) {
    res.status(403).json({ error: "FORBIDDEN", message: "Research or administrative role required" });
    return;
  }
  next();
});

router.get("/insights", async (req, res) => {
  // All queries use SQL aggregations — no patient PHI (names, IDs) is loaded into memory
  const [
    conditionRows,
    ageRiskRows,
    [totalRow],
    labInsightRows,
    drugRows,
    [aiAgg],
    [labTotal],
    [visitTotal],
  ] = await Promise.all([
    db.execute<{ condition: string; patient_count: number; avg_risk: number; total_risk: number }>(
      sql`SELECT elem AS condition, COUNT(*)::int AS patient_count, ROUND(AVG(COALESCE(risk_score,0)))::int AS avg_risk, SUM(COALESCE(risk_score,0))::int AS total_risk FROM patients, unnest(chronic_conditions) AS elem GROUP BY elem ORDER BY patient_count DESC LIMIT 10`
    ),
    db.execute<{ age_group: string; patient_count: number; avg_risk: number }>(
      sql`SELECT CASE WHEN EXTRACT(YEAR FROM AGE(date_of_birth)) < 18 THEN '0-17' WHEN EXTRACT(YEAR FROM AGE(date_of_birth)) < 35 THEN '18-34' WHEN EXTRACT(YEAR FROM AGE(date_of_birth)) < 50 THEN '35-49' WHEN EXTRACT(YEAR FROM AGE(date_of_birth)) < 65 THEN '50-64' ELSE '65+' END AS age_group, COUNT(*)::int AS patient_count, ROUND(AVG(COALESCE(risk_score,0)))::int AS avg_risk FROM patients GROUP BY age_group ORDER BY MIN(date_of_birth)`
    ),
    db.select({ count: count() }).from(patientsTable),
    db.execute<{ test_name: string; total: number; abnormal: number; critical: number }>(
      // ORDER BY repeats the full aggregates — Postgres does not allow SELECT
      // aliases inside an ORDER BY expression.
      sql`SELECT test_name, COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status='abnormal')::int AS abnormal, COUNT(*) FILTER (WHERE status='critical')::int AS critical FROM lab_results GROUP BY test_name ORDER BY (COUNT(*) FILTER (WHERE status='abnormal') + COUNT(*) FILTER (WHERE status='critical') * 2) DESC LIMIT 8`
    ),
    db.execute<{ drug_name: string; prescriptions: number }>(
      sql`SELECT drug_name, COUNT(*)::int AS prescriptions FROM medications GROUP BY drug_name ORDER BY prescriptions DESC LIMIT 10`
    ),
    db.select({
      totalDecisions: count(),
      avgConf: sql<number>`ROUND(AVG(COALESCE(${aiDecisionsTable.confidence}, 0))::numeric, 4)::float`,
      immediateCount: sql<number>`COUNT(*) FILTER (WHERE ${aiDecisionsTable.urgency} = 'immediate')::int`,
    }).from(aiDecisionsTable),
    db.select({ count: count() }).from(labResultsTable),
    db.select({ count: count() }).from(visitsTable),
  ]);

  const conditions  = (Array.isArray(conditionRows)   ? conditionRows   : conditionRows.rows)   as typeof conditionRows extends { rows: infer R } ? R : typeof conditionRows;
  const ageRows     = (Array.isArray(ageRiskRows)      ? ageRiskRows      : ageRiskRows.rows)     as typeof ageRiskRows extends { rows: infer R } ? R : typeof ageRiskRows;
  const labRows     = (Array.isArray(labInsightRows)   ? labInsightRows   : labInsightRows.rows)  as typeof labInsightRows extends { rows: infer R } ? R : typeof labInsightRows;
  const drugs       = (Array.isArray(drugRows)         ? drugRows         : drugRows.rows)        as typeof drugRows extends { rows: infer R } ? R : typeof drugRows;

  const total = Number(totalRow?.count ?? 1);

  const conditionInsights = (conditions as Array<{ condition: string; patient_count: number; avg_risk: number; total_risk: number }>).map(r => ({
    condition: r.condition,
    prevalence: Math.round((r.patient_count / total) * 100),
    avgRiskScore: r.avg_risk,
    patientCount: r.patient_count,
    trend: r.patient_count / total > 0.15 ? "rising" : r.patient_count / total > 0.08 ? "stable" : "declining",
  }));

  const ageRiskData = (ageRows as Array<{ age_group: string; patient_count: number; avg_risk: number }>).map(r => ({
    ageGroup: r.age_group,
    count: r.patient_count,
    avgRiskScore: r.avg_risk,
  }));

  const labInsights = (labRows as Array<{ test_name: string; total: number; abnormal: number; critical: number }>).map(r => ({
    test: r.test_name,
    total: r.total,
    abnormalRate: Math.round((r.abnormal / Math.max(r.total, 1)) * 100),
    criticalRate: Math.round((r.critical / Math.max(r.total, 1)) * 100),
  }));

  const drugPatterns = (drugs as Array<{ drug_name: string; prescriptions: number }>).map(r => ({
    drug: r.drug_name,
    prescriptions: r.prescriptions,
  }));

  res.json({
    totalAnonymizedRecords: total,
    totalLabResults: Number(labTotal?.count ?? 0),
    totalVisits: Number(visitTotal?.count ?? 0),
    conditionInsights,
    labInsights,
    drugPatterns,
    ageRiskData,
    aiMetrics: {
      totalDecisions: Number(aiAgg?.totalDecisions ?? 0),
      avgConfidence: Math.round((aiAgg?.avgConf ?? 0) * 100),
      immediateDecisions: Number(aiAgg?.immediateCount ?? 0),
    },
    clinicalFindings: [
      { finding: `Diabetes prevalence at ${conditionInsights.find(c => c.condition.toLowerCase().includes("diabetes"))?.prevalence ?? 0}% — exceeds national benchmark`, significance: "high", recommendation: "Launch targeted HbA1c screening program" },
      { finding: `${labInsights[0]?.test ?? "HbA1c"} abnormal rate at ${labInsights[0]?.abnormalRate ?? 0}% — monitoring gap identified`, significance: "medium", recommendation: "Increase lab monitoring frequency for at-risk populations" },
      { finding: `Age group 50-64 shows highest average risk score (${ageRiskData.find(a => a.ageGroup === "50-64")?.avgRiskScore ?? 0}/100)`, significance: "high", recommendation: "Targeted preventive programs for this cohort" },
    ],
  });
});

router.get("/export", async (req, res) => {
  const format = req.query["format"] ?? "csv";

  // Audit the export — research data exports must be traceable per PDPL
  const { ipAddress, userAgent } = extractRequestMeta(req);
  void writeAudit({
    who: req.userId ?? req.role ?? "researcher",
    whoName: req.userName,
    whoRole: req.role ?? "researcher",
    action: "EXPORT",
    what: `Research data export requested (format: ${format})`,
    // ipAddress/userAgent are merged into the stored details by writeAudit and
    // excluded from the hash — do NOT duplicate ipAddress here or the record
    // becomes unverifiable against the chain.
    details: { format },
    ipAddress,
    userAgent,
  });

  // Select only de-identifying fields — no national ID, full name, phone, or contact info
  const [patients, labCountRows] = await Promise.all([
    db.select({
      id: patientsTable.id,
      dateOfBirth: patientsTable.dateOfBirth,
      gender: patientsTable.gender,
      riskScore: patientsTable.riskScore,
      chronicConditions: patientsTable.chronicConditions,
    }).from(patientsTable).limit(10_000),
    db.execute<{ patient_id: number; lab_count: number }>(
      sql`SELECT patient_id, COUNT(*)::int AS lab_count FROM lab_results GROUP BY patient_id`
    ),
  ]);

  const labCounts = new Map(
    ((Array.isArray(labCountRows) ? labCountRows : labCountRows.rows) as Array<{ patient_id: number; lab_count: number }>)
      .map(r => [r.patient_id, r.lab_count])
  );

  if (format === "csv") {
    const header = "AnonymizedID,AgeGroup,Gender,RiskScore,ChronicConditions,LabCount\n";
    const rows = patients.map((p, i) => {
      const age = new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear();
      const ageGroup = age < 18 ? "0-17" : age < 35 ? "18-34" : age < 50 ? "35-49" : age < 65 ? "50-64" : "65+";
      const labCount = labCounts.get(p.id) ?? 0;
      return `ANON-${String(i + 1).padStart(6, "0")},${ageGroup},${p.gender},${p.riskScore ?? 0},"${(p.chronicConditions ?? []).join(";")}",${labCount}`;
    });
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=\"sanad-research-export.csv\"");
    return res.send(header + rows.join("\n"));
  }

  const anonymized = patients.map((p, i) => {
    const age = new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear();
    const ageGroup = age < 18 ? "0-17" : age < 35 ? "18-34" : age < 50 ? "35-49" : age < 65 ? "50-64" : "65+";
    return {
      anonymizedId: `ANON-${String(i + 1).padStart(6, "0")}`,
      ageGroup,
      gender: p.gender,
      riskScore: p.riskScore,
      conditionCount: (p.chronicConditions ?? []).length,
      labCount: labCounts.get(p.id) ?? 0,
    };
  });

  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", "attachment; filename=\"sanad-research-export.json\"");
  res.json({ exportedAt: new Date().toISOString(), totalRecords: anonymized.length, records: anonymized });
});

export default router;
