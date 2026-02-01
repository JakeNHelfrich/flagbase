import type { MiddlewareHandler } from 'hono';
import type { User } from '@flagbase/types';
import { isDevelopment } from '../config/index.js';
import { ApiError } from '../utils/api-error.js';

// Dev user for development mode
const DEV_USER: Omit<User, 'passwordHash'> = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'dev@flagbase.local',
  name: 'Development User',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

declare module 'hono' {
  interface ContextVariableMap {
    user: Omit<User, 'passwordHash'>;
  }
}

export function requireAuth(): MiddlewareHandler {
  return async (c, next) => {
    if (isDevelopment()) {
      // In development, use a stub user
      c.set('user', DEV_USER);
      return next();
    }

    // In production, verify the session token
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Missing or invalid authorization header');
    }

    // TODO: Implement actual session verification
    // For now, throw unauthorized in non-dev mode
    throw ApiError.unauthorized('Authentication not implemented for production');
  };
}
