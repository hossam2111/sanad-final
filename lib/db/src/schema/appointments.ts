import { pgTable, serial, integer, text, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { patientsTable } from "./patients";

export const appointmentsTable = pgTable("appointments", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patientsTable.id, { onDelete: "restrict" }),
  patientName: text("patient_name").notNull(),
  patientNationalId: text("patient_national_id").notNull(),
  hospital: text("hospital").notNull(),
  department: text("department").notNull(),
  service: text("service"),
  appointmentDate: text("appointment_date").notNull(), // YYYY-MM-DD
  appointmentTime: text("appointment_time").notNull(), // HH:MM
  status: text("status").notNull().default("confirmed"), // confirmed | cancelled | completed | no_show
  referenceNo: text("reference_no").notNull(),
  notes: text("notes"),
  cancelledAt: timestamp("cancelled_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [
  index("idx_appointments_patient_id").on(t.patientId),
  index("idx_appointments_date").on(t.appointmentDate),
  index("idx_appointments_status").on(t.status),
]);

export type Appointment = typeof appointmentsTable.$inferSelect;
