import { Hono } from 'hono';
import type { Container } from '../../container.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/require-auth.js';
import { requireProjectAccess } from '../../middleware/require-project-access.js';
import { ApiError } from '../../utils/api-error.js';
import { ErrorCode } from '@flagbase/types';
import {
  paginationSchema,
  createEnvironmentSchema,
  updateEnvironmentSchema,
} from '../../schemas/index.js';

export function createEnvironmentRoutes(container: Container) {
  const app = new Hono();
  const { environmentService, projectService, authService } = container;

  // List environments for a project
  app.get(
    '/',
    requireAuth(authService),
    requireProjectAccess(),
    validate('query', paginationSchema),
    async (c) => {
      const projectId = c.req.param('projectId');
      if (!projectId) {
        throw ApiError.badRequest(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      const { page, limit } = c.req.valid('query');

      // Check if project exists
      const projectResult = await projectService.getById(projectId);
      if (!projectResult.ok || !projectResult.value) {
        throw ApiError.notFound(ErrorCode.PROJECT_NOT_FOUND, 'Project not found');
      }

      const result = await environmentService.listByProjectId(projectId, page, limit);
      if (!result.ok) {
        throw ApiError.internal('Failed to fetch environments');
      }

      return c.json({
        data: result.value.data,
        pagination: result.value.meta,
      });
    }
  );

  // Create an environment
  app.post(
    '/',
    requireAuth(authService),
    requireProjectAccess(),
    validate('json', createEnvironmentSchema),
    async (c) => {
      const projectId = c.req.param('projectId');
      if (!projectId) {
        throw ApiError.badRequest(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      const body = c.req.valid('json');

      // Check if project exists
      const projectResult = await projectService.getById(projectId);
      if (!projectResult.ok || !projectResult.value) {
        throw ApiError.notFound(ErrorCode.PROJECT_NOT_FOUND, 'Project not found');
      }

      const createData: { projectId: string; key: string; name: string; description?: string } = {
        projectId,
        key: body.key,
        name: body.name,
      };
      if (body.description !== undefined) {
        createData.description = body.description;
      }

      const result = await environmentService.create(createData);

      if (!result.ok) {
        if (result.error === ErrorCode.VALIDATION_ERROR) {
          throw ApiError.conflict(ErrorCode.VALIDATION_ERROR, 'An environment with this key already exists in this project');
        }
        throw ApiError.internal('Failed to create environment');
      }

      return c.json(result.value, 201);
    }
  );

  // Update an environment
  app.patch(
    '/:envId',
    requireAuth(authService),
    requireProjectAccess(),
    validate('json', updateEnvironmentSchema),
    async (c) => {
      const projectId = c.req.param('projectId');
      const envId = c.req.param('envId');

      if (!projectId || !envId) {
        throw ApiError.badRequest(ErrorCode.VALIDATION_ERROR, 'Project ID and Environment ID are required');
      }

      const body = c.req.valid('json');

      // Check if environment exists and belongs to project
      const existingResult = await environmentService.getById(envId);
      if (!existingResult.ok || !existingResult.value) {
        throw ApiError.notFound(ErrorCode.ENVIRONMENT_NOT_FOUND, 'Environment not found');
      }

      if (existingResult.value.projectId !== projectId) {
        throw ApiError.notFound(ErrorCode.ENVIRONMENT_NOT_FOUND, 'Environment not found in this project');
      }

      const updateData: { name?: string; description?: string | null } = {};
      if (body.name !== undefined) {
        updateData.name = body.name;
      }
      if (body.description !== undefined) {
        updateData.description = body.description;
      }

      const result = await environmentService.update(envId, updateData);
      if (!result.ok) {
        throw ApiError.internal('Failed to update environment');
      }

      return c.json(result.value);
    }
  );

  // Delete an environment
  app.delete(
    '/:envId',
    requireAuth(authService),
    requireProjectAccess(),
    async (c) => {
      const projectId = c.req.param('projectId');
      const envId = c.req.param('envId');

      if (!projectId || !envId) {
        throw ApiError.badRequest(ErrorCode.VALIDATION_ERROR, 'Project ID and Environment ID are required');
      }

      // Check if environment exists and belongs to project
      const existingResult = await environmentService.getById(envId);
      if (!existingResult.ok || !existingResult.value) {
        throw ApiError.notFound(ErrorCode.ENVIRONMENT_NOT_FOUND, 'Environment not found');
      }

      if (existingResult.value.projectId !== projectId) {
        throw ApiError.notFound(ErrorCode.ENVIRONMENT_NOT_FOUND, 'Environment not found in this project');
      }

      const result = await environmentService.delete(envId);
      if (!result.ok) {
        if (result.error === ErrorCode.ENVIRONMENT_NOT_FOUND) {
          throw ApiError.notFound(ErrorCode.ENVIRONMENT_NOT_FOUND, 'Environment not found');
        }
        throw ApiError.internal('Failed to delete environment');
      }

      return c.body(null, 204);
    }
  );

  return app;
}
