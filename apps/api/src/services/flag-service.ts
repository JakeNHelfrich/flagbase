import type { FlagRepository } from '../repositories/interfaces/flag-repository.js';
import type { FlagConfigRepository } from '../repositories/interfaces/flag-config-repository.js';
import type { EnvironmentRepository } from '../repositories/interfaces/environment-repository.js';
import type { Result, Flag, FlagEnvironmentConfig, FlagType, FlagValue, ErrorCode, PaginationMeta } from '@flagbase/types';
import { ok, err } from '@flagbase/types';

export class FlagService {
  constructor(
    private readonly flagRepo: FlagRepository,
    private readonly flagConfigRepo: FlagConfigRepository,
    private readonly environmentRepo: EnvironmentRepository
  ) {}

  async getById(id: string): Promise<Result<Flag | null, ErrorCode>> {
    return this.flagRepo.findById(id);
  }

  async getByProjectIdAndKey(projectId: string, key: string): Promise<Result<Flag | null, ErrorCode>> {
    return this.flagRepo.findByProjectIdAndKey(projectId, key);
  }

  async listByProjectId(projectId: string, page: number, limit: number): Promise<Result<{ data: Flag[]; meta: PaginationMeta }, ErrorCode>> {
    return this.flagRepo.findAllByProjectId(projectId, { page, limit });
  }

  async create(data: {
    projectId: string;
    key: string;
    name: string;
    description?: string;
    type: FlagType;
    defaultValue: FlagValue;
  }): Promise<Result<Flag, ErrorCode>> {
    // Create the flag
    const flagResult = await this.flagRepo.create(data);
    if (!flagResult.ok) {
      return flagResult;
    }

    const flag = flagResult.value;

    // Get all environments for the project
    const environmentsResult = await this.environmentRepo.findAllByProjectId(data.projectId, { page: 1, limit: 10000 });
    if (!environmentsResult.ok) {
      console.error('Failed to fetch environments for flag setup:', environmentsResult.error);
      return ok(flag);
    }

    // Create flag configs for each environment
    const environmentIds = environmentsResult.value.data.map((e) => e.id);
    await this.flagConfigRepo.createManyForFlag(flag.id, environmentIds, data.defaultValue);

    return ok(flag);
  }

  async update(id: string, data: {
    name?: string;
    description?: string | null;
    defaultValue?: FlagValue;
  }): Promise<Result<Flag, ErrorCode>> {
    return this.flagRepo.update(id, data);
  }

  async delete(id: string): Promise<Result<void, ErrorCode>> {
    return this.flagRepo.delete(id);
  }

  async getConfigByFlagAndEnvironment(flagId: string, environmentId: string): Promise<Result<FlagEnvironmentConfig | null, ErrorCode>> {
    return this.flagConfigRepo.findByFlagIdAndEnvironmentId(flagId, environmentId);
  }

  async updateConfig(configId: string, data: {
    enabled?: boolean;
    value?: FlagValue;
    targetingRules?: import('@flagbase/types').TargetingRule[];
  }): Promise<Result<FlagEnvironmentConfig, ErrorCode>> {
    return this.flagConfigRepo.update(configId, data);
  }

  async getConfigsByFlagId(flagId: string): Promise<Result<FlagEnvironmentConfig[], ErrorCode>> {
    return this.flagConfigRepo.findAllByFlagId(flagId);
  }
}
