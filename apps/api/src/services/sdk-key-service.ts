import { randomBytes, createHash } from 'node:crypto';
import type { SDKKeyRepository } from '../repositories/interfaces/sdk-key-repository.js';
import type { Result, SDKKey, SDKKeyType, ErrorCode, PaginationMeta } from '@flagbase/types';
import { ok } from '@flagbase/types';

export class SDKKeyService {
  constructor(private readonly sdkKeyRepo: SDKKeyRepository) {}

  async getById(id: string): Promise<Result<SDKKey | null, ErrorCode>> {
    return this.sdkKeyRepo.findById(id);
  }

  async listByProjectId(projectId: string, page: number, limit: number): Promise<Result<{ data: SDKKey[]; meta: PaginationMeta }, ErrorCode>> {
    return this.sdkKeyRepo.findAllByProjectId(projectId, { page, limit });
  }

  async listByEnvironmentId(environmentId: string): Promise<Result<SDKKey[], ErrorCode>> {
    return this.sdkKeyRepo.findAllByEnvironmentId(environmentId);
  }

  async create(data: {
    projectId: string;
    environmentId: string;
    name: string;
    type: SDKKeyType;
  }): Promise<Result<{ sdkKey: SDKKey; key: string }, ErrorCode>> {
    // Generate a random key
    const keyBytes = randomBytes(32);
    const key = `fb_${data.type}_${keyBytes.toString('base64url')}`;

    // Create a hash of the key for storage
    const keyHash = createHash('sha256').update(key).digest('hex');

    // Store the prefix for display (e.g., "fb_live_abc...")
    const keyPrefix = key.substring(0, 15) + '...';

    const result = await this.sdkKeyRepo.create({
      projectId: data.projectId,
      environmentId: data.environmentId,
      name: data.name,
      keyHash,
      keyPrefix,
      type: data.type,
    });

    if (!result.ok) {
      return result;
    }

    return ok({
      sdkKey: result.value,
      key, // Return the full key only on creation
    });
  }

  async revoke(id: string): Promise<Result<SDKKey, ErrorCode>> {
    return this.sdkKeyRepo.revoke(id);
  }

  async delete(id: string): Promise<Result<void, ErrorCode>> {
    return this.sdkKeyRepo.delete(id);
  }

  async verifyKey(key: string): Promise<Result<SDKKey | null, ErrorCode>> {
    const keyHash = createHash('sha256').update(key).digest('hex');
    return this.sdkKeyRepo.findByKeyHash(keyHash);
  }
}
