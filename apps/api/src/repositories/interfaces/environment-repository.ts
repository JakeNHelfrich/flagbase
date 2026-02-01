import type { Result, Environment, ErrorCode, PaginationParams, PaginationMeta } from '@flagbase/types';

export interface EnvironmentRepository {
  findById(id: string): Promise<Result<Environment | null, ErrorCode>>;
  findByProjectIdAndKey(projectId: string, key: string): Promise<Result<Environment | null, ErrorCode>>;
  findAllByProjectId(projectId: string, pagination: Required<PaginationParams>): Promise<Result<{ data: Environment[]; meta: PaginationMeta }, ErrorCode>>;
  create(data: { projectId: string; key: string; name: string; description?: string | null }): Promise<Result<Environment, ErrorCode>>;
  update(id: string, data: { name?: string; description?: string | null }): Promise<Result<Environment, ErrorCode>>;
  delete(id: string): Promise<Result<void, ErrorCode>>;
}
