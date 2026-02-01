import type { Result, ErrorCode, User } from '@flagbase/types';

export interface UserRepository {
  findById(id: string): Promise<Result<Omit<User, 'passwordHash'> | null, ErrorCode>>;
  findByEmail(email: string): Promise<Result<User | null, ErrorCode>>;
  create(data: { email: string; name: string; passwordHash: string }): Promise<Result<Omit<User, 'passwordHash'>, ErrorCode>>;
}
