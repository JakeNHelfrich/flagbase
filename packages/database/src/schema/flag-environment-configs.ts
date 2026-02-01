import { pgTable, uuid, boolean, timestamp, jsonb, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { flags } from "./flags";
import { environments } from "./environments";

export const flagEnvironmentConfigs = pgTable(
  "flag_environment_configs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    flagId: uuid("flag_id")
      .notNull()
      .references(() => flags.id, { onDelete: "cascade" }),
    environmentId: uuid("environment_id")
      .notNull()
      .references(() => environments.id, { onDelete: "cascade" }),
    enabled: boolean("enabled").default(false).notNull(),
    value: jsonb("value").notNull(),
    targetingRules: jsonb("targeting_rules").default([]).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [unique("flag_env_config_unique").on(table.flagId, table.environmentId)]
);

export const flagEnvironmentConfigsRelations = relations(flagEnvironmentConfigs, ({ one }) => ({
  flag: one(flags, {
    fields: [flagEnvironmentConfigs.flagId],
    references: [flags.id],
  }),
  environment: one(environments, {
    fields: [flagEnvironmentConfigs.environmentId],
    references: [environments.id],
  }),
}));

export type FlagEnvironmentConfig = typeof flagEnvironmentConfigs.$inferSelect;
export type NewFlagEnvironmentConfig = typeof flagEnvironmentConfigs.$inferInsert;
