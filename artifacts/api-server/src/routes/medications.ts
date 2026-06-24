import { Router } from "express";
import { db } from "@workspace/db";
import { medicationsTable, patientsTable, alertsTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { checkDrugInteractions } from "../lib/ai-engine.js";
import { requireOwnPatient } from "../lib/ownership.js";
import { z } from "zod";
import { validate } from "../middlewares/validate.js";

const createMedicationSchema = z.object({
  patientId: z.number().int().positive(),
  drugName: z.string().min(1).max(200),
  dosage: z.string().min(1).max(100),
  frequency: z.string().min(1).max(100),
  prescribedBy: z.string().min(1).max(200),
  hospital: z.string().min(1).max(200),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD").optional(),
  notes: z.string().optional(),
});

const router = Router();

router.get("/", async (req, res) => {
  const patientId = parseInt(req.query["patientId"] as string);
  if (isNaN(patientId)) {
    res.status(400).json({ error: "INVALID_PARAM", message: "patientId is required" });
    return;
  }
  if (!(await requireOwnPatient(req, res, patientId))) return;

  const medications = await db
    .select()
    .from(medicationsTable)
    .where(eq(medicationsTable.patientId, patientId))
    .orderBy(desc(medicationsTable.createdAt))
    .limit(100);

  res.json({ medications });
});

router.post("/", validate(createMedicationSchema), async (req, res) => {
  // Prescribing is a clinical act — citizens cannot write medications.
  if (req.role === "citizen") {
    res.status(403).json({ error: "FORBIDDEN", message: "Only clinical roles may prescribe medications" });
    return;
  }
  const body = req.body as z.infer<typeof createMedicationSchema>;
  const patientId = body.patientId;

  const patient = await db
    .select()
    .from(patientsTable)
    .where(eq(patientsTable.id, patientId))
    .limit(1);

  if (!patient.length) {
    res.status(404).json({ error: "NOT_FOUND", message: "Patient not found" });
    return;
  }

  const existingMeds = await db
    .select()
    .from(medicationsTable)
    .where(eq(medicationsTable.patientId, patientId))
    .orderBy(desc(medicationsTable.createdAt))
    .limit(100);

  const activeMedNames = existingMeds.filter(m => m.isActive).map(m => m.drugName);
  const interactionWarnings = checkDrugInteractions(body.drugName, activeMedNames);

  const [medication] = await db
    .insert(medicationsTable)
    .values({
      patientId,
      drugName: body.drugName,
      dosage: body.dosage,
      frequency: body.frequency,
      prescribedBy: body.prescribedBy,
      hospital: body.hospital,
      startDate: body.startDate,
      endDate: body.endDate,
      notes: body.notes,
      isActive: true,
    })
    .returning();

  for (const warning of interactionWarnings) {
    if (warning.severity === "high" || warning.severity === "critical") {
      await db.insert(alertsTable).values({
        patientId,
        alertType: "drug-interaction",
        severity: warning.severity,
        title: `Drug Interaction: ${body.drugName} + ${warning.conflictingDrug}`,
        message: warning.description,
        isRead: false,
      });
    }
  }

  const safeToDispense = !interactionWarnings.some(
    w => w.severity === "critical" || w.severity === "high"
  );

  res.status(201).json({
    medication,
    interactionWarnings,
    safeToDispense,
  });
});

export default router;
