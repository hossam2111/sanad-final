import { pgTable, serial, integer, text, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { patientsTable } from "./patients";

export const consentTable = pgTable("consent_records", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patientsTable.id, { onDelete: "cascade" }),
  consentType: text("consent_type").notNull(), // data_sharing | research | emergency_access | insurance | family_linking
  purpose: text("purpose").notNull(),
  grantedTo: text("granted_to").notNull(), // role or org name
  granted: boolean("granted").notNull().default(false),
  expiresAt: timestamp("expires_at"),
  revokedAt: timestamp("revoked_at"),
  grantedAt: timestamp("granted_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  notes: text("notes"),
}, (t) => [
  // Composite index covers the only query pattern: WHERE patient_id = ? AND consent_type = ?
  index("idx_consent_patient_type").on(t.patientId, t.consentType),
]);

export type ConsentRecord = typeof consentTable.$inferSelect;
