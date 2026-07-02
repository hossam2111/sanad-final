import type { Request, Response } from "express";
import { db } from "@workspace/db";
import { patientsTable, consentTable, staffAssignmentsTable } from "@workspace/db/schema";
import { eq, and, desc, isNull, inArray, or, gt } from "drizzle-orm";

// Roles that act on patients institutionally (treatment / operations).
// Everyone else is bound to a single record (citizen) or to consent-gated
// access (family, insurance).
export const CLINICAL_ROLES = new Set(["doctor", "emergency", "admin", "hospital", "lab", "pharmacy"]);

export function isClinicalRole(role: string | undefined): boolean {
  return !!role && CLINICAL_ROLES.has(role);
}

// nationalId → numeric patient id. Ids are immutable, so a short TTL only
// bounds memory, not correctness.
const idCache = new Map<string, { id: number; ts: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

/** Numeric patient id of the citizen's own record, resolved from the token's nationalId. */
export async function resolveOwnPatientId(req: Request): Promise<number | null> {
  const nationalId = req.userNationalId;
  if (!nationalId) return null;

  const hit = idCache.get(nationalId);
  if (hit && Date.now() - hit.ts < CACHE_TTL_MS) return hit.id;

  const [row] = await db
    .select({ id: patientsTable.id })
    .from(patientsTable)
    .where(eq(patientsTable.nationalId, nationalId))
    .limit(1);
  if (!row) return null;

  idCache.set(nationalId, { id: row.id, ts: Date.now() });
  return row.id;
}

function forbidNotOwner(res: Response): void {
  res.status(403).json({
    error: "FORBIDDEN",
    message: "You may only access your own health record",
  });
}

/**
 * BOLA guard for numeric patient ids. Institutional roles pass through;
 * citizens must match their own record. Returns true when the request may
 * proceed (a 403 has already been written when it returns false).
 */
export async function requireOwnPatient(req: Request, res: Response, patientId: number): Promise<boolean> {
  if (req.role !== "citizen") return true;
  const ownId = await resolveOwnPatientId(req);
  if (ownId !== null && Number.isFinite(patientId) && patientId === ownId) return true;
  forbidNotOwner(res);
  return false;
}

/** BOLA guard for 10-digit national ids — same contract as requireOwnPatient. */
export function requireOwnNationalId(req: Request, res: Response, nationalId: string | undefined): boolean {
  if (req.role !== "citizen") return true;
  if (nationalId && req.userNationalId === nationalId) return true;
  forbidNotOwner(res);
  return false;
}

/**
 * Latest active (non-revoked) consent decision for a patient, or null when the
 * patient never recorded one — the caller applies the consent definition's
 * default in that case.
 */
export async function getConsentState(patientId: number, consentType: string): Promise<boolean | null> {
  const [row] = await db
    .select({ granted: consentTable.granted })
    .from(consentTable)
    .where(and(
      eq(consentTable.patientId, patientId),
      eq(consentTable.consentType, consentType),
      isNull(consentTable.revokedAt),
      or(isNull(consentTable.expiresAt), gt(consentTable.expiresAt, new Date())),
    ))
    .orderBy(desc(consentTable.updatedAt))
    .limit(1);
  return row ? row.granted : null;
}

/**
 * Batch variant of getConsentState — one DB round-trip for all patientIds.
 * Returns a Map; patients with no consent record are absent from the Map
 * (caller should apply the consent type's default in that case).
 */
export async function getConsentStateBulk(
  patientIds: number[],
  consentType: string,
): Promise<Map<number, boolean>> {
  if (patientIds.length === 0) return new Map();

  const rows = await db
    .select({ patientId: consentTable.patientId, granted: consentTable.granted })
    .from(consentTable)
    .where(and(
      inArray(consentTable.patientId, patientIds),
      eq(consentTable.consentType, consentType),
      isNull(consentTable.revokedAt),
      or(isNull(consentTable.expiresAt), gt(consentTable.expiresAt, new Date())),
    ))
    .orderBy(desc(consentTable.updatedAt));

  // Keep only the first (latest) row per patient — orderBy desc guarantees this.
  const result = new Map<number, boolean>();
  for (const row of rows) {
    if (!result.has(row.patientId)) {
      result.set(row.patientId, row.granted);
    }
  }
  return result;
}

const hospitalIdCache = new Map<string, { hospitalId: string | null; ts: number }>();

// Evict expired entries every 10 minutes so caches don't grow unboundedly.
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of idCache) if (now - v.ts >= CACHE_TTL_MS) idCache.delete(k);
  for (const [k, v] of hospitalIdCache) if (now - v.ts >= CACHE_TTL_MS) hospitalIdCache.delete(k);
}, 10 * 60 * 1000).unref();

export async function getStaffHospitalId(username: string): Promise<string | null> {
  const hit = hospitalIdCache.get(username);
  if (hit && Date.now() - hit.ts < CACHE_TTL_MS) return hit.hospitalId;

  const [row] = await db.select({ hospitalId: staffAssignmentsTable.hospitalId })
    .from(staffAssignmentsTable)
    .where(eq(staffAssignmentsTable.username, username))
    .limit(1);

  const hospitalId = row?.hospitalId ?? null;
  hospitalIdCache.set(username, { hospitalId, ts: Date.now() });
  return hospitalId;
}
