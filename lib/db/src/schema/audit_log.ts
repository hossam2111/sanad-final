import { pgTable, serial, integer, text, timestamp, jsonb, real, index } from "drizzle-orm/pg-core";

export const auditLogTable = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  who: text("who").notNull(),
  whoName: text("who_name"),
  whoRole: text("who_role").notNull(),
  action: text("action", {
    enum: ["READ", "CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT", "AI_DECISION", "DRUG_CHECK", "EXPORT"],
  }).notNull().default("CREATE"),
  what: text("what").notNull(),
  patientId: integer("patient_id"),
  details: jsonb("details"),
  aiDecisionId: integer("ai_decision_id"),
  confidence: real("confidence"),
  hash: text("hash"),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [
  index("idx_audit_patient_created").on(t.patientId, t.createdAt),
  index("idx_audit_who_created").on(t.who, t.createdAt),
]);

export type AuditLog = typeof auditLogTable.$inferSelect;
