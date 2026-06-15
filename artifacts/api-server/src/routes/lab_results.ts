import { Router } from "express";
import { db } from "@workspace/db";
import { labResultsTable, alertsTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireOwnPatient } from "../lib/ownership.js";

const router = Router();

router.get("/", async (req, res) => {
  const patientId = parseInt(req.query["patientId"] as string);
  if (isNaN(patientId)) {
    res.status(400).json({ error: "INVALID_PARAM", message: "patientId is required" });
    return;
  }
  if (!(await requireOwnPatient(req, res, patientId))) return;

  const labResults = await db
    .select()
    .from(labResultsTable)
    .where(eq(labResultsTable.patientId, patientId))
    .orderBy(desc(labResultsTable.testDate));

  res.json({ labResults });
});

router.post("/", async (req, res) => {
  // Publishing lab results is a clinical act — citizens cannot write results.
  if (req.role === "citizen") {
    res.status(403).json({ error: "FORBIDDEN", message: "Only clinical roles may record lab results" });
    return;
  }
  const body = req.body;
  const [labResult] = await db
    .insert(labResultsTable)
    .values({
      patientId: body.patientId,
      testName: body.testName,
      testDate: body.testDate,
      result: body.result,
      unit: body.unit,
      referenceRange: body.referenceRange,
      status: body.status,
      hospital: body.hospital,
      notes: body.notes,
    })
    .returning();

  if (body.status === "critical") {
    await db.insert(alertsTable).values({
      patientId: body.patientId,
      alertType: "critical-lab",
      severity: "critical",
      title: `Critical Lab Result: ${body.testName}`,
      message: `Critical result: ${body.result} ${body.unit || ""}. Reference: ${body.referenceRange || "N/A"}`,
      isRead: false,
    });
  }

  res.status(201).json(labResult);
});

export default router;
