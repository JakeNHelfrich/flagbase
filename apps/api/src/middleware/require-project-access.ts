import type { MiddlewareHandler } from 'hono';
import { isDevelopment } from '../config/index.js';

/**
 * Middleware to verify user has access to the specified project
 * Currently a stub that allows all access in development
 */
export function requireProjectAccess(): MiddlewareHandler {
  return async (c, next) => {
    if (isDevelopment()) {
      // In development, allow all project access
      return next();
    }

    // TODO: Implement actual project access verification
    // - Check if the user has been granted access to the project
    // - Verify the user's role/permissions for the project
    return next();
  };
}
