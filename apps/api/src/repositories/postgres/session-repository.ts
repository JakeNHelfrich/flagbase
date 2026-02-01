import { eq } from 'drizzle-orm';
import { type Database, sessions } from '@flagbase/database';
import { ok, err, type Result, type Session, ErrorCode } from '@flagbase/types';
import type { SessionRepository } from '../interfaces/session-repository.js';

type SessionsTable = typeof sessions;

export class PostgresSessionRepository implements SessionRepository {
  constructor(
    private readonly db: Database,
    private readonly table: SessionsTable
  ) {}

  async findById(id: string): Promise<Result<Session | null, ErrorCode>> {
    try {
      const result = await this.db.select().from(this.table).where(eq(this.table.id, id)).limit(1);
      const session = result[0];
      return ok(session ? this.mapToEntity(session) : null);
    } catch (error) {
      console.error('Error finding session by id:', error);
      return err(ErrorCode.DATABASE_ERROR);
    }
  }

  async create(data: { id: string; userId: string; expiresAt: Date }): Promise<Result<Session, ErrorCode>> {
    try {
      const result = await this.db
        .insert(this.table)
        .values({
          id: data.id,
          userId: data.userId,
          expiresAt: data.expiresAt,
        })
        .returning();

      const session = result[0];
      if (!session) {
        return err(ErrorCode.DATABASE_ERROR);
      }

      return ok(this.mapToEntity(session));
    } catch (error) {
      console.error('Error creating session:', error);
      return err(ErrorCode.DATABASE_ERROR);
    }
  }

  async delete(id: string): Promise<Result<void, ErrorCode>> {
    try {
      await this.db.delete(this.table).where(eq(this.table.id, id));
      return ok(undefined);
    } catch (error) {
      console.error('Error deleting session:', error);
      return err(ErrorCode.DATABASE_ERROR);
    }
  }

  async deleteByUserId(userId: string): Promise<Result<void, ErrorCode>> {
    try {
      await this.db.delete(this.table).where(eq(this.table.userId, userId));
      return ok(undefined);
    } catch (error) {
      console.error('Error deleting sessions by user id:', error);
      return err(ErrorCode.DATABASE_ERROR);
    }
  }

  private mapToEntity(row: typeof this.table.$inferSelect): Session {
    return {
      id: row.id,
      userId: row.userId,
      expiresAt: row.expiresAt,
      createdAt: row.createdAt,
    };
  }
}
