import { pgTable, serial, text, date, timestamp, integer, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const patientsTable = pgTable("patients", {
  id: serial("id").primaryKey(),
  nationalId: text("national_id").notNull().unique(),
  fullName: text("full_name").notNull(),
  dateOfBirth: date("date_of_birth").notNull(),
  gender: text("gender", { enum: ["male", "female"] }).notNull(),
  bloodType: text("blood_type").notNull(),
  phone: text("phone"),
  emergencyContact: text("emergency_contact"),
  emergencyPhone: text("emergency_phone"),
  chronicConditions: text("chronic_conditions").array().default([]),
  allergies: text("allergies").array().default([]),
  riskScore: integer("risk_score").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [
  index("idx_patients_risk_score").on(t.riskScore),
  index("idx_patients_gender").on(t.gender),
]);

export const insertPatientSchema = createInsertSchema(patientsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Patient = typeof patientsTable.$inferSelect;
