import { pgTable, varchar, timestamp } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id:           varchar("id", { length: 36 }).primaryKey(), // UUID string
  nationalId:   varchar("national_id", { length: 20 }).notNull().unique(),
  fullName:     varchar("full_name", { length: 100 }).notNull(),
  role:         varchar("role", { length: 50 }).notNull(), // 'admin', 'doctor', 'lab', 'pharmacy', 'citizen'
  hospitalId:   varchar("hospital_id", { length: 36 }),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  createdAt:    timestamp("created_at").defaultNow().notNull(),
});
