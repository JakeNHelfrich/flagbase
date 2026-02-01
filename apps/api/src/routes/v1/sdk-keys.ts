import { Hono } from 'hono';
import type { Container } from '../../container.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/require-auth.js';
import { requireProjectAccess } from '../../middleware/require-project-access.js';
import { ApiError } from '../../utils/api-error.js';
import { ErrorCode, type SDKKeyType } from '@flagbase/types';
import {
  paginationSchema,
  createSDKKeySchema,
  sdkKeyIdParamSchema,
} from '../../schemas/index.js';

export function createSDKKeyRoutes(container: Container) {
  const app = new Hono();
  const { sdkKeyService, projectService, environmentService, authService } = container;

  // Create an SDK key for an environment
  // POST /api/v1/projects/:projectId/environments/:envId/sdk-keys
  app.post(
    '/projects/:projectId/environments/:envId/sdk-keys',
    requireAuth(authService),
    requireProjectAccess(),
    validate('json', createSDKKeySchema),
    async (c) => {
      const projectId = c.req.param('projectId');
      const envId = c.req.param('envId');

      if (!projectId || !envId) {
        throw ApiError.badRequest(ErrorCode.VALIDATION_ERROR, 'Project ID and Environment ID are required');
      }

      const body = c.req.valid('json');

      // Check if project exists
      const projectResult = await projectService.getById(projectId);
      if (!projectResult.ok || !projectResult.value) {
        throw ApiError.notFound(ErrorCode.PROJECT_NOT_FOUND, 'Project not found');
      }

      // Check if environment exists and belongs to project
      const envResult = await environmentService.getById(envId);
      if (!envResult.ok || !envResult.value) {
        throw ApiError.notFound(ErrorCode.ENVIRONMENT_NOT_FOUND, 'Environment not found');
      }

      if (envResult.value.projectId !== projectId) {
        throw ApiError.notFound(ErrorCode.ENVIRONMENT_NOT_FOUND, 'Environment not found in this project');
      }

      const result = await sdkKeyService.create({
        projectId,
        environmentId: envId,
        name: body.name,
        type: body.type as SDKKeyType,
      });

      if (!result.ok) {
        throw ApiError.internal('Failed to create SDK key');
      }

      return c.json(result.value, 201);
    }
  );

  // List SDK keys for a project
  // GET /api/v1/projects/:projectId/sdk-keys
  app.get(
    '/projects/:projectId/sdk-keys',
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

      const result = await sdkKeyService.listByProjectId(projectId, page, limit);
      if (!result.ok) {
        throw ApiError.internal('Failed to fetch SDK keys');
      }

      return c.json({
        data: result.value.data,
        pagination: result.value.meta,
      });
    }
  );

  // Delete an SDK key
  // DELETE /api/v1/sdk-keys/:keyId
  app.delete(
    '/sdk-keys/:keyId',
    requireAuth(authService),
    validate('param', sdkKeyIdParamSchema),
    async (c) => {
      const { keyId } = c.req.valid('param');

      const result = await sdkKeyService.delete(keyId);
      if (!result.ok) {
        if (result.error === ErrorCode.SDK_KEY_NOT_FOUND) {
          throw ApiError.notFound(ErrorCode.SDK_KEY_NOT_FOUND, 'SDK key not found');
        }
        throw ApiError.internal('Failed to delete SDK key');
      }

      return c.body(null, 204);
    }
  );

  return app;
}
