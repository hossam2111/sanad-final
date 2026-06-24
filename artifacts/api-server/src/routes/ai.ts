import { Router } from "express";
import { db } from "@workspace/db";
import { patientsTable, medicationsTable, labResultsTable, visitsTable, aiDecisionsTable, eventsTable, auditLogTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { checkDrugInteractions, calculateRiskScore, generatePredictions } from "../lib/ai-engine.js";
import { runDecisionEngine } from "../lib/decision-engine.js";
import { streamClinicalNarrative, askClinicalQuestion, type PatientContext } from "../lib/claude-brain.js";
import { writeAudit, extractRequestMeta } from "../lib/audit.js";
import { requireOwnPatient } from "../lib/ownership.js";

const router = Router();

router.post("/check-interaction", async (req, res) => {
  const { patientId, newDrug } = req.body;
  if (!(await requireOwnPatient(req, res, Number(patientId)))) return;

  const medications = await db
    .select()
    .from(medicationsTable)
    .where(eq(medicationsTable.patientId, patientId));

  const activeMedNames = medications.filter(m => m.isActive).map(m => m.drugName);
  const warnings = checkDrugInteractions(newDrug, activeMedNames);

  const safe = !warnings.some(w => w.severity === "critical" || w.severity === "high");

  if (patientId && !safe) {
    await db.insert(eventsTable).values({
      eventType: "DRUG_INTERACTION_DETECTED",
      patientId: Number(patientId),
      payload: { newDrug, warnings: warnings.map(w => ({ drug: w.conflictingDrug, severity: w.severity })) },
      source: "physician_portal",
    });
    const { ipAddress, userAgent } = extractRequestMeta(req);
    await writeAudit({
      who: "Physician Portal",
      whoRole: "doctor",
      action: "DRUG_CHECK",
      what: `${newDrug} checked — ${warnings.length} conflict(s) found`,
      patientId: Number(patientId),
      details: { newDrug, conflictsFound: warnings.length, safe },
      confidence: 0.95,
      ipAddress,
      userAgent,
    });
  }

  res.json({
    safe,
    warnings,
    disclaimer: "This interaction check covers a curated set of clinically significant drug pairs. It does not substitute for a complete clinical pharmacology database. Final dispensing decisions must be made by a licensed pharmacist or physician.",
    engineVersion: "rules-v1",
  });
});

router.get("/risk-score/:patientId", async (req, res) => {
  const patientId = parseInt(req.params["patientId"]!);
  if (!(await requireOwnPatient(req, res, patientId))) return;

  const [patient] = await db
    .select()
    .from(patientsTable)
    .where(eq(patientsTable.id, patientId))
    .limit(1);

  if (!patient) {
    res.status(404).json({ error: "NOT_FOUND", message: "Patient not found" });
    return;
  }

  const [medications, labResults, visits] = await Promise.all([
    db.select().from(medicationsTable).where(eq(medicationsTable.patientId, patientId)).orderBy(desc(medicationsTable.createdAt)).limit(50),
    db.select().from(labResultsTable).where(eq(labResultsTable.patientId, patientId)).orderBy(desc(labResultsTable.testDate)).limit(10),
    db.select().from(visitsTable).where(eq(visitsTable.patientId, patientId)).orderBy(desc(visitsTable.visitDate)).limit(50),
  ]);

  const abnormalLabs = labResults.filter(l => l.status !== "normal").length;
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const recentVisits = visits.filter(v => new Date(v.visitDate) >= oneYearAgo).length;

  const result = calculateRiskScore({
    dateOfBirth: patient.dateOfBirth,
    chronicConditions: patient.chronicConditions,
    allergies: patient.allergies,
    medicationCount: medications.filter(m => m.isActive).length,
    recentAbnormalLabs: abnormalLabs,
    visitFrequency: recentVisits,
  });

  res.json({
    patientId,
    ...result,
  });
});

router.get("/predictions/:patientId", async (req, res) => {
  const patientId = parseInt(req.params["patientId"]!);
  if (!(await requireOwnPatient(req, res, patientId))) return;

  const [patient] = await db
    .select()
    .from(patientsTable)
    .where(eq(patientsTable.id, patientId))
    .limit(1);

  if (!patient) {
    res.status(404).json({ error: "NOT_FOUND", message: "Patient not found" });
    return;
  }

  const [medications, labResults, visits] = await Promise.all([
    db.select().from(medicationsTable).where(eq(medicationsTable.patientId, patientId)).orderBy(desc(medicationsTable.createdAt)).limit(50),
    db.select().from(labResultsTable).where(eq(labResultsTable.patientId, patientId)).orderBy(desc(labResultsTable.testDate)).limit(20),
    db.select().from(visitsTable).where(eq(visitsTable.patientId, patientId)).orderBy(desc(visitsTable.visitDate)).limit(20),
  ]);

  const activeMedCount = medications.filter(m => m.isActive).length;

  const predictions = generatePredictions({
    dateOfBirth: patient.dateOfBirth,
    chronicConditions: patient.chronicConditions,
    allergies: patient.allergies,
    medicationCount: activeMedCount,
    labResults: labResults.map(l => ({
      testName: l.testName,
      result: l.result,
      status: l.status as "normal" | "abnormal" | "critical",
      testDate: l.testDate,
    })),
    visits: visits.map(v => ({
      visitDate: v.visitDate,
      visitType: v.visitType,
      diagnosis: v.diagnosis ?? "",
    })),
  });

  res.json({ patientId, predictions });
});

router.get("/decision/:patientId", async (req, res) => {
  const patientId = parseInt(req.params["patientId"]!);
  if (!(await requireOwnPatient(req, res, patientId))) return;

  const [patient] = await db
    .select()
    .from(patientsTable)
    .where(eq(patientsTable.id, patientId))
    .limit(1);

  if (!patient) {
    res.status(404).json({ error: "NOT_FOUND", message: "Patient not found" });
    return;
  }

  const [medications, labResults, visits] = await Promise.all([
    db.select().from(medicationsTable).where(eq(medicationsTable.patientId, patientId)).orderBy(desc(medicationsTable.createdAt)).limit(50),
    db.select().from(labResultsTable).where(eq(labResultsTable.patientId, patientId)).orderBy(desc(labResultsTable.testDate)).limit(20),
    db.select().from(visitsTable).where(eq(visitsTable.patientId, patientId)).orderBy(desc(visitsTable.visitDate)).limit(20),
  ]);

  const decision = runDecisionEngine({
    patient: {
      dateOfBirth: patient.dateOfBirth,
      chronicConditions: patient.chronicConditions,
      allergies: patient.allergies,
      riskScore: patient.riskScore ?? 0,
    },
    medications: medications.map(m => ({
      drugName: m.drugName,
      isActive: m.isActive ?? false,
      startDate: m.startDate,
    })),
    labResults: labResults.map(l => ({
      testName: l.testName,
      result: l.result,
      status: l.status,
      testDate: l.testDate,
      unit: l.unit,
    })),
    visits: visits.map(v => ({
      visitDate: v.visitDate,
      visitType: v.visitType,
      diagnosis: v.diagnosis,
    })),
  });

  const [saved] = await db.insert(aiDecisionsTable).values({
    patientId,
    riskScore: decision.riskScore,
    riskLevel: decision.riskLevel,
    urgency: decision.urgency,
    primaryAction: decision.primaryAction,
    timeWindow: decision.timeWindow,
    whyFactors: decision.whyFactors,
    confidence: decision.confidence,
    source: decision.source,
    recommendations: decision.recommendations,
    digitalTwinProjection: decision.digitalTwin,
    behavioralFlags: decision.behavioralFlags,
  }).returning();

  await db.insert(eventsTable).values({
    eventType: "AI_DECISION_MADE",
    patientId,
    payload: {
      urgency: decision.urgency,
      riskScore: decision.riskScore,
      riskLevel: decision.riskLevel,
      primaryAction: decision.primaryAction,
      confidence: decision.confidence,
      decisionId: saved?.id,
    },
    aiDecisionId: saved?.id,
    source: "decision_engine_v3",
  });

  await db.update(patientsTable)
    .set({ riskScore: decision.riskScore, updatedAt: new Date() })
    .where(eq(patientsTable.id, patientId));

  const { ipAddress, userAgent } = extractRequestMeta(req);
  await writeAudit({
    who: "AI Decision Engine v3",
    whoRole: "ai_system",
    action: "AI_DECISION",
    what: `Urgency=${decision.urgency.toUpperCase()} · Risk=${decision.riskScore}/100 · Action="${decision.primaryAction.substring(0, 80)}"`,
    patientId,
    details: {
      decisionId: saved?.id,
      factors: decision.whyFactors.length,
      confidence: decision.confidence,
      urgency: decision.urgency,
    },
    aiDecisionId: saved?.id,
    confidence: decision.confidence,
    ipAddress,
    userAgent,
  });

  res.json({
    patientId,
    decisionId: saved?.id,
    ...decision,
    engineType: "deterministic-rules",
    disclaimer: "Clinical recommendations are generated by a deterministic rule-based engine using weighted risk scoring. They are advisory only and must be reviewed and confirmed by a licensed clinician before action is taken.",
  });
});

router.get("/events/:patientId", async (req, res) => {
  const patientId = parseInt(req.params["patientId"]!);
  if (!(await requireOwnPatient(req, res, patientId))) return;
  const events = await db
    .select()
    .from(eventsTable)
    .where(eq(eventsTable.patientId, patientId))
    .orderBy(desc(eventsTable.processedAt))
    .limit(50);

  res.json({ patientId, events });
});

router.get("/audit/:patientId", async (req, res) => {
  const patientId = parseInt(req.params["patientId"]!);
  if (!(await requireOwnPatient(req, res, patientId))) return;
  const logs = await db
    .select()
    .from(auditLogTable)
    .where(eq(auditLogTable.patientId, patientId))
    .orderBy(desc(auditLogTable.createdAt))
    .limit(30);

  res.json({ patientId, auditLog: logs });
});

async function buildPatientContext(
  patientId: number,
  patient: typeof patientsTable.$inferSelect,
): Promise<PatientContext> {
  const [medications, labResults, visits] = await Promise.all([
    db.select().from(medicationsTable).where(eq(medicationsTable.patientId, patientId)).orderBy(desc(medicationsTable.createdAt)).limit(50),
    db.select().from(labResultsTable).where(eq(labResultsTable.patientId, patientId)).orderBy(desc(labResultsTable.testDate)).limit(10),
    db.select().from(visitsTable).where(eq(visitsTable.patientId, patientId)).orderBy(desc(visitsTable.visitDate)).limit(5),
  ]);

  const decision = runDecisionEngine({
    patient: {
      dateOfBirth: patient.dateOfBirth,
      chronicConditions: patient.chronicConditions,
      allergies: patient.allergies,
      riskScore: patient.riskScore ?? 0,
    },
    medications: medications.map(m => ({ drugName: m.drugName, isActive: m.isActive ?? false, startDate: m.startDate })),
    labResults: labResults.map(l => ({ testName: l.testName, result: l.result, status: l.status, testDate: l.testDate, unit: l.unit })),
    visits: visits.map(v => ({ visitDate: v.visitDate, visitType: v.visitType, diagnosis: v.diagnosis })),
  });

  const age = new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear();

  return {
    name: patient.fullName,
    age,
    nationalId: patient.nationalId,
    chronicConditions: patient.chronicConditions ?? [],
    allergies: patient.allergies ?? [],
    activeMedications: medications.filter(m => m.isActive).map(m => m.drugName),
    recentLabs: labResults.map(l => ({ test: l.testName, result: l.result, status: l.status, date: l.testDate })),
    recentVisits: visits.map(v => ({ date: v.visitDate, type: v.visitType, diagnosis: v.diagnosis ?? "" })),
    decision,
  };
}

// ─── Claude AI Brain — Streaming Clinical Narrative ───────────────────────────
// GET /api/ai/narrative/:patientId
// Streams a real AI-generated clinical summary via SSE
router.get("/narrative/:patientId", async (req, res) => {
  if (!process.env["OPENAI_API_KEY"]) {
    res.status(503).json({ error: "AI_UNAVAILABLE", message: "OPENAI_API_KEY not configured" });
    return;
  }

  const patientId = parseInt(req.params["patientId"]!);
  if (isNaN(patientId)) {
    res.status(400).json({ error: "BAD_REQUEST", message: "Invalid patientId" });
    return;
  }
  if (!(await requireOwnPatient(req, res, patientId))) return;

  const [patient] = await db
    .select()
    .from(patientsTable)
    .where(eq(patientsTable.id, patientId))
    .limit(1);

  if (!patient) {
    res.status(404).json({ error: "NOT_FOUND", message: "Patient not found" });
    return;
  }

  const ctx = await buildPatientContext(patientId, patient);

  // SSE headers for streaming
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  try {
    await streamClinicalNarrative(
      ctx,
      (chunk, provider) => {
        res.write(`data: ${JSON.stringify({ text: chunk, provider })}\n\n`);
      },
      () => {
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
      },
      (err) => {
        if (!res.writableEnded) {
          res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
          res.end();
        }
      },
    );
  } catch (err) {
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ error: err instanceof Error ? err.message : "Stream error" })}\n\n`);
      res.end();
    }
  }
});

// ─── Claude AI Brain — Clinical Q&A ──────────────────────────────────────────
// POST /api/ai/chat/:patientId   body: { question: string }
router.post("/chat/:patientId", async (req, res) => {
  if (!process.env["OPENAI_API_KEY"]) {
    res.status(503).json({ error: "AI_UNAVAILABLE", message: "OPENAI_API_KEY not configured" });
    return;
  }

  const patientId = parseInt(req.params["patientId"]!);
  if (isNaN(patientId)) {
    res.status(400).json({ error: "BAD_REQUEST", message: "Invalid patientId" });
    return;
  }
  if (!(await requireOwnPatient(req, res, patientId))) return;

  const { question } = req.body as { question?: string };

  if (!question?.trim()) {
    res.status(400).json({ error: "INVALID_REQUEST", message: "question is required" });
    return;
  }

  const [patient] = await db
    .select()
    .from(patientsTable)
    .where(eq(patientsTable.id, patientId))
    .limit(1);

  if (!patient) {
    res.status(404).json({ error: "NOT_FOUND", message: "Patient not found" });
    return;
  }

  const ctx = await buildPatientContext(patientId, patient);

  const answer = await askClinicalQuestion(ctx, question);

  res.json({ patientId, question, answer, model: "gpt-4o" });
});

export default router;
