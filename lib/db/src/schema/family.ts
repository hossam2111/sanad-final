import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { patientsTable } from "./patients";

export const familyRelationshipsTable = pgTable("family_relationships", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patientsTable.id, { onDelete: "cascade" }),
  relativeId: integer("relative_id").notNull().references(() => patientsTable.id, { onDelete: "cascade" }),
  relationshipType: text("relationship_type").notNull(), // Parent | Sibling | Child
  createdAt: timestamp("created_at").defaultNow(),
});
