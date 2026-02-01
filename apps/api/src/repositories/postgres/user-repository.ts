import { eq } from 'drizzle-orm';
import { type Database, users } from '@flagbase/database';
import { ok, err, type Result, type User, ErrorCode } from '@flagbase/types';
import type { UserRepository } from '../interfaces/user-repository.js';

type UsersTable = typeof users;

export class PostgresUserRepository implements UserRepository {
  constructor(
    private readonly db: Database,
    private readonly table: UsersTable
  ) {}

  async findById(id: string): Promise<Result<Omit<User, 'passwordHash'> | null, ErrorCode>> {
    try {
      const result = await this.db.select().from(this.table).where(eq(this.table.id, id)).limit(1);
      const user = result[0];
      return ok(user ? this.mapToEntityWithoutPassword(user) : null);
    } catch (error) {
      console.error('Error finding user by id:', error);
      return err(ErrorCode.DATABASE_ERROR);
    }
  }

  async findByEmail(email: string): Promise<Result<User | null, ErrorCode>> {
    try {
      const result = await this.db.select().from(this.table).where(eq(this.table.email, email)).limit(1);
      const user = result[0];
      return ok(user ? this.mapToEntity(user) : null);
    } catch (error) {
      console.error('Error finding user by email:', error);
      return err(ErrorCode.DATABASE_ERROR);
    }
  }

  async create(data: { email: string; name: string; passwordHash: string }): Promise<Result<Omit<User, 'passwordHash'>, ErrorCode>> {
    try {
      const result = await this.db
        .insert(this.table)
        .values({
          email: data.email,
          name: data.name,
          passwordHash: data.passwordHash,
        })
        .returning();

      const user = result[0];
      if (!user) {
        return err(ErrorCode.DATABASE_ERROR);
      }

      return ok(this.mapToEntityWithoutPassword(user));
    } catch (error: unknown) {
      console.error('Error creating user:', error);
      if (error instanceof Error && error.message.includes('unique')) {
        return err(ErrorCode.EMAIL_EXISTS);
      }
      return err(ErrorCode.DATABASE_ERROR);
    }
  }

  private mapToEntity(row: typeof this.table.$inferSelect): User {
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      passwordHash: row.passwordHash,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private mapToEntityWithoutPassword(row: typeof this.table.$inferSelect): Omit<User, 'passwordHash'> {
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
