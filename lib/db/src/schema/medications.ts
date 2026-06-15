import { pgTable, serial, integer, text, date, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { patientsTable } from "./patients";

export const medicationsTable = pgTable("medications", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patientsTable.id),
  drugName: text("drug_name").notNull(),
  dosage: text("dosage").notNull(),
  frequency: text("frequency").notNull(),
  prescribedBy: text("prescribed_by").notNull(),
  hospital: text("hospital").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  isActive: boolean("is_active").default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [
  index("idx_medications_patient_id").on(t.patientId),
  index("idx_medications_patient_active").on(t.patientId, t.isActive),
  index("idx_medications_drug_name").on(t.drugName),
]);

export const insertMedicationSchema = createInsertSchema(medicationsTable).omit({ id: true, createdAt: true });
export type InsertMedication = z.infer<typeof insertMedicationSchema>;
export type Medication = typeof medicationsTable.$inferSelect;
