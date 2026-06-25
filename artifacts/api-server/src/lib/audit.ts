import { createHash } from "crypto";
import { db } from "@workspace/db";
import { auditLogTable } from "@workspace/db/schema";
import { desc, sql } from "drizzle-orm";
import { logger } from "./logger.js";

export type AuditAction = "READ" | "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | "LOGIN_FAILED" | "AI_DECISION" | "AI_CHAT_QUERY" | "DRUG_CHECK" | "EXPORT" | "PRESCRIBE_MEDICATION" | "CREATE_VISIT" | "CREATE_LAB_RESULT" | "CREATE_APPOINTMENT" | "UPDATE_APPOINTMENT";

export interface AuditParams {
  who: string;
  whoName?: string;
  whoRole: string;
  action: AuditAction;
  what: string;
  patientId?: number;
  details?: Record<string, unknown>;
  aiDecisionId?: number;
  confidence?: number;
  ipAddress?: string;
  userAgent?: string;
}

let auditFailureCount = 0;

export function getAuditMetrics() {
  return { failureCount: auditFailureCount };
}

// Fields included in the integrity hash — whoName is metadata only, not hashed.
// This makes the hash stable regardless of display-name changes.
interface HashRecord {
  who: string;
  whoRole: string;
  action: AuditAction;
  what: string;
  patientId?: number;
  details?: Record<string, unknown>;
  aiDecisionId?: number;
  confidence?: number;
  createdAt: string;
}

// The hash must survive a database round-trip:
//  • jsonb does NOT preserve object key order → sort keys recursively.
//  • `confidence` is a float4 column → coerce through Math.fround so the
//    written value and the re-read value hash identically.
function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, v]) => v !== undefined)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([k, v]) => [k, canonicalize(v)]),
    );
  }
  return value;
}

export function computeAuditHash(prevHash: string | null, record: HashRecord): string {
  const stable: HashRecord = {
    ...record,
    confidence: record.confidence !== undefined ? Math.fround(record.confidence) : undefined,
  };
  const data = JSON.stringify(canonicalize({ prevHash: prevHash ?? "GENESIS", ...stable }));
  return createHash("sha256").update(data).digest("hex");
}

/**
 * Fire-and-forget audit write — response is not blocked waiting for the chain lock.
 * Use for READ operations where latency matters more than write confirmation.
 */
export function writeAuditAsync(params: AuditParams): void {
  writeAudit(params).catch(() => { /* already handled inside writeAudit */ });
}

export async function writeAudit(params: AuditParams): Promise<void> {
  try {
    // Serialize chain writers with an advisory transaction lock. (FOR UPDATE on
    // the last row is NOT enough: it doesn't block a concurrent writer from
    // reading the same "last" row before either inserts, which forks the chain.)
    // The lock releases automatically at commit/rollback. We also walk by id —
    // the same order the verifier uses — so same-millisecond timestamps can
    // never fork the chain.
    await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext('sanad_audit_chain'))`);
      const [last] = await tx
        .select({ hash: auditLogTable.hash })
        .from(auditLogTable)
        .orderBy(desc(auditLogTable.id))
        .limit(1);

      const prevHash = last?.hash ?? null;
      // Application timestamp is used both in the hash and the DB row so they match exactly.
      const now = new Date();
      const nowISO = now.toISOString();

      const hashRecord: HashRecord = {
        who: params.who,
        whoRole: params.whoRole,
        action: params.action,
        what: params.what,
        patientId: params.patientId,
        details: params.details,
        aiDecisionId: params.aiDecisionId,
        confidence: params.confidence,
        createdAt: nowISO,
      };

      const hash = computeAuditHash(prevHash, hashRecord);

      await tx.insert(auditLogTable).values({
        who: params.who,
        whoName: params.whoName ?? null,
        whoRole: params.whoRole,
        action: params.action,
        what: `[${params.action}] ${params.what}`,
        patientId: params.patientId,
        details: {
          ...params.details,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        },
        aiDecisionId: params.aiDecisionId,
        confidence: params.confidence ?? null,
        hash,
        createdAt: now,
      });
    });
  } catch (err) {
    // Audit failures must never crash the main request — log and continue
    auditFailureCount += 1;
    logger.error({
      err,
      auditFailureCount,
      action: params.action,
      who: params.who,
      whoRole: params.whoRole,
      patientId: params.patientId,
    }, "Audit write failed");
  }
}

export function extractRequestMeta(req: { ip?: string; headers: Record<string, string | string[] | undefined> }): {
  ipAddress: string;
  userAgent: string;
} {
  return {
    ipAddress: (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ?? req.ip ?? "unknown",
    userAgent: (req.headers["user-agent"] as string | undefined) ?? "unknown",
  };
}
