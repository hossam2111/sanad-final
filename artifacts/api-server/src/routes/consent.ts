import { Router } from "express";
import { db } from "@workspace/db";
import { consentTable, patientsTable, auditLogTable } from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";

const router = Router();

const CONSENT_DEFINITIONS = [
  {
    type: "data_sharing",
    title: "Medical Data Sharing",
    description: "Allow your medical records to be accessed by treating physicians, specialists, and emergency responders across the national SANAD network.",
    grantedTo: "SANAD Clinical Network",
    defaultGranted: true,
    canRevoke: true,
    legalBasis: "MOH Circular 42/1445 — Patient Data Rights",
    icon: "Share2",
    severity: "medium",
  },
  {
    type: "emergency_access",
    title: "Emergency Access Override",
    description: "Allow emergency responders to access your full medical record without prior authorization during a declared medical emergency.",
    grantedTo: "SRCA Emergency Services",
    defaultGranted: true,
    canRevoke: true,
    legalBasis: "MOH Emergency Health Act — Article 18",
    icon: "Siren",
    severity: "high",
  },
  {
    type: "research",
    title: "Anonymous Research Participation",
    description: "Allow your de-identified, anonymized health data to be used for national health research and population studies. No personally identifiable information is shared.",
    grantedTo: "SANAD Research Division",
    defaultGranted: false,
    canRevoke: true,
    legalBasis: "National Bioethics Committee Guidelines 2024",
    icon: "FlaskConical",
    severity: "low",
  },
  {
    type: "insurance",
    title: "Insurance Data Access",
    description: "Allow Tawuniya and affiliated insurers to access relevant medical records for claims processing, pre-authorizations, and coverage verification.",
    grantedTo: "Tawuniya Insurance",
    defaultGranted: true,
    canRevoke: true,
    legalBasis: "CCHI Unified Medical Record Policy",
    icon: "Shield",
    severity: "medium",
  },
  {
    type: "family_linking",
    title: "Family Health Linking",
    description: "Allow your health record to be linked to immediate family members for genetic risk analysis and hereditary condition tracking.",
    grantedTo: "SANAD Family Health Module",
    defaultGranted: false,
    canRevoke: true,
    legalBasis: "Patient-initiated family consent",
    icon: "Users",
    severity: "low",
  },
  {
    type: "ai_processing",
    title: "AI Clinical Decision Processing",
    description: "Allow the SANAD AI engines to process your health data to generate risk scores, treatment recommendations, and predictive health models.",
    grantedTo: "SANAD AI Division",
    defaultGranted: true,
    canRevoke: false,
    legalBasis: "Required for SANAD platform functionality — MOH AI Framework 2024",
    icon: "Brain",
    severity: "low",
  },
];

// GET /api/consent/patient/:nationalId — load consent profile
router.get("/patient/:nationalId", async (req, res) => {
  const { nationalId } = req.params;

  const patients = await db.select().from(patientsTable)
    .where(eq(patientsTable.nationalId, nationalId)).limit(1);

  if (!patients.length) {
    return res.status(404).json({ error: "NOT_FOUND", message: "Patient not found" });
  }

  const patient = patients[0]!;

  // Get existing consent records
  const records = await db.select().from(consentTable)
    .where(eq(consentTable.patientId, patient.id))
    .orderBy(desc(consentTable.updatedAt));

  // Build full consent profile — merge DB records with definitions
  const consentProfile = CONSENT_DEFINITIONS.map(def => {
    const existing = records.find(r => r.consentType === def.type && !r.revokedAt);
    return {
      type: def.type,
      title: def.title,
      description: def.description,
      grantedTo: def.grantedTo,
      legalBasis: def.legalBasis,
      icon: def.icon,
      severity: def.severity,
      canRevoke: def.canRevoke,
      granted: existing ? existing.granted : def.defaultGranted,
      grantedAt: existing?.grantedAt ?? null,
      expiresAt: existing?.expiresAt ?? null,
      revokedAt: existing?.revokedAt ?? null,
      consentId: existing?.id ?? null,
      isDefault: !existing,
    };
  });

  // Audit trail for this patient
  const history = records.map(r => ({
    id: r.id,
    type: r.consentType,
    action: r.revokedAt ? "revoked" : "granted",
    granted: r.granted,
    grantedTo: r.grantedTo,
    timestamp: r.revokedAt ?? r.grantedAt,
    notes: r.notes,
  }));

  res.json({
    patient: {
      id: patient.id,
      name: patient.fullName,
      nationalId: patient.nationalId,
    },
    consents: consentProfile,
    history: history.slice(0, 20),
    summary: {
      total: consentProfile.length,
      granted: consentProfile.filter(c => c.granted).length,
      revoked: consentProfile.filter(c => !c.granted).length,
      pending: consentProfile.filter(c => c.isDefault).length,
    },
  });
});

// POST /api/consent/grant — grant or update a consent
router.post("/grant", async (req, res) => {
  const { nationalId, consentType, granted, expiryDays, notes } = req.body;

  if (!nationalId || !consentType || granted === undefined) {
    return res.status(400).json({ error: "INVALID_PARAMS", message: "nationalId, consentType, and granted are required" });
  }

  const patients = await db.select().from(patientsTable)
    .where(eq(patientsTable.nationalId, nationalId)).limit(1);

  if (!patients.length) {
    return res.status(404).json({ error: "NOT_FOUND", message: "Patient not found" });
  }

  const patient = patients[0]!;
  const def = CONSENT_DEFINITIONS.find(d => d.type === consentType);

  if (!def) {
    return res.status(400).json({ error: "INVALID_TYPE", message: `Unknown consent type: ${consentType}` });
  }

  if (!def.canRevoke && !granted) {
    return res.status(403).json({ error: "IRREVOCABLE", message: `Consent '${consentType}' is required for platform operation and cannot be revoked.` });
  }

  // Revoke any existing active consent of this type
  await db.update(consentTable)
    .set({ revokedAt: new Date(), updatedAt: new Date() })
    .where(and(
      eq(consentTable.patientId, patient.id),
      eq(consentTable.consentType, consentType)
    ));

  // Create new consent record
  const expiresAt = expiryDays ? new Date(Date.now() + expiryDays * 86400000) : null;

  const [newRecord] = await db.insert(consentTable).values({
    patientId: patient.id,
    consentType,
    purpose: def.description,
    grantedTo: def.grantedTo,
    granted,
    expiresAt,
    notes: notes ?? null,
    ipAddress: req.ip ?? null,
  }).returning();

  // Log to audit trail
  await db.insert(auditLogTable).values({
    who: `Patient ${patient.fullName} (${patient.nationalId})`,
    whoRole: "citizen",
    what: `CONSENT_${granted ? "GRANTED" : "REVOKED"}: ${consentType} → ${def.grantedTo}`,
    patientId: patient.id,
  }).catch(() => {});

  res.json({
    success: true,
    consent: newRecord,
    message: `Consent '${def.title}' has been ${granted ? "granted" : "revoked"} successfully.`,
  });
});

// GET /api/consent/definitions — return all consent types
router.get("/definitions", (_req, res) => {
  res.json({ definitions: CONSENT_DEFINITIONS });
});

export default router;
