import type { MiddlewareHandler } from 'hono';
import { getCookie } from 'hono/cookie';
import type { User } from '@flagbase/types';
import type { AuthService } from '../services/auth-service.js';
import { ApiError } from '../utils/api-error.js';

declare module 'hono' {
  interface ContextVariableMap {
    user: Omit<User, 'passwordHash'>;
  }
}

export function requireAuth(authService: AuthService): MiddlewareHandler {
  return async (c, next) => {
    const sessionId = getCookie(c, 'session');

    if (!sessionId) {
      throw ApiError.unauthorized('Authentication required');
    }

    const result = await authService.validateSession(sessionId);

    if (!result.ok) {
      throw ApiError.unauthorized('Invalid or expired session');
    }

    if (!result.value) {
      throw ApiError.unauthorized('Invalid or expired session');
    }

    c.set('user', result.value);
    return next();
  };
}
