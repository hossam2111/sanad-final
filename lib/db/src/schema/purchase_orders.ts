import { pgTable, serial, text, integer, real, date, timestamp, index } from "drizzle-orm/pg-core";

export const purchaseOrdersTable = pgTable("purchase_orders", {
  id: text("id").primaryKey(),
  drugName: text("drug_name").notNull(),
  quantity: integer("quantity").notNull(),
  supplier: text("supplier").notNull(),
  status: text("status", { enum: ["submitted", "confirmed", "cancelled"] }).notNull().default("submitted"),
  requestedBy: text("requested_by"),
  estimatedDelivery: date("estimated_delivery"),
  totalValue: real("total_value"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [
  index("idx_purchase_orders_status").on(t.status),
  index("idx_purchase_orders_created").on(t.createdAt),
]);

export type PurchaseOrder = typeof purchaseOrdersTable.$inferSelect;
