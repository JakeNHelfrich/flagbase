import type { Result, Project, ErrorCode, PaginationParams, PaginationMeta } from '@flagbase/types';

export interface ProjectRepository {
  findById(id: string): Promise<Result<Project | null, ErrorCode>>;
  findByKey(key: string): Promise<Result<Project | null, ErrorCode>>;
  findAll(pagination: Required<PaginationParams>): Promise<Result<{ data: Project[]; meta: PaginationMeta }, ErrorCode>>;
  create(data: { key: string; name: string; description?: string | null }): Promise<Result<Project, ErrorCode>>;
  update(id: string, data: { name?: string; description?: string | null }): Promise<Result<Project, ErrorCode>>;
  delete(id: string): Promise<Result<void, ErrorCode>>;
}
