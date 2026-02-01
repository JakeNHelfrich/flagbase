import { eq, and, count } from 'drizzle-orm';
import { type Database, flags } from '@flagbase/database';
import { ok, err, type Result, type Flag, type FlagType, type FlagValue, ErrorCode, type PaginationParams, type PaginationMeta } from '@flagbase/types';
import type { FlagRepository } from '../interfaces/flag-repository.js';

type FlagsTable = typeof flags;

export class PostgresFlagRepository implements FlagRepository {
  constructor(
    private readonly db: Database,
    private readonly table: FlagsTable
  ) {}

  async findById(id: string): Promise<Result<Flag | null, ErrorCode>> {
    try {
      const result = await this.db.select().from(this.table).where(eq(this.table.id, id)).limit(1);
      const flag = result[0];
      return ok(flag ? this.mapToEntity(flag) : null);
    } catch (error) {
      console.error('Error finding flag by id:', error);
      return err(ErrorCode.DATABASE_ERROR);
    }
  }

  async findByProjectIdAndKey(projectId: string, key: string): Promise<Result<Flag | null, ErrorCode>> {
    try {
      const result = await this.db
        .select()
        .from(this.table)
        .where(and(eq(this.table.projectId, projectId), eq(this.table.key, key)))
        .limit(1);
      const flag = result[0];
      return ok(flag ? this.mapToEntity(flag) : null);
    } catch (error) {
      console.error('Error finding flag by project and key:', error);
      return err(ErrorCode.DATABASE_ERROR);
    }
  }

  async findAllByProjectId(projectId: string, pagination: Required<PaginationParams>): Promise<Result<{ data: Flag[]; meta: PaginationMeta }, ErrorCode>> {
    try {
      const offset = (pagination.page - 1) * pagination.limit;

      const [flagList, totalResult] = await Promise.all([
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
        data: flagList.map((f: typeof this.table.$inferSelect) => this.mapToEntity(f)),
        meta: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages: Math.ceil(total / pagination.limit),
        },
      });
    } catch (error) {
      console.error('Error finding flags by project:', error);
      return err(ErrorCode.DATABASE_ERROR);
    }
  }

  async create(data: {
    projectId: string;
    key: string;
    name: string;
    description?: string | null;
    type: FlagType;
    defaultValue: FlagValue;
  }): Promise<Result<Flag, ErrorCode>> {
    try {
      const result = await this.db
        .insert(this.table)
        .values({
          projectId: data.projectId,
          key: data.key,
          name: data.name,
          description: data.description ?? null,
          type: data.type,
          defaultValue: data.defaultValue,
        })
        .returning();

      const flag = result[0];
      if (!flag) {
        return err(ErrorCode.DATABASE_ERROR);
      }

      return ok(this.mapToEntity(flag));
    } catch (error: unknown) {
      console.error('Error creating flag:', error);
      if (error instanceof Error && error.message.includes('unique')) {
        return err(ErrorCode.FLAG_KEY_EXISTS);
      }
      return err(ErrorCode.DATABASE_ERROR);
    }
  }

  async update(id: string, data: {
    name?: string;
    description?: string | null;
    defaultValue?: FlagValue;
  }): Promise<Result<Flag, ErrorCode>> {
    try {
      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (data.name !== undefined) updateData['name'] = data.name;
      if (data.description !== undefined) updateData['description'] = data.description;
      if (data.defaultValue !== undefined) updateData['defaultValue'] = data.defaultValue;

      const result = await this.db
        .update(this.table)
        .set(updateData)
        .where(eq(this.table.id, id))
        .returning();

      const flag = result[0];
      if (!flag) {
        return err(ErrorCode.FLAG_NOT_FOUND);
      }

      return ok(this.mapToEntity(flag));
    } catch (error) {
      console.error('Error updating flag:', error);
      return err(ErrorCode.DATABASE_ERROR);
    }
  }

  async delete(id: string): Promise<Result<void, ErrorCode>> {
    try {
      const result = await this.db.delete(this.table).where(eq(this.table.id, id)).returning();

      if (result.length === 0) {
        return err(ErrorCode.FLAG_NOT_FOUND);
      }

      return ok(undefined);
    } catch (error) {
      console.error('Error deleting flag:', error);
      return err(ErrorCode.DATABASE_ERROR);
    }
  }

  private mapToEntity(row: typeof this.table.$inferSelect): Flag {
    return {
      id: row.id,
      projectId: row.projectId,
      key: row.key,
      name: row.name,
      description: row.description,
      type: row.type as FlagType,
      defaultValue: row.defaultValue as FlagValue,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
