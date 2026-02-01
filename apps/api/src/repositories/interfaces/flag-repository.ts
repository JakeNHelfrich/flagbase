import type { Result, Flag, FlagType, FlagValue, ErrorCode, PaginationParams, PaginationMeta } from '@flagbase/types';

export interface FlagRepository {
  findById(id: string): Promise<Result<Flag | null, ErrorCode>>;
  findByProjectIdAndKey(projectId: string, key: string): Promise<Result<Flag | null, ErrorCode>>;
  findAllByProjectId(projectId: string, pagination: Required<PaginationParams>): Promise<Result<{ data: Flag[]; meta: PaginationMeta }, ErrorCode>>;
  create(data: {
    projectId: string;
    key: string;
    name: string;
    description?: string | null;
    type: FlagType;
    defaultValue: FlagValue;
  }): Promise<Result<Flag, ErrorCode>>;
  update(id: string, data: {
    name?: string;
    description?: string | null;
    defaultValue?: FlagValue;
  }): Promise<Result<Flag, ErrorCode>>;
  delete(id: string): Promise<Result<void, ErrorCode>>;
}
