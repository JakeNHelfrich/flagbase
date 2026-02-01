import type { MiddlewareHandler } from 'hono';
import { ApiError } from '../utils/api-error.js';

/**
 * Middleware to verify user has access to the specified project
 * Currently allows access to all authenticated users
 */
export function requireProjectAccess(): MiddlewareHandler {
  return async (c, next) => {
    // Verify user is authenticated (set by requireAuth middleware)
    const user = c.get('user');

    if (!user) {
      throw ApiError.unauthorized('Authentication required');
    }

    // For now, all authenticated users can access all projects
    // TODO: Implement role-based project access control
    return next();
  };
}
