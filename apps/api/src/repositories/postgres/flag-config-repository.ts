import { eq, and } from 'drizzle-orm';
import { type Database, flagEnvironmentConfigs } from '@flagbase/database';
import { ok, err, type Result, type FlagEnvironmentConfig, type FlagValue, type TargetingRule, ErrorCode } from '@flagbase/types';
import type { FlagConfigRepository } from '../interfaces/flag-config-repository.js';

type FlagConfigsTable = typeof flagEnvironmentConfigs;

export class PostgresFlagConfigRepository implements FlagConfigRepository {
  constructor(
    private readonly db: Database,
    private readonly table: FlagConfigsTable
  ) {}

  async findById(id: string): Promise<Result<FlagEnvironmentConfig | null, ErrorCode>> {
    try {
      const result = await this.db.select().from(this.table).where(eq(this.table.id, id)).limit(1);
      const config = result[0];
      return ok(config ? this.mapToEntity(config) : null);
    } catch (error) {
      console.error('Error finding flag config by id:', error);
      return err(ErrorCode.DATABASE_ERROR);
    }
  }

  async findByFlagIdAndEnvironmentId(flagId: string, environmentId: string): Promise<Result<FlagEnvironmentConfig | null, ErrorCode>> {
    try {
      const result = await this.db
        .select()
        .from(this.table)
        .where(and(eq(this.table.flagId, flagId), eq(this.table.environmentId, environmentId)))
        .limit(1);
      const config = result[0];
      return ok(config ? this.mapToEntity(config) : null);
    } catch (error) {
      console.error('Error finding flag config by flag and environment:', error);
      return err(ErrorCode.DATABASE_ERROR);
    }
  }

  async findAllByFlagId(flagId: string): Promise<Result<FlagEnvironmentConfig[], ErrorCode>> {
    try {
      const configs = await this.db.select().from(this.table).where(eq(this.table.flagId, flagId));
      return ok(configs.map((c: typeof this.table.$inferSelect) => this.mapToEntity(c)));
    } catch (error) {
      console.error('Error finding flag configs by flag:', error);
      return err(ErrorCode.DATABASE_ERROR);
    }
  }

  async create(data: {
    flagId: string;
    environmentId: string;
    enabled?: boolean;
    value: FlagValue;
    targetingRules?: TargetingRule[];
  }): Promise<Result<FlagEnvironmentConfig, ErrorCode>> {
    try {
      const result = await this.db
        .insert(this.table)
        .values({
          flagId: data.flagId,
          environmentId: data.environmentId,
          enabled: data.enabled ?? false,
          value: data.value,
          targetingRules: data.targetingRules ?? [],
        })
        .returning();

      const config = result[0];
      if (!config) {
        return err(ErrorCode.DATABASE_ERROR);
      }

      return ok(this.mapToEntity(config));
    } catch (error) {
      console.error('Error creating flag config:', error);
      return err(ErrorCode.DATABASE_ERROR);
    }
  }

  async update(id: string, data: {
    enabled?: boolean;
    value?: FlagValue;
    targetingRules?: TargetingRule[];
  }): Promise<Result<FlagEnvironmentConfig, ErrorCode>> {
    try {
      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (data.enabled !== undefined) updateData['enabled'] = data.enabled;
      if (data.value !== undefined) updateData['value'] = data.value;
      if (data.targetingRules !== undefined) updateData['targetingRules'] = data.targetingRules;

      const result = await this.db
        .update(this.table)
        .set(updateData)
        .where(eq(this.table.id, id))
        .returning();

      const config = result[0];
      if (!config) {
        return err(ErrorCode.FLAG_NOT_FOUND);
      }

      return ok(this.mapToEntity(config));
    } catch (error) {
      console.error('Error updating flag config:', error);
      return err(ErrorCode.DATABASE_ERROR);
    }
  }

  async createManyForFlag(flagId: string, environmentIds: string[], defaultValue: FlagValue): Promise<Result<FlagEnvironmentConfig[], ErrorCode>> {
    try {
      if (environmentIds.length === 0) {
        return ok([]);
      }

      const values = environmentIds.map((environmentId) => ({
        flagId,
        environmentId,
        enabled: false,
        value: defaultValue,
        targetingRules: [],
      }));

      const configs = await this.db.insert(this.table).values(values).returning();
      return ok(configs.map((c: typeof this.table.$inferSelect) => this.mapToEntity(c)));
    } catch (error) {
      console.error('Error creating flag configs:', error);
      return err(ErrorCode.DATABASE_ERROR);
    }
  }

  private mapToEntity(row: typeof this.table.$inferSelect): FlagEnvironmentConfig {
    return {
      id: row.id,
      flagId: row.flagId,
      environmentId: row.environmentId,
      enabled: row.enabled,
      value: row.value as FlagValue,
      targetingRules: row.targetingRules as TargetingRule[],
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
