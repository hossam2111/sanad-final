import { pgTable, serial, integer, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const consentTable = pgTable("consent_records", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
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
});

export type ConsentRecord = typeof consentTable.$inferSelect;
