import type { ProjectRepository } from '../repositories/interfaces/project-repository.js';
import type { Result, Project, ErrorCode, PaginationMeta } from '@flagbase/types';

export class ProjectService {
  constructor(private readonly projectRepo: ProjectRepository) {}

  async getById(id: string): Promise<Result<Project | null, ErrorCode>> {
    return this.projectRepo.findById(id);
  }

  async getByKey(key: string): Promise<Result<Project | null, ErrorCode>> {
    return this.projectRepo.findByKey(key);
  }

  async list(page: number, limit: number): Promise<Result<{ data: Project[]; meta: PaginationMeta }, ErrorCode>> {
    return this.projectRepo.findAll({ page, limit });
  }

  async create(data: { key: string; name: string; description?: string }): Promise<Result<Project, ErrorCode>> {
    return this.projectRepo.create(data);
  }

  async update(id: string, data: { name?: string; description?: string | null }): Promise<Result<Project, ErrorCode>> {
    return this.projectRepo.update(id, data);
  }

  async delete(id: string): Promise<Result<void, ErrorCode>> {
    return this.projectRepo.delete(id);
  }
}
