import { Router } from "express";
import { db } from "@workspace/db";
import { labResultsTable, alertsTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireOwnPatient, isClinicalRole } from "../lib/ownership.js";
import { z } from "zod";
import { validate } from "../middlewares/validate.js";

const createLabResultSchema = z.object({
  patientId: z.number().int().positive(),
  testName: z.string().min(1).max(200),
  testDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  result: z.string().min(1).max(200),
  unit: z.string().max(50).optional(),
  referenceRange: z.string().max(100).optional(),
  status: z.enum(["normal", "abnormal", "critical"]),
  hospital: z.string().min(1).max(200),
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

  const labResults = await db
    .select()
    .from(labResultsTable)
    .where(eq(labResultsTable.patientId, patientId))
    .orderBy(desc(labResultsTable.testDate))
    .limit(100);

  res.json({ labResults });
});

router.post("/", (req, res, next) => {
  if (!isClinicalRole(req.role)) {
    res.status(403).json({ error: "FORBIDDEN", message: "Only clinical roles may record lab results" });
    return;
  }
  next();
}, validate(createLabResultSchema), async (req, res) => {
  const body = req.body as z.infer<typeof createLabResultSchema>;
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
