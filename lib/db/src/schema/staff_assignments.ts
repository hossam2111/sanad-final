import { pgTable, serial, varchar, timestamp } from "drizzle-orm/pg-core";

export const staffAssignmentsTable = pgTable("staff_assignments", {
  id:         serial("id").primaryKey(),
  username:   varchar("username", { length: 100 }).notNull(),
  hospitalId: varchar("hospital_id", { length: 20 }).notNull(),
  role:       varchar("role", { length: 50 }).notNull(),
  createdAt:  timestamp("created_at").defaultNow().notNull(),
});
