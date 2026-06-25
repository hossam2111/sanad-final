import { Router } from "express";
import { z } from "zod";
import { db } from "@workspace/db";
import { patientsTable, medicationsTable, visitsTable, labResultsTable, alertsTable } from "@workspace/db/schema";
import { eq, ilike, or, and, desc, count, isNull } from "drizzle-orm";
import { calculateRiskScore } from "../lib/ai-engine.js";
import { writeAudit, writeAuditAsync, extractRequestMeta } from "../lib/audit.js";
import { validate } from "../middlewares/validate.js";
import { CLINICAL_ROLES, getStaffHospitalId } from "../lib/ownership.js";

const createPatientSchema = z.object({
  nationalId: z.string().min(10).max(10).regex(/^\d{10}$/, "National ID must be exactly 10 digits"),
  fullName: z.string().min(2).max(200),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  gender: z.enum(["male", "female"]),
  bloodType: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]),
  phone: z.string().max(20).optional(),
  emergencyContact: z.string().max(200).optional(),
  emergencyPhone: z.string().max(20).optional(),
  chronicConditions: z.array(z.string().max(200)).default([]),
  allergies: z.array(z.string().max(200)).default([]),
});

const router = Router();

router.get("/", async (req, res) => {
  // Citizens can only search their own record (BOLA enforcement on list endpoint)
  if (req.role === "citizen") {
    const nationalId = req.userNationalId;
    if (!nationalId) {
      res.status(403).json({ error: "FORBIDDEN", message: "Citizen token missing national ID binding" });
      return;
    }
    const patient = await db.select().from(patientsTable).where(eq(patientsTable.nationalId, nationalId)).limit(1);
    res.json({ patients: patient, total: patient.length, page: 1, limit: 1, pages: 1 });
    return;
  }

  const search = req.query["search"] as string | undefined;
  const pageRaw = parseInt((req.query["page"] as string) || "1");
  const limitRaw = Math.min(parseInt((req.query["limit"] as string) || "20"), 100);
  const page = isNaN(pageRaw) || pageRaw < 1 ? 1 : pageRaw;
  const limit = isNaN(limitRaw) || limitRaw < 1 ? 20 : limitRaw;
  const offset = (page - 1) * limit;

  const searchFilter = search
    ? or(ilike(patientsTable.fullName, `%${search}%`), ilike(patientsTable.nationalId, `%${search}%`))
    : undefined;

  let hospitalFilter;
  if (req.role && CLINICAL_ROLES.has(req.role) && req.role !== "admin" && req.role !== "emergency") {
    if (!req.username) {
      res.status(403).json({ error: "FORBIDDEN", message: "Clinical token missing username" });
      return;
    }
    const hospitalId = await getStaffHospitalId(req.username);
    if (!hospitalId) {
      res.json({ patients: [], total: 0, page: 1, limit: 1, pages: 1 });
      return;
    }
    hospitalFilter = or(
      eq(patientsTable.hospitalId, hospitalId),
      isNull(patientsTable.hospitalId),
    );
  }

  const finalFilter = hospitalFilter
    ? (searchFilter ? and(hospitalFilter, searchFilter) : hospitalFilter)
    : searchFilter;

  const [patients, [totalRow]] = await Promise.all([
    db.select().from(patientsTable).where(finalFilter).orderBy(desc(patientsTable.createdAt)).limit(limit).offset(offset),
    db.select({ count: count() }).from(patientsTable).where(finalFilter),
  ]);

  res.json({ patients, total: Number(totalRow?.count ?? 0), page, limit, pages: Math.ceil(Number(totalRow?.count ?? 0) / limit) });
});

