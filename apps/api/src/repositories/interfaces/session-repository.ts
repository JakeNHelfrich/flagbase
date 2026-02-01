import type { Result, ErrorCode, Session } from '@flagbase/types';

export interface SessionRepository {
  findById(id: string): Promise<Result<Session | null, ErrorCode>>;
  create(data: { id: string; userId: string; expiresAt: Date }): Promise<Result<Session, ErrorCode>>;
  delete(id: string): Promise<Result<void, ErrorCode>>;
  deleteByUserId(userId: string): Promise<Result<void, ErrorCode>>;
}
