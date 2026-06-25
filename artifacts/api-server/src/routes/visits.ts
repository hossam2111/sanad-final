import { Router } from "express";
import { db } from "@workspace/db";
import { visitsTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireOwnPatient, isClinicalRole } from "../lib/ownership.js";
import { writeAudit, extractRequestMeta } from "../lib/audit.js";
import { z } from "zod";
import { validate } from "../middlewares/validate.js";

const createVisitSchema = z.object({
  patientId: z.number().int().positive(),
  visitDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  hospital: z.string().min(1).max(200),
  department: z.string().min(1).max(200),
  doctor: z.string().min(1).max(200),
  diagnosis: z.string().min(1).max(500),
  notes: z.string().optional(),
  visitType: z.enum(["emergency", "outpatient", "inpatient"]),
});

const router = Router();

router.get("/", async (req, res) => {
  const patientId = parseInt(req.query["patientId"] as string);
  if (isNaN(patientId)) {
    res.status(400).json({ error: "INVALID_PARAM", message: "patientId is required" });
    return;
  }
  if (!(await requireOwnPatient(req, res, patientId))) return;

  const visits = await db
    .select()
    .from(visitsTable)
    .where(eq(visitsTable.patientId, patientId))
    .orderBy(desc(visitsTable.visitDate))
    .limit(100);

  res.json({ visits });
});

router.post("/", validate(createVisitSchema), async (req, res) => {
  // Recording a visit is a clinical act — non-clinical roles cannot write visits.
  if (!isClinicalRole(req.role)) {
    res.status(403).json({ error: "FORBIDDEN", message: "Only clinical roles may record visits" });
    return;
  }
  const body = req.body as z.infer<typeof createVisitSchema>;
  const [visit] = await db
    .insert(visitsTable)
    .values({
      patientId: body.patientId,
      visitDate: body.visitDate,
      hospital: body.hospital,
      department: body.department,
      doctor: body.doctor,
      diagnosis: body.diagnosis,
      notes: body.notes,
      visitType: body.visitType,
    })
    .returning();

  const { ipAddress, userAgent } = extractRequestMeta(req);
  await writeAudit({
    who: req.userId ?? req.role ?? "unknown",
    whoName: req.userName,
    whoRole: req.role ?? "unknown",
    action: "CREATE_VISIT",
    what: `Clinical visit recorded: ${body.visitType} at ${body.hospital}`,
    patientId: body.patientId,
    details: { diagnosis: body.diagnosis, doctor: body.doctor },
    ipAddress,
    userAgent,
  });

  res.status(201).json(visit);
});

export default router;
