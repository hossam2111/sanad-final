import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Generic key-value store for runtime-configurable system settings.
 * Used by the AI Brain configuration (provider, model, encrypted API key)
 * so the admin can swap the platform's AI model without redeploying.
 */
export const systemSettingsTable = pgTable("system_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedBy: text("updated_by"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type SystemSetting = typeof systemSettingsTable.$inferSelect;
