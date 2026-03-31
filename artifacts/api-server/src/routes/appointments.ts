import { Router } from "express";
import { db } from "@workspace/db";
import { patientsTable, appointmentsTable, auditLogTable } from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";

const router = Router();

const HOSPITALS = [
  "King Fahd Medical City — Riyadh",
  "King Abdulaziz Medical City — Jeddah",
  "King Khalid University Hospital — Riyadh",
  "Prince Sultan Military Medical City",
  "King Faisal Specialist Hospital & Research Centre",
  "Al-Noor Specialist Hospital — Makkah",
  "Maternity & Children Hospital — Dammam",
  "Aseer Central Hospital — Abha",
];

const DEPARTMENTS: Record<string, string[]> = {
  "Cardiology": ["Echocardiogram", "Stress Test", "Cardiac Catheterization Review", "Heart Failure Clinic", "Arrhythmia Clinic"],
  "Endocrinology": ["Diabetes Management", "Thyroid Evaluation", "Adrenal Workup", "HbA1c Review", "Metabolic Syndrome Clinic"],
  "Nephrology": ["CKD Monitoring", "Dialysis Assessment", "Renal Function Review", "Hypertension Clinic"],
  "Pulmonology": ["Spirometry", "COPD Management", "Asthma Review", "Sleep Apnea Evaluation"],
  "Neurology": ["Stroke Prevention", "Headache Clinic", "Epilepsy Management", "Memory Assessment"],
  "Orthopedics": ["Joint Pain Evaluation", "Post-op Follow-up", "Physiotherapy Referral", "Spine Clinic"],
  "Gastroenterology": ["Colonoscopy", "Liver Function Review", "IBD Management", "Nutritional Counseling"],
  "Oncology": ["Chemotherapy Consultation", "Cancer Screening", "Radiation Review", "Palliative Care"],
  "General Medicine": ["Annual Health Check", "Chronic Disease Review", "Preventive Care", "Health Promotion"],
  "Pediatrics": ["Child Health", "Vaccination", "Growth Assessment", "Developmental Screening"],
};

const ALL_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00",
];

async function getAvailableSlots(date: string, hospital: string, department: string): Promise<string[]> {
  const booked = await db.select({ time: appointmentsTable.appointmentTime })
    .from(appointmentsTable)
    .where(
      and(
        eq(appointmentsTable.appointmentDate, date),
        eq(appointmentsTable.hospital, hospital),
        eq(appointmentsTable.department, department),
        eq(appointmentsTable.status, "confirmed"),
      )
    );
  const bookedTimes = new Set(booked.map(b => b.time));
  return ALL_SLOTS.filter(s => !bookedTimes.has(s));
}

function generateAiReminders(hospital: string, department: string): string[] {
  const reminders: string[] = [`Bring your National ID and insurance card to ${hospital}`];
  if (department === "Cardiology") reminders.push("Avoid caffeine and heavy meals 4 hours before your appointment");
  else if (department === "Endocrinology") reminders.push("Fast for 8 hours before your appointment for accurate blood sugar readings");
  else if (department === "Nephrology") reminders.push("Bring a list of all current medications — kidney function affected by many drugs");
  else if (department === "Pulmonology") reminders.push("Do not use inhalers or bronchodilators 6 hours before spirometry testing");
  else reminders.push("Bring your complete medical history and recent lab results");
  reminders.push("Arrive 15 minutes early for registration");
  reminders.push(`Contact ${hospital} at least 24 hours in advance if you need to reschedule`);
  return reminders;
}

router.get("/slots", async (req, res) => {
  const { date, hospital, department } = req.query as Record<string, string>;
  if (!date || !hospital || !department) {
    return res.status(400).json({ error: "date, hospital, and department required" });
  }
  const slots = await getAvailableSlots(date, hospital, department);
  res.json({ slots, hospital, department, date });
});

router.get("/patient/:patientId", async (req, res) => {
  const patientId = parseInt(req.params["patientId"]!);
  if (isNaN(patientId)) return res.status(400).json({ error: "Invalid patientId" });

  const appointments = await db.select()
    .from(appointmentsTable)
    .where(eq(appointmentsTable.patientId, patientId))
    .orderBy(desc(appointmentsTable.createdAt));

  res.json({ appointments });
});

router.post("/", async (req, res) => {
  const { patientId, hospital, department, service, date, time, notes } = req.body;

  if (!patientId || !hospital || !department || !date || !time) {
    return res.status(400).json({ error: "patientId, hospital, department, date and time are required" });
  }

  const patient = await db.select().from(patientsTable).where(eq(patientsTable.id, patientId)).limit(1);
  if (patient.length === 0) return res.status(404).json({ error: "Patient not found" });

  const slots = await getAvailableSlots(date, hospital, department);
  if (!slots.includes(time)) {
    return res.status(409).json({ error: "This time slot is already booked. Please choose another." });
  }

  const year = new Date().getFullYear();
  const refSeq = Date.now().toString().slice(-5);
  const referenceNo = `APT-${year}-${refSeq}`;

  const [appointment] = await db.insert(appointmentsTable).values({
    patientId,
    patientName: patient[0]!.fullName,
    patientNationalId: patient[0]!.nationalId,
    hospital,
    department,
    service: service || department,
    appointmentDate: date,
    appointmentTime: time,
    status: "confirmed",
    referenceNo,
    notes: notes || null,
  }).returning();

  // Audit log
  await db.insert(auditLogTable).values({
    who: `Patient ${patient[0]!.fullName} (${patient[0]!.nationalId})`,
    whoRole: "citizen",
    what: `APPOINTMENT_BOOKED: ${department} at ${hospital} on ${date} ${time}`,
    patientId,
  }).catch(() => {});

  res.status(201).json({
    appointment: {
      ...appointment,
      aiReminders: generateAiReminders(hospital, department),
    },
    success: true,
  });
});

router.patch("/:id/cancel", async (req, res) => {
  const id = parseInt(req.params["id"]!);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const [updated] = await db.update(appointmentsTable)
    .set({ status: "cancelled", cancelledAt: new Date(), updatedAt: new Date() })
    .where(eq(appointmentsTable.id, id))
    .returning();

  if (!updated) return res.status(404).json({ error: "Appointment not found" });
  res.json({ success: true, appointment: updated });
});

router.patch("/:id/complete", async (req, res) => {
  const id = parseInt(req.params["id"]!);
  const [updated] = await db.update(appointmentsTable)
    .set({ status: "completed", completedAt: new Date(), updatedAt: new Date() })
    .where(eq(appointmentsTable.id, id))
    .returning();
  if (!updated) return res.status(404).json({ error: "Appointment not found" });
  res.json({ success: true });
});

router.get("/hospitals", (_req, res) => {
  res.json({ hospitals: HOSPITALS });
});

router.get("/departments", (_req, res) => {
  res.json({ departments: Object.keys(DEPARTMENTS), services: DEPARTMENTS });
});

// Admin — all upcoming appointments
router.get("/all", async (req, res) => {
  const limit = Math.min(parseInt(req.query["limit"] as string || "50"), 200);
  const appts = await db.select().from(appointmentsTable)
    .orderBy(desc(appointmentsTable.appointmentDate))
    .limit(limit);
  res.json({ appointments: appts, total: appts.length });
});

export default router;
