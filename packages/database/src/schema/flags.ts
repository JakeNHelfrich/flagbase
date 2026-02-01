import { pgTable, uuid, varchar, text, timestamp, jsonb, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { projects } from "./projects";
import { flagEnvironmentConfigs } from "./flag-environment-configs";

export const flags = pgTable(
  "flags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    key: varchar("key", { length: 64 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    type: varchar("type", { length: 20 }).notNull(), // 'boolean', 'string', 'number', 'json'
    defaultValue: jsonb("default_value").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [unique("flags_project_key_unique").on(table.projectId, table.key)]
);

export const flagsRelations = relations(flags, ({ one, many }) => ({
  project: one(projects, {
    fields: [flags.projectId],
    references: [projects.id],
  }),
  environmentConfigs: many(flagEnvironmentConfigs),
}));

export type Flag = typeof flags.$inferSelect;
export type NewFlag = typeof flags.$inferInsert;
