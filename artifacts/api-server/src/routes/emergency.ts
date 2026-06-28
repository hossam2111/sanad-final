import { Router } from "express";
import { db } from "@workspace/db";
import { patientsTable, medicationsTable, alertsTable, labResultsTable, visitsTable } from "@workspace/db/schema";
import { eq, desc, and, or, count, gte, sql } from "drizzle-orm";
import { calculateRiskScore, generateClinicalActions } from "../lib/ai-engine.js";
import { writeAudit, extractRequestMeta } from "../lib/audit.js";
import { getConsentState } from "../lib/ownership.js";

const router = Router();

router.use((req, res, next) => {
  const allowedRoles = ["emergency", "doctor", "hospital", "admin", "ai-control"];
  if (!req.role || !allowedRoles.includes(req.role)) {
    res.status(403).json({ error: "FORBIDDEN", message: "Only emergency and medical personnel can initiate break-glass access" });
    return;
  }
  next();
});

router.get("/:nationalId", async (req, res) => {
  const { nationalId } = req.params;

  const patient = await db
    .select()
    .from(patientsTable)
    .where(eq(patientsTable.nationalId, nationalId))
    .limit(1);

  if (!patient.length) {
    res.status(404).json({ error: "NOT_FOUND", message: "Patient not found in system" });
    return;
  }

  const p = patient[0]!;

  const oneYearAgoStr = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]!;

  const [activeMeds, criticalAlertRows, [abnormalLabsRow], [recentVisitsRow]] = await Promise.all([
    db.select().from(medicationsTable)
      .where(and(eq(medicationsTable.patientId, p.id), eq(medicationsTable.isActive, true)))
      .orderBy(desc(medicationsTable.createdAt)).limit(50),
    db.select({ message: alertsTable.message }).from(alertsTable)
      .where(and(
        eq(alertsTable.patientId, p.id),
        or(eq(alertsTable.severity, "critical"), eq(alertsTable.severity, "high")),
      ))
      .orderBy(desc(alertsTable.createdAt)).limit(20),
    db.select({ cnt: count() }).from(labResultsTable)
      .where(and(eq(labResultsTable.patientId, p.id), sql`${labResultsTable.status} != 'normal'`)),
    db.select({ cnt: count() }).from(visitsTable)
      .where(and(eq(visitsTable.patientId, p.id), gte(visitsTable.visitDate, oneYearAgoStr))),
  ]);

  const criticalAlerts = criticalAlertRows.map(a => a.message);
  const abnormalLabs = Number(abnormalLabsRow?.cnt ?? 0);
  const recentVisitCount = Number(recentVisitsRow?.cnt ?? 0);

  const riskData = calculateRiskScore({
    dateOfBirth: p.dateOfBirth,
    chronicConditions: p.chronicConditions,
    allergies: p.allergies,
    medicationCount: activeMeds.length,
    recentAbnormalLabs: abnormalLabs,
    visitFrequency: recentVisitCount,
  });

  const clinicalActions = generateClinicalActions(
    p.allergies,
    activeMeds.map(m => m.drugName),
    riskData.riskLevel,
    p.chronicConditions
  );

  const age = new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear();

  // Break-glass access: every emergency lookup is written to the tamper-evident
  // audit chain, including whether the patient's emergency_access consent was
  // active (access proceeds either way in a declared emergency, but a revoked
  // consent is flagged for post-incident review).
  const consentState = await getConsentState(p.id, "emergency_access");
  const { ipAddress, userAgent } = extractRequestMeta(req);
  await writeAudit({
    who: req.userId ?? req.role ?? "unknown",
    whoName: req.userName,
    whoRole: req.role ?? "emergency",
    action: "READ",
    what: `BREAK-GLASS: Emergency record access — ${p.fullName} (${p.nationalId})`,
    patientId: p.id,
    details: {
      riskLevel: riskData.riskLevel,
      emergencyAccessConsent: consentState === null ? "default-granted" : consentState ? "granted" : "REVOKED — flagged for review",
    },
    ipAddress,
    userAgent,
  });

  res.json({
    id: p.id,
    nationalId: p.nationalId,
    fullName: p.fullName,
    age,
    gender: p.gender,
    bloodType: p.bloodType,
    allergies: p.allergies || [],
    chronicConditions: p.chronicConditions || [],
    currentMedications: activeMeds.map(m => `${m.drugName} ${m.dosage ?? ""}`.trim()),
    emergencyContact: p.emergencyContact || "",
    emergencyPhone: p.emergencyPhone || "",
    riskLevel: riskData.riskLevel,
    riskScore: riskData.riskScore,
    criticalAlerts,
    clinicalActions,
  });
});

export default router;
