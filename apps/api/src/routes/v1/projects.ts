import { Hono } from 'hono';
import type { Container } from '../../container.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/require-auth.js';
import { requireProjectAccess } from '../../middleware/require-project-access.js';
import { ApiError } from '../../utils/api-error.js';
import { ErrorCode } from '@flagbase/types';
import {
  paginationSchema,
  createProjectSchema,
  updateProjectSchema,
  projectIdParamSchema,
} from '../../schemas/index.js';

export function createProjectRoutes(container: Container) {
  const app = new Hono();
  const { projectService } = container;

  // List all projects
  app.get(
    '/',
    requireAuth(),
    validate('query', paginationSchema),
    async (c) => {
      const { page, limit } = c.req.valid('query');

      const result = await projectService.list(page, limit);
      if (!result.ok) {
        throw ApiError.internal('Failed to fetch projects');
      }

      return c.json({
        data: result.value.data,
        pagination: result.value.meta,
      });
    }
  );

  // Create a new project
  app.post(
    '/',
    requireAuth(),
    validate('json', createProjectSchema),
    async (c) => {
      const body = c.req.valid('json');

      const createData: { key: string; name: string; description?: string } = {
        key: body.key,
        name: body.name,
      };
      if (body.description !== undefined) {
        createData.description = body.description;
      }

      const result = await projectService.create(createData);
      if (!result.ok) {
        if (result.error === ErrorCode.PROJECT_KEY_EXISTS) {
          throw ApiError.conflict(ErrorCode.PROJECT_KEY_EXISTS, 'A project with this key already exists');
        }
        throw ApiError.internal('Failed to create project');
      }

      return c.json(result.value, 201);
    }
  );

  // Get a single project
  app.get(
    '/:projectId',
    requireAuth(),
    requireProjectAccess(),
    validate('param', projectIdParamSchema),
    async (c) => {
      const { projectId } = c.req.valid('param');

      const result = await projectService.getById(projectId);
      if (!result.ok) {
        throw ApiError.internal('Failed to fetch project');
      }

      if (!result.value) {
        throw ApiError.notFound(ErrorCode.PROJECT_NOT_FOUND, 'Project not found');
      }

      return c.json(result.value);
    }
  );

  // Update a project
  app.patch(
    '/:projectId',
    requireAuth(),
    requireProjectAccess(),
    validate('param', projectIdParamSchema),
    validate('json', updateProjectSchema),
    async (c) => {
      const { projectId } = c.req.valid('param');
      const body = c.req.valid('json');

      // Check if project exists
      const existingResult = await projectService.getById(projectId);
      if (!existingResult.ok) {
        throw ApiError.internal('Failed to fetch project');
      }
      if (!existingResult.value) {
        throw ApiError.notFound(ErrorCode.PROJECT_NOT_FOUND, 'Project not found');
      }

      const updateData: { name?: string; description?: string | null } = {};
      if (body.name !== undefined) {
        updateData.name = body.name;
      }
      if (body.description !== undefined) {
        updateData.description = body.description;
      }

      const result = await projectService.update(projectId, updateData);
      if (!result.ok) {
        throw ApiError.internal('Failed to update project');
      }

      return c.json(result.value);
    }
  );

  // Delete a project
  app.delete(
    '/:projectId',
    requireAuth(),
    requireProjectAccess(),
    validate('param', projectIdParamSchema),
    async (c) => {
      const { projectId } = c.req.valid('param');

      const result = await projectService.delete(projectId);
      if (!result.ok) {
        if (result.error === ErrorCode.PROJECT_NOT_FOUND) {
          throw ApiError.notFound(ErrorCode.PROJECT_NOT_FOUND, 'Project not found');
        }
        throw ApiError.internal('Failed to delete project');
      }

      return c.body(null, 204);
    }
  );

  return app;
}
