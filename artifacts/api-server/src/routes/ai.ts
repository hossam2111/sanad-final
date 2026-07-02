import { Router } from "express";
import { db } from "@workspace/db";
import { patientsTable, medicationsTable, labResultsTable, visitsTable, aiDecisionsTable, eventsTable, auditLogTable } from "@workspace/db/schema";
import { eq, desc, and, count, sql, gte } from "drizzle-orm";
import { checkDrugInteractions, calculateRiskScore, generatePredictions } from "../lib/ai-engine.js";
import { runDecisionEngine } from "../lib/decision-engine.js";
import { streamClinicalNarrative, askClinicalQuestion, type PatientContext } from "../lib/claude-brain.js";
import { writeAudit, extractRequestMeta } from "../lib/audit.js";
import { requireOwnPatient } from "../lib/ownership.js";
import { z } from "zod";
import { validate } from "../middlewares/validate.js";

const checkInteractionSchema = z.object({
  patientId: z.number().int().positive(),
  newDrug: z.string().min(1).max(200)
});

const chatSchema = z.object({
  question: z.string().min(1).max(1000)
});

const router = Router();

router.post("/check-interaction", validate(checkInteractionSchema), async (req, res) => {
  const { patientId, newDrug } = req.body as z.infer<typeof checkInteractionSchema>;
  if (!(await requireOwnPatient(req, res, patientId))) return;

  const [patient] = await db
    .select()
    .from(patientsTable)
    .where(eq(patientsTable.id, patientId))
    .limit(1);

  const medications = await db
    .select()
    .from(medicationsTable)
    .where(and(eq(medicationsTable.patientId, patientId), eq(medicationsTable.isActive, true)))
    .orderBy(desc(medicationsTable.createdAt))
    .limit(100);

  const activeMedNames = medications.map(m => m.drugName);
  const allergies = patient?.allergies ?? [];
  const warnings = checkDrugInteractions(newDrug, activeMedNames, allergies);

  const safe = !warnings.some(w => w.severity === "critical" || w.severity === "high");

  if (patientId && !safe) {
    const { ipAddress, userAgent } = extractRequestMeta(req);
    void Promise.all([
      db.insert(eventsTable).values({
        eventType: "DRUG_INTERACTION_DETECTED",
        patientId: Number(patientId),
        payload: { newDrug, warnings: warnings.map(w => ({ drug: w.conflictingDrug, severity: w.severity })) },
        source: "physician_portal",
      }).catch(() => {}),
      writeAudit({
        who: req.userId ?? req.role ?? "unknown",
        whoName: req.userName,
        whoRole: req.role ?? "doctor",
        action: "DRUG_CHECK",
        what: `${newDrug} checked — ${warnings.length} conflict(s) found`,
        patientId: Number(patientId),
        details: { newDrug, conflictsFound: warnings.length, safe },
        confidence: 0.95,
        ipAddress,
        userAgent,
      }),
    ]);
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
  if (isNaN(patientId)) {
    res.status(400).json({ error: "BAD_REQUEST", message: "Invalid patient ID" });
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

  const oneYearAgoStr = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]!;

  const [[activeMedsRow], [abnormalLabsRow], [recentVisitsRow]] = await Promise.all([
    db.select({ cnt: count() }).from(medicationsTable).where(and(eq(medicationsTable.patientId, patientId), eq(medicationsTable.isActive, true))),
    db.select({ cnt: count() }).from(labResultsTable).where(and(eq(labResultsTable.patientId, patientId), sql`${labResultsTable.status} != 'normal'`)),
    db.select({ cnt: count() }).from(visitsTable).where(and(eq(visitsTable.patientId, patientId), gte(visitsTable.visitDate, oneYearAgoStr))),
  ]);

  const result = calculateRiskScore({
    dateOfBirth: patient.dateOfBirth,
    chronicConditions: patient.chronicConditions,
    allergies: patient.allergies,
    medicationCount:    Number(activeMedsRow?.cnt  ?? 0),
    recentAbnormalLabs: Number(abnormalLabsRow?.cnt ?? 0),
    visitFrequency:     Number(recentVisitsRow?.cnt ?? 0),
  });

  res.json({
    patientId,
    ...result,
  });
});

router.get("/predictions/:patientId", async (req, res) => {
  const patientId = parseInt(req.params["patientId"]!);
  if (isNaN(patientId)) {
    res.status(400).json({ error: "BAD_REQUEST", message: "Invalid patient ID" });
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

  const [medications, labResults, visits] = await Promise.all([
    db.select().from(medicationsTable).where(and(eq(medicationsTable.patientId, patientId), eq(medicationsTable.isActive, true))).orderBy(desc(medicationsTable.createdAt)).limit(50),
    db.select().from(labResultsTable).where(eq(labResultsTable.patientId, patientId)).orderBy(desc(labResultsTable.testDate)).limit(20),
    db.select().from(visitsTable).where(eq(visitsTable.patientId, patientId)).orderBy(desc(visitsTable.visitDate)).limit(20),
  ]);

  const activeMedCount = medications.length;

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
  if (isNaN(patientId)) {
    res.status(400).json({ error: "BAD_REQUEST", message: "Invalid patient ID" });
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

  const decisionId = saved?.id;
  const { ipAddress, userAgent } = extractRequestMeta(req);

  // event log, risk-score update, and audit all go in parallel — none depends on the others
  await Promise.all([
    db.insert(eventsTable).values({
      eventType: "AI_DECISION_MADE",
      patientId,
      payload: { urgency: decision.urgency, riskScore: decision.riskScore, riskLevel: decision.riskLevel, primaryAction: decision.primaryAction, confidence: decision.confidence, decisionId },
      aiDecisionId: decisionId,
      source: "decision_engine_v3",
    }).catch(() => {}),
    db.update(patientsTable)
      .set({ riskScore: decision.riskScore, updatedAt: new Date() })
      .where(eq(patientsTable.id, patientId)),
    writeAudit({
      who: "AI Decision Engine v3",
      whoRole: "ai_system",
      action: "AI_DECISION",
      what: `Urgency=${decision.urgency.toUpperCase()} · Risk=${decision.riskScore}/100 · Action="${decision.primaryAction.substring(0, 80)}"`,
      patientId,
      details: { decisionId, factors: decision.whyFactors.length, confidence: decision.confidence, urgency: decision.urgency },
      aiDecisionId: decisionId,
      confidence: decision.confidence,
      ipAddress,
      userAgent,
    }),
  ]);

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
  // Provider resolution (admin-configured key → env key → Demo Mode) happens
  // inside streamClinicalNarrative — no env gate here.
  const patientId = parseInt(req.params["patientId"]!);
  const decisionId = parseInt(req.query["decisionId"] as string);
  
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

  let fullTranscript = "";

  try {
    await streamClinicalNarrative(
      ctx,
      (chunk, provider) => {
        fullTranscript += chunk;
        res.write(`data: ${JSON.stringify({ text: chunk, provider })}\n\n`);
      },
      async () => {
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
        
        if (!isNaN(decisionId)) {
          try {
            // Scope to THIS patient's decision — the patientId is already
            // ownership-checked above, so a caller can never attach a
            // transcript to another patient's decision row.
            const [existing] = await db.select().from(aiDecisionsTable)
              .where(and(eq(aiDecisionsTable.id, decisionId), eq(aiDecisionsTable.patientId, patientId)));
            if (existing) {
              const currentDetails = existing.details ? (existing.details as Record<string, unknown>) : {};
              currentDetails["narrative"] = fullTranscript;
              await db.update(aiDecisionsTable)
                .set({ details: currentDetails })
                .where(and(eq(aiDecisionsTable.id, decisionId), eq(aiDecisionsTable.patientId, patientId)));
            }
          } catch (dbErr) {
            console.error("Failed to persist narrative:", dbErr);
          }
        }
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
router.post("/chat/:patientId", validate(chatSchema), async (req, res) => {
  const patientId = parseInt(String(req.params["patientId"]));
  if (isNaN(patientId)) {
    res.status(400).json({ error: "BAD_REQUEST", message: "Invalid patientId" });
    return;
  }
  if (!(await requireOwnPatient(req, res, patientId))) return;

  const { question } = req.body as z.infer<typeof chatSchema>;

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

  const { ipAddress, userAgent } = extractRequestMeta(req);
  void writeAudit({
    who: req.userId ?? "Unknown",
    whoRole: req.role ?? "unknown",
    action: "AI_CHAT_QUERY",
    what: `Clinical Q&A queried about patient ${patientId}`,
    patientId,
    details: { question_length: question.length },
    confidence: 1.0,
    ipAddress,
    userAgent,
  });

  res.json({ patientId, question, answer, model: "gpt-4o" });
});

export default router;
