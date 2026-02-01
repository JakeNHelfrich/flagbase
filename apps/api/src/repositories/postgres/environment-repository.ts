import { eq, and, count } from 'drizzle-orm';
import { type Database, environments } from '@flagbase/database';
import { ok, err, type Result, type Environment, ErrorCode, type PaginationParams, type PaginationMeta } from '@flagbase/types';
import type { EnvironmentRepository } from '../interfaces/environment-repository.js';

type EnvironmentsTable = typeof environments;

export class PostgresEnvironmentRepository implements EnvironmentRepository {
  constructor(
    private readonly db: Database,
    private readonly table: EnvironmentsTable
  ) {}

  async findById(id: string): Promise<Result<Environment | null, ErrorCode>> {
    try {
      const result = await this.db.select().from(this.table).where(eq(this.table.id, id)).limit(1);
      const environment = result[0];
      return ok(environment ? this.mapToEntity(environment) : null);
    } catch (error) {
      console.error('Error finding environment by id:', error);
      return err(ErrorCode.DATABASE_ERROR);
    }
  }

  async findByProjectIdAndKey(projectId: string, key: string): Promise<Result<Environment | null, ErrorCode>> {
    try {
      const result = await this.db
        .select()
        .from(this.table)
        .where(and(eq(this.table.projectId, projectId), eq(this.table.key, key)))
        .limit(1);
      const environment = result[0];
      return ok(environment ? this.mapToEntity(environment) : null);
    } catch (error) {
      console.error('Error finding environment by project and key:', error);
      return err(ErrorCode.DATABASE_ERROR);
    }
  }

  async findAllByProjectId(projectId: string, pagination: Required<PaginationParams>): Promise<Result<{ data: Environment[]; meta: PaginationMeta }, ErrorCode>> {
    try {
      const offset = (pagination.page - 1) * pagination.limit;

      const [environmentList, totalResult] = await Promise.all([
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
        data: environmentList.map((e: typeof this.table.$inferSelect) => this.mapToEntity(e)),
        meta: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages: Math.ceil(total / pagination.limit),
        },
      });
    } catch (error) {
      console.error('Error finding environments by project:', error);
      return err(ErrorCode.DATABASE_ERROR);
    }
  }

  async create(data: { projectId: string; key: string; name: string; description?: string | null }): Promise<Result<Environment, ErrorCode>> {
    try {
      const result = await this.db
        .insert(this.table)
        .values({
          projectId: data.projectId,
          key: data.key,
          name: data.name,
          description: data.description ?? null,
        })
        .returning();

      const environment = result[0];
      if (!environment) {
        return err(ErrorCode.DATABASE_ERROR);
      }

      return ok(this.mapToEntity(environment));
    } catch (error: unknown) {
      console.error('Error creating environment:', error);
      if (error instanceof Error && error.message.includes('unique')) {
        return err(ErrorCode.VALIDATION_ERROR);
      }
      return err(ErrorCode.DATABASE_ERROR);
    }
  }

  async update(id: string, data: { name?: string; description?: string | null }): Promise<Result<Environment, ErrorCode>> {
    try {
      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (data.name !== undefined) updateData['name'] = data.name;
      if (data.description !== undefined) updateData['description'] = data.description;

      const result = await this.db
        .update(this.table)
        .set(updateData)
        .where(eq(this.table.id, id))
        .returning();

      const environment = result[0];
      if (!environment) {
        return err(ErrorCode.ENVIRONMENT_NOT_FOUND);
      }

      return ok(this.mapToEntity(environment));
    } catch (error) {
      console.error('Error updating environment:', error);
      return err(ErrorCode.DATABASE_ERROR);
    }
  }

  async delete(id: string): Promise<Result<void, ErrorCode>> {
    try {
      const result = await this.db.delete(this.table).where(eq(this.table.id, id)).returning();

      if (result.length === 0) {
        return err(ErrorCode.ENVIRONMENT_NOT_FOUND);
      }

      return ok(undefined);
    } catch (error) {
      console.error('Error deleting environment:', error);
      return err(ErrorCode.DATABASE_ERROR);
    }
  }

  private mapToEntity(row: typeof this.table.$inferSelect): Environment {
    return {
      id: row.id,
      projectId: row.projectId,
      key: row.key,
      name: row.name,
      description: row.description,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
