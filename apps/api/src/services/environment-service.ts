import type { EnvironmentRepository } from '../repositories/interfaces/environment-repository.js';
import type { FlagRepository } from '../repositories/interfaces/flag-repository.js';
import type { FlagConfigRepository } from '../repositories/interfaces/flag-config-repository.js';
import type { Result, Environment, ErrorCode, PaginationMeta } from '@flagbase/types';
import { ok, err } from '@flagbase/types';

export class EnvironmentService {
  constructor(
    private readonly environmentRepo: EnvironmentRepository,
    private readonly flagRepo: FlagRepository,
    private readonly flagConfigRepo: FlagConfigRepository
  ) {}

  async getById(id: string): Promise<Result<Environment | null, ErrorCode>> {
    return this.environmentRepo.findById(id);
  }

  async getByProjectIdAndKey(projectId: string, key: string): Promise<Result<Environment | null, ErrorCode>> {
    return this.environmentRepo.findByProjectIdAndKey(projectId, key);
  }

  async listByProjectId(projectId: string, page: number, limit: number): Promise<Result<{ data: Environment[]; meta: PaginationMeta }, ErrorCode>> {
    return this.environmentRepo.findAllByProjectId(projectId, { page, limit });
  }

  async create(data: { projectId: string; key: string; name: string; description?: string }): Promise<Result<Environment, ErrorCode>> {
    // Create the environment
    const environmentResult = await this.environmentRepo.create(data);
    if (!environmentResult.ok) {
      return environmentResult;
    }

    const environment = environmentResult.value;

    // Get all flags for the project and create configs for this new environment
    const flagsResult = await this.flagRepo.findAllByProjectId(data.projectId, { page: 1, limit: 10000 });
    if (!flagsResult.ok) {
      // Environment was created, but we couldn't create flag configs
      // Log and continue - configs can be created later
      console.error('Failed to fetch flags for environment setup:', flagsResult.error);
      return ok(environment);
    }

    // Create flag configs for each flag
    for (const flag of flagsResult.value.data) {
      await this.flagConfigRepo.create({
        flagId: flag.id,
        environmentId: environment.id,
        enabled: false,
        value: flag.defaultValue,
        targetingRules: [],
      });
    }

    return ok(environment);
  }

  async update(id: string, data: { name?: string; description?: string | null }): Promise<Result<Environment, ErrorCode>> {
    return this.environmentRepo.update(id, data);
  }

  async delete(id: string): Promise<Result<void, ErrorCode>> {
    return this.environmentRepo.delete(id);
  }
}
