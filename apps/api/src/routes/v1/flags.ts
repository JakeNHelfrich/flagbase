import { Hono } from 'hono';
import type { Container } from '../../container.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/require-auth.js';
import { requireProjectAccess } from '../../middleware/require-project-access.js';
import { ApiError } from '../../utils/api-error.js';
import { ErrorCode, type FlagType, type FlagValue, type TargetingRule } from '@flagbase/types';
import {
  paginationSchema,
  createFlagSchema,
  updateFlagSchema,
  updateFlagConfigSchema,
} from '../../schemas/index.js';

export function createFlagRoutes(container: Container) {
  const app = new Hono();
  const { flagService, projectService, environmentService } = container;

  // List flags for a project
  app.get(
    '/',
    requireAuth(),
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

      const result = await flagService.listByProjectId(projectId, page, limit);
      if (!result.ok) {
        throw ApiError.internal('Failed to fetch flags');
      }

      return c.json({
        data: result.value.data,
        pagination: result.value.meta,
      });
    }
  );

  // Create a flag
  app.post(
    '/',
    requireAuth(),
    requireProjectAccess(),
    validate('json', createFlagSchema),
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

      const createData: {
        projectId: string;
        key: string;
        name: string;
        description?: string;
        type: FlagType;
        defaultValue: FlagValue;
      } = {
        projectId,
        key: body.key,
        name: body.name,
        type: body.type as FlagType,
        defaultValue: body.defaultValue as FlagValue,
      };
      if (body.description !== undefined) {
        createData.description = body.description;
      }

      const result = await flagService.create(createData);

      if (!result.ok) {
        if (result.error === ErrorCode.FLAG_KEY_EXISTS) {
          throw ApiError.conflict(ErrorCode.FLAG_KEY_EXISTS, 'A flag with this key already exists in this project');
        }
        throw ApiError.internal('Failed to create flag');
      }

      return c.json(result.value, 201);
    }
  );

  // Get a single flag
  app.get(
    '/:flagId',
    requireAuth(),
    requireProjectAccess(),
    async (c) => {
      const projectId = c.req.param('projectId');
      const flagId = c.req.param('flagId');

      if (!projectId || !flagId) {
        throw ApiError.badRequest(ErrorCode.VALIDATION_ERROR, 'Project ID and Flag ID are required');
      }

      const result = await flagService.getById(flagId);
      if (!result.ok) {
        throw ApiError.internal('Failed to fetch flag');
      }

      if (!result.value) {
        throw ApiError.notFound(ErrorCode.FLAG_NOT_FOUND, 'Flag not found');
      }

      if (result.value.projectId !== projectId) {
        throw ApiError.notFound(ErrorCode.FLAG_NOT_FOUND, 'Flag not found in this project');
      }

      return c.json(result.value);
    }
  );

  // Update a flag
  app.patch(
    '/:flagId',
    requireAuth(),
    requireProjectAccess(),
    validate('json', updateFlagSchema),
    async (c) => {
      const projectId = c.req.param('projectId');
      const flagId = c.req.param('flagId');

      if (!projectId || !flagId) {
        throw ApiError.badRequest(ErrorCode.VALIDATION_ERROR, 'Project ID and Flag ID are required');
      }

      const body = c.req.valid('json');

      // Check if flag exists and belongs to project
      const existingResult = await flagService.getById(flagId);
      if (!existingResult.ok || !existingResult.value) {
        throw ApiError.notFound(ErrorCode.FLAG_NOT_FOUND, 'Flag not found');
      }

      if (existingResult.value.projectId !== projectId) {
        throw ApiError.notFound(ErrorCode.FLAG_NOT_FOUND, 'Flag not found in this project');
      }

      const updateData: { name?: string; description?: string | null; defaultValue?: FlagValue } = {};
      if (body.name !== undefined) {
        updateData.name = body.name;
      }
      if (body.description !== undefined) {
        updateData.description = body.description;
      }
      if (body.defaultValue !== undefined) {
        updateData.defaultValue = body.defaultValue as FlagValue;
      }

      const result = await flagService.update(flagId, updateData);

      if (!result.ok) {
        throw ApiError.internal('Failed to update flag');
      }

      return c.json(result.value);
    }
  );

  // Delete a flag
  app.delete(
    '/:flagId',
    requireAuth(),
    requireProjectAccess(),
    async (c) => {
      const projectId = c.req.param('projectId');
      const flagId = c.req.param('flagId');

      if (!projectId || !flagId) {
        throw ApiError.badRequest(ErrorCode.VALIDATION_ERROR, 'Project ID and Flag ID are required');
      }

      // Check if flag exists and belongs to project
      const existingResult = await flagService.getById(flagId);
      if (!existingResult.ok || !existingResult.value) {
        throw ApiError.notFound(ErrorCode.FLAG_NOT_FOUND, 'Flag not found');
      }

      if (existingResult.value.projectId !== projectId) {
        throw ApiError.notFound(ErrorCode.FLAG_NOT_FOUND, 'Flag not found in this project');
      }

      const result = await flagService.delete(flagId);
      if (!result.ok) {
        if (result.error === ErrorCode.FLAG_NOT_FOUND) {
          throw ApiError.notFound(ErrorCode.FLAG_NOT_FOUND, 'Flag not found');
        }
        throw ApiError.internal('Failed to delete flag');
      }

      return c.body(null, 204);
    }
  );

  // Update flag environment config
  app.patch(
    '/:flagId/environments/:envId',
    requireAuth(),
    requireProjectAccess(),
    validate('json', updateFlagConfigSchema),
    async (c) => {
      const projectId = c.req.param('projectId');
      const flagId = c.req.param('flagId');
      const envId = c.req.param('envId');

      if (!projectId || !flagId || !envId) {
        throw ApiError.badRequest(ErrorCode.VALIDATION_ERROR, 'Project ID, Flag ID, and Environment ID are required');
      }

      const body = c.req.valid('json');

      // Check if flag exists and belongs to project
      const flagResult = await flagService.getById(flagId);
      if (!flagResult.ok || !flagResult.value) {
        throw ApiError.notFound(ErrorCode.FLAG_NOT_FOUND, 'Flag not found');
      }

      if (flagResult.value.projectId !== projectId) {
        throw ApiError.notFound(ErrorCode.FLAG_NOT_FOUND, 'Flag not found in this project');
      }

      // Check if environment exists and belongs to project
      const envResult = await environmentService.getById(envId);
      if (!envResult.ok || !envResult.value) {
        throw ApiError.notFound(ErrorCode.ENVIRONMENT_NOT_FOUND, 'Environment not found');
      }

      if (envResult.value.projectId !== projectId) {
        throw ApiError.notFound(ErrorCode.ENVIRONMENT_NOT_FOUND, 'Environment not found in this project');
      }

      // Get the flag config
      const configResult = await flagService.getConfigByFlagAndEnvironment(flagId, envId);
      if (!configResult.ok) {
        throw ApiError.internal('Failed to fetch flag config');
      }

      if (!configResult.value) {
        throw ApiError.notFound(ErrorCode.FLAG_NOT_FOUND, 'Flag environment config not found');
      }

      // Build update data
      const updateData: { enabled?: boolean; value?: FlagValue; targetingRules?: TargetingRule[] } = {};
      if (body.enabled !== undefined) {
        updateData.enabled = body.enabled;
      }
      if (body.value !== undefined) {
        updateData.value = body.value as FlagValue;
      }
      if (body.targetingRules !== undefined) {
        updateData.targetingRules = body.targetingRules as TargetingRule[];
      }

      // Update the config
      const updateResult = await flagService.updateConfig(configResult.value.id, updateData);

      if (!updateResult.ok) {
        throw ApiError.internal('Failed to update flag config');
      }

      return c.json(updateResult.value);
    }
  );

  return app;
}
