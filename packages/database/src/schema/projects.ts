import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { environments } from "./environments";
import { flags } from "./flags";
import { sdkKeys } from "./sdk-keys";

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: varchar("key", { length: 64 }).unique().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const projectsRelations = relations(projects, ({ many }) => ({
  environments: many(environments),
  flags: many(flags),
  sdkKeys: many(sdkKeys),
}));

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
