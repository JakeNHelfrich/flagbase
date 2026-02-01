import type { Result, SDKKey, SDKKeyType, ErrorCode, PaginationParams, PaginationMeta } from '@flagbase/types';

export interface SDKKeyRepository {
  findById(id: string): Promise<Result<SDKKey | null, ErrorCode>>;
  findByKeyHash(keyHash: string): Promise<Result<SDKKey | null, ErrorCode>>;
  findAllByProjectId(projectId: string, pagination: Required<PaginationParams>): Promise<Result<{ data: SDKKey[]; meta: PaginationMeta }, ErrorCode>>;
  findAllByEnvironmentId(environmentId: string): Promise<Result<SDKKey[], ErrorCode>>;
  create(data: {
    projectId: string;
    environmentId: string;
    name: string;
    keyHash: string;
    keyPrefix: string;
    type: SDKKeyType;
  }): Promise<Result<SDKKey, ErrorCode>>;
  revoke(id: string): Promise<Result<SDKKey, ErrorCode>>;
  delete(id: string): Promise<Result<void, ErrorCode>>;
}
