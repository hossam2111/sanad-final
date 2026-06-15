import { pgTable, serial, integer, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { patientsTable } from "./patients";

export const eventsTable = pgTable("events", {
  id: serial("id").primaryKey(),
  eventType: text("event_type").notNull(),
  patientId: integer("patient_id").references(() => patientsTable.id),
  payload: jsonb("payload").notNull(),
  processedAt: timestamp("processed_at").defaultNow(),
  aiDecisionId: integer("ai_decision_id"),
  source: text("source").default("system"),
}, (t) => [
  index("idx_events_patient_id").on(t.patientId),
  index("idx_events_event_type").on(t.eventType),
  index("idx_events_processed_at").on(t.processedAt),
]);

export type Event = typeof eventsTable.$inferSelect;
