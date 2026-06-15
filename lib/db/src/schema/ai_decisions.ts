import { pgTable, serial, integer, text, real, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { patientsTable } from "./patients";

export const aiDecisionsTable = pgTable("ai_decisions", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => patientsTable.id).notNull(),
  riskScore: integer("risk_score").notNull(),
  riskLevel: text("risk_level", { enum: ["low", "medium", "high", "critical"] }).notNull(),
  urgency: text("urgency", { enum: ["routine", "soon", "urgent", "immediate"] }).notNull(),
  primaryAction: text("primary_action").notNull(),
  timeWindow: text("time_window").notNull(),
  whyFactors: jsonb("why_factors").notNull(),
  confidence: real("confidence").notNull(),
  source: text("source").default("clinical_rules"),
  recommendations: jsonb("recommendations").notNull(),
  digitalTwinProjection: jsonb("digital_twin_projection"),
  behavioralFlags: jsonb("behavioral_flags"),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [
  index("idx_ai_decisions_patient_id").on(t.patientId),
  index("idx_ai_decisions_patient_created").on(t.patientId, t.createdAt),
  index("idx_ai_decisions_urgency").on(t.urgency),
]);

export type AiDecision = typeof aiDecisionsTable.$inferSelect;