router.get("/national/:nationalId", async (req, res) => {
  const { nationalId } = req.params;

  // C3 — BOLA: citizens can only access their own record
  if (req.role === "citizen" && req.userNationalId !== nationalId) {
    res.status(403).json({
      error: "FORBIDDEN",
      message: "Citizens may only access their own health record",
    });
    return;
  }

  const patient = await db
    .select()
    .from(patientsTable)
    .where(eq(patientsTable.nationalId, nationalId))
    .limit(1);

  if (!patient.length) {
    res.status(404).json({ error: "NOT_FOUND", message: "Patient not found" });
    return;
  }

  const p = patient[0]!;

  if (req.role && CLINICAL_ROLES.has(req.role) && req.role !== "admin" && req.role !== "emergency") {
    if (!req.username) {
      res.status(403).json({ error: "FORBIDDEN", message: "Clinical token missing username" });
      return;
    }
    const hospitalId = await getStaffHospitalId(req.username);
    if (!hospitalId || (p.hospitalId !== null && p.hospitalId !== hospitalId)) {
      res.status(403).json({ error: "FORBIDDEN", message: "Patient is registered at a different hospital" });
      return;
    }
  }
  const [medications, visits, labResults, alerts] = await Promise.all([
    db.select().from(medicationsTable).where(eq(medicationsTable.patientId, p.id)).orderBy(desc(medicationsTable.createdAt)).limit(200),
    db.select().from(visitsTable).where(eq(visitsTable.patientId, p.id)).orderBy(desc(visitsTable.visitDate)).limit(200),
    db.select().from(labResultsTable).where(eq(labResultsTable.patientId, p.id)).orderBy(desc(labResultsTable.testDate)).limit(200),
    db.select().from(alertsTable).where(eq(alertsTable.patientId, p.id)).orderBy(desc(alertsTable.createdAt)).limit(100),
  ]);

  const abnormalLabs = labResults.filter(l => l.status !== "normal").length;
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const recentVisits = visits.filter(v => new Date(v.visitDate) >= oneYearAgo).length;

  const riskData = calculateRiskScore({
    dateOfBirth: p.dateOfBirth,
    chronicConditions: p.chronicConditions,
    allergies: p.allergies,
    medicationCount: medications.filter(m => m.isActive).length,
    recentAbnormalLabs: abnormalLabs,
    visitFrequency: recentVisits,
  });

  const { ipAddress, userAgent } = extractRequestMeta(req);

  // Only persist risk score when it changed — saves one write per request
  if (riskData.riskScore !== p.riskScore) {
    db.update(patientsTable).set({ riskScore: riskData.riskScore }).where(eq(patientsTable.id, p.id)).catch(() => {});
  }

  // Audit runs in parallel with risk-score write — both after we have all data
  void writeAudit({
    who: req.userId ?? req.role ?? "unknown",
    whoName: req.userName,
    whoRole: req.role ?? "unknown",
    action: "READ",
    what: `Patient record accessed: ${p.fullName} (${nationalId})`,
    patientId: p.id,
    ipAddress,
    userAgent,
  }).then(() => {}).catch(() => {});

  res.json({
    ...p,
    medications,
    visits,
    labResults,
    alerts,
    riskScore: riskData.riskScore,
  });
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params["id"]!);
  if (isNaN(id)) {
    res.status(400).json({ error: "BAD_REQUEST", message: "Invalid patient ID" });
    return;
  }

  // Citizens cannot access records by numeric ID — they must use /national/:nationalId
  // which enforces BOLA. Block this path for citizens entirely.
  if (req.role === "citizen") {
    res.status(403).json({
      error: "FORBIDDEN",
      message: "Citizens must access records via /patients/national/:nationalId",
    });
    return;
  }

  const patient = await db.select().from(patientsTable).where(eq(patientsTable.id, id)).limit(1);

  if (!patient.length) {
    res.status(404).json({ error: "NOT_FOUND", message: "Patient not found" });
    return;
  }

  const p = patient[0]!;

  if (req.role && CLINICAL_ROLES.has(req.role) && req.role !== "admin" && req.role !== "emergency") {
    if (!req.username) {
      res.status(403).json({ error: "FORBIDDEN", message: "Clinical token missing username" });
      return;
    }
    const hospitalId = await getStaffHospitalId(req.username);
    if (!hospitalId || (p.hospitalId !== null && p.hospitalId !== hospitalId)) {
      res.status(403).json({ error: "FORBIDDEN", message: "Patient is registered at a different hospital" });
      return;
    }
  }
  const [medications, visits, labResults, alerts] = await Promise.all([
    db.select().from(medicationsTable).where(eq(medicationsTable.patientId, p.id)).orderBy(desc(medicationsTable.createdAt)).limit(200),
    db.select().from(visitsTable).where(eq(visitsTable.patientId, p.id)).orderBy(desc(visitsTable.visitDate)).limit(200),
    db.select().from(labResultsTable).where(eq(labResultsTable.patientId, p.id)).orderBy(desc(labResultsTable.testDate)).limit(200),
    db.select().from(alertsTable).where(eq(alertsTable.patientId, p.id)).orderBy(desc(alertsTable.createdAt)).limit(100),
  ]);

  const abnormalLabs = labResults.filter(l => l.status !== "normal").length;
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const recentVisits = visits.filter(v => new Date(v.visitDate) >= oneYearAgo).length;

  const riskData = calculateRiskScore({
    dateOfBirth: p.dateOfBirth,
    chronicConditions: p.chronicConditions,
    allergies: p.allergies,
    medicationCount: medications.filter(m => m.isActive).length,
    recentAbnormalLabs: abnormalLabs,
    visitFrequency: recentVisits,
  });

  const { ipAddress, userAgent } = extractRequestMeta(req);

  if (riskData.riskScore !== p.riskScore) {
    db.update(patientsTable).set({ riskScore: riskData.riskScore }).where(eq(patientsTable.id, p.id)).catch(() => {});
  }

  void writeAudit({
    who: req.userId ?? req.role ?? "unknown",
    whoName: req.userName,
    whoRole: req.role ?? "unknown",
    action: "READ",
    what: `Patient record accessed: ${p.fullName} (ID: ${id})`,
    patientId: p.id,
    ipAddress,
    userAgent,
  }).then(() => {}).catch(() => {});

  res.json({
    ...p,
    medications,
    visits,
    labResults,
    alerts,
    riskScore: riskData.riskScore,
  });
});

router.post("/", validate(createPatientSchema), async (req, res) => {
  // Registering patients is an institutional act — citizen tokens cannot
  // create records.
  if (req.role === "citizen") {
    res.status(403).json({ error: "FORBIDDEN", message: "Citizens cannot register patient records" });
    return;
  }
  const body = req.body as z.infer<typeof createPatientSchema>;
  const [patient] = await db
    .insert(patientsTable)
    .values({
      nationalId: body.nationalId,
      fullName: body.fullName,
      dateOfBirth: body.dateOfBirth,
      gender: body.gender,
      bloodType: body.bloodType,
      phone: body.phone,
      emergencyContact: body.emergencyContact,
      emergencyPhone: body.emergencyPhone,
      chronicConditions: body.chronicConditions,
      allergies: body.allergies,
    })
    .returning();

  const { ipAddress, userAgent } = extractRequestMeta(req);
  await writeAudit({
    who: req.userId ?? req.role ?? "unknown",
    whoName: req.userName,
    whoRole: req.role ?? "unknown",
    action: "CREATE",
    what: `New patient registered: ${body.fullName} (${body.nationalId})`,
    patientId: patient?.id,
    ipAddress,
    userAgent,
  });

  res.status(201).json(patient);
});

export default router;
