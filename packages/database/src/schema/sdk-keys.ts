import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { projects } from "./projects";
import { environments } from "./environments";

export const sdkKeys = pgTable("sdk_keys", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  environmentId: uuid("environment_id")
    .notNull()
    .references(() => environments.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  keyHash: varchar("key_hash", { length: 255 }).notNull(),
  keyPrefix: varchar("key_prefix", { length: 20 }).notNull(),
  type: varchar("type", { length: 10 }).notNull(), // 'live' or 'test'
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
});

export const sdkKeysRelations = relations(sdkKeys, ({ one }) => ({
  project: one(projects, {
    fields: [sdkKeys.projectId],
    references: [projects.id],
  }),
  environment: one(environments, {
    fields: [sdkKeys.environmentId],
    references: [environments.id],
  }),
}));

export type SdkKey = typeof sdkKeys.$inferSelect;
export type NewSdkKey = typeof sdkKeys.$inferInsert;
