import { pgTable, serial, text, timestamp, index } from "drizzle-orm/pg-core";

export const claimReviewsTable = pgTable("claim_reviews", {
  id: serial("id").primaryKey(),
  claimId: text("claim_id").notNull().unique(),
  status: text("status", { enum: ["approved", "rejected", "under_review"] }).notNull(),
  reviewedBy: text("reviewed_by").notNull(),
  reviewedAt: timestamp("reviewed_at").notNull(),
  notes: text("notes"),
  aiReason: text("ai_reason"),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [
  index("idx_claim_reviews_claim_id").on(t.claimId),
  index("idx_claim_reviews_status").on(t.status),
]);

export type ClaimReview = typeof claimReviewsTable.$inferSelect;
