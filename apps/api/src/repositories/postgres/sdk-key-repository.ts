import { eq, count } from 'drizzle-orm';
import { type Database, sdkKeys } from '@flagbase/database';
import { ok, err, type Result, type SDKKey, type SDKKeyType, ErrorCode, type PaginationParams, type PaginationMeta } from '@flagbase/types';
import type { SDKKeyRepository } from '../interfaces/sdk-key-repository.js';

type SDKKeysTable = typeof sdkKeys;

export class PostgresSDKKeyRepository implements SDKKeyRepository {
  constructor(
    private readonly db: Database,
    private readonly table: SDKKeysTable
  ) {}

  async findById(id: string): Promise<Result<SDKKey | null, ErrorCode>> {
    try {
      const result = await this.db.select().from(this.table).where(eq(this.table.id, id)).limit(1);
      const sdkKey = result[0];
      return ok(sdkKey ? this.mapToEntity(sdkKey) : null);
    } catch (error) {
      console.error('Error finding SDK key by id:', error);
      return err(ErrorCode.DATABASE_ERROR);
    }
  }

  async findByKeyHash(keyHash: string): Promise<Result<SDKKey | null, ErrorCode>> {
    try {
      const result = await this.db.select().from(this.table).where(eq(this.table.keyHash, keyHash)).limit(1);
      const sdkKey = result[0];
      return ok(sdkKey ? this.mapToEntity(sdkKey) : null);
    } catch (error) {
      console.error('Error finding SDK key by hash:', error);
      return err(ErrorCode.DATABASE_ERROR);
    }
  }

  async findAllByProjectId(projectId: string, pagination: Required<PaginationParams>): Promise<Result<{ data: SDKKey[]; meta: PaginationMeta }, ErrorCode>> {
    try {
      const offset = (pagination.page - 1) * pagination.limit;

      const [keys, totalResult] = await Promise.all([
        this.db
          .select()
          .from(this.table)
          .where(eq(this.table.projectId, projectId))
          .limit(pagination.limit)
          .offset(offset),
        this.db
          .select({ count: count() })
          .from(this.table)
          .where(eq(this.table.projectId, projectId)),
      ]);

      const total = totalResult[0]?.count ?? 0;

      return ok({
        data: keys.map((k: typeof this.table.$inferSelect) => this.mapToEntity(k)),
        meta: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages: Math.ceil(total / pagination.limit),
        },
      });
    } catch (error) {
      console.error('Error finding SDK keys by project:', error);
      return err(ErrorCode.DATABASE_ERROR);
    }
  }

  async findAllByEnvironmentId(environmentId: string): Promise<Result<SDKKey[], ErrorCode>> {
    try {
      const keys = await this.db
        .select()
        .from(this.table)
        .where(eq(this.table.environmentId, environmentId));
      return ok(keys.map((k: typeof this.table.$inferSelect) => this.mapToEntity(k)));
    } catch (error) {
      console.error('Error finding SDK keys by environment:', error);
      return err(ErrorCode.DATABASE_ERROR);
    }
  }

  async create(data: {
    projectId: string;
    environmentId: string;
    name: string;
    keyHash: string;
    keyPrefix: string;
    type: SDKKeyType;
  }): Promise<Result<SDKKey, ErrorCode>> {
    try {
      const result = await this.db
        .insert(this.table)
        .values({
          projectId: data.projectId,
          environmentId: data.environmentId,
          name: data.name,
          keyHash: data.keyHash,
          keyPrefix: data.keyPrefix,
          type: data.type,
        })
        .returning();

      const sdkKey = result[0];
      if (!sdkKey) {
        return err(ErrorCode.DATABASE_ERROR);
      }

      return ok(this.mapToEntity(sdkKey));
    } catch (error) {
      console.error('Error creating SDK key:', error);
      return err(ErrorCode.DATABASE_ERROR);
    }
  }

  async revoke(id: string): Promise<Result<SDKKey, ErrorCode>> {
    try {
      const result = await this.db
        .update(this.table)
        .set({ revokedAt: new Date() })
        .where(eq(this.table.id, id))
        .returning();

      const sdkKey = result[0];
      if (!sdkKey) {
        return err(ErrorCode.SDK_KEY_NOT_FOUND);
      }

      return ok(this.mapToEntity(sdkKey));
    } catch (error) {
      console.error('Error revoking SDK key:', error);
      return err(ErrorCode.DATABASE_ERROR);
    }
  }

  async delete(id: string): Promise<Result<void, ErrorCode>> {
    try {
      const result = await this.db.delete(this.table).where(eq(this.table.id, id)).returning();

      if (result.length === 0) {
        return err(ErrorCode.SDK_KEY_NOT_FOUND);
      }

      return ok(undefined);
    } catch (error) {
      console.error('Error deleting SDK key:', error);
      return err(ErrorCode.DATABASE_ERROR);
    }
  }

  private mapToEntity(row: typeof this.table.$inferSelect): SDKKey {
    return {
      id: row.id,
      projectId: row.projectId,
      environmentId: row.environmentId,
      name: row.name,
      keyHash: row.keyHash,
      keyPrefix: row.keyPrefix,
      type: row.type as SDKKeyType,
      createdAt: row.createdAt,
      revokedAt: row.revokedAt,
    };
  }
}
