import { pgTable, text, integer, timestamp, index } from "drizzle-orm/pg-core";

export const aiRetrainJobsTable = pgTable("ai_retrain_jobs", {
  id: text("id").primaryKey(),
  engine: text("engine").notNull(),
  status: text("status", { enum: ["queued", "running", "completed", "failed"] }).notNull().default("queued"),
  progress: integer("progress").default(0),
  triggeredBy: text("triggered_by"),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [
  index("idx_retrain_jobs_engine").on(t.engine),
  index("idx_retrain_jobs_status").on(t.status),
  index("idx_retrain_jobs_created").on(t.createdAt),
]);

export type AiRetrainJob = typeof aiRetrainJobsTable.$inferSelect;
