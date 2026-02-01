import { eq, count } from 'drizzle-orm';
import { type Database, projects } from '@flagbase/database';
import { ok, err, type Result, type Project, ErrorCode, type PaginationParams, type PaginationMeta } from '@flagbase/types';
import type { ProjectRepository } from '../interfaces/project-repository.js';

type ProjectsTable = typeof projects;

export class PostgresProjectRepository implements ProjectRepository {
  constructor(
    private readonly db: Database,
    private readonly table: ProjectsTable
  ) {}

  async findById(id: string): Promise<Result<Project | null, ErrorCode>> {
    try {
      const result = await this.db.select().from(this.table).where(eq(this.table.id, id)).limit(1);
      const project = result[0];
      return ok(project ? this.mapToEntity(project) : null);
    } catch (error) {
      console.error('Error finding project by id:', error);
      return err(ErrorCode.DATABASE_ERROR);
    }
  }

  async findByKey(key: string): Promise<Result<Project | null, ErrorCode>> {
    try {
      const result = await this.db.select().from(this.table).where(eq(this.table.key, key)).limit(1);
      const project = result[0];
      return ok(project ? this.mapToEntity(project) : null);
    } catch (error) {
      console.error('Error finding project by key:', error);
      return err(ErrorCode.DATABASE_ERROR);
    }
  }

  async findAll(pagination: Required<PaginationParams>): Promise<Result<{ data: Project[]; meta: PaginationMeta }, ErrorCode>> {
    try {
      const offset = (pagination.page - 1) * pagination.limit;

      const [projectList, totalResult] = await Promise.all([
        this.db.select().from(this.table).limit(pagination.limit).offset(offset),
        this.db.select({ count: count() }).from(this.table),
      ]);

      const total = totalResult[0]?.count ?? 0;

      return ok({
        data: projectList.map((p: typeof this.table.$inferSelect) => this.mapToEntity(p)),
        meta: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages: Math.ceil(total / pagination.limit),
        },
      });
    } catch (error) {
      console.error('Error finding all projects:', error);
      return err(ErrorCode.DATABASE_ERROR);
    }
  }

  async create(data: { key: string; name: string; description?: string | null }): Promise<Result<Project, ErrorCode>> {
    try {
      const result = await this.db
        .insert(this.table)
        .values({
          key: data.key,
          name: data.name,
          description: data.description ?? null,
        })
        .returning();

      const project = result[0];
      if (!project) {
        return err(ErrorCode.DATABASE_ERROR);
      }

      return ok(this.mapToEntity(project));
    } catch (error: unknown) {
      console.error('Error creating project:', error);
      if (error instanceof Error && error.message.includes('unique')) {
        return err(ErrorCode.PROJECT_KEY_EXISTS);
      }
      return err(ErrorCode.DATABASE_ERROR);
    }
  }

  async update(id: string, data: { name?: string; description?: string | null }): Promise<Result<Project, ErrorCode>> {
    try {
      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (data.name !== undefined) updateData['name'] = data.name;
      if (data.description !== undefined) updateData['description'] = data.description;

      const result = await this.db
        .update(this.table)
        .set(updateData)
        .where(eq(this.table.id, id))
        .returning();

      const project = result[0];
      if (!project) {
        return err(ErrorCode.PROJECT_NOT_FOUND);
      }

      return ok(this.mapToEntity(project));
    } catch (error) {
      console.error('Error updating project:', error);
      return err(ErrorCode.DATABASE_ERROR);
    }
  }

  async delete(id: string): Promise<Result<void, ErrorCode>> {
    try {
      const result = await this.db.delete(this.table).where(eq(this.table.id, id)).returning();

      if (result.length === 0) {
        return err(ErrorCode.PROJECT_NOT_FOUND);
      }

      return ok(undefined);
    } catch (error) {
      console.error('Error deleting project:', error);
      return err(ErrorCode.DATABASE_ERROR);
    }
  }

  private mapToEntity(row: typeof this.table.$inferSelect): Project {
    return {
      id: row.id,
      key: row.key,
      name: row.name,
      description: row.description,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
