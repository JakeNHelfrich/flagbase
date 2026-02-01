import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { setCookie, getCookie, deleteCookie } from 'hono/cookie';
import type { Container } from '../../container.js';
import { registerSchema, loginSchema } from '../../schemas/auth.js';
import { ApiError } from '../../utils/api-error.js';
import { ErrorCode } from '@flagbase/types';

const COOKIE_NAME = 'session';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

export function createAuthRoutes(container: Container) {
  const app = new Hono();
  const { authService } = container;

  // Register a new account
  app.post(
    '/register',
    zValidator('json', registerSchema),
    async (c) => {
      const { email, password, name } = c.req.valid('json');

      const result = await authService.register(email, password, name);
      if (!result.ok) {
        if (result.error === ErrorCode.EMAIL_EXISTS) {
          throw ApiError.conflict(ErrorCode.EMAIL_EXISTS, 'Registration failed');
        }
        throw ApiError.internal('Registration failed');
      }

      return c.json(result.value, 201);
    }
  );

  // Login
  app.post(
    '/login',
    zValidator('json', loginSchema),
    async (c) => {
      const { email, password } = c.req.valid('json');

      const result = await authService.login(email, password);
      if (!result.ok) {
        if (result.error === ErrorCode.INVALID_CREDENTIALS) {
          throw ApiError.unauthorized('Invalid credentials');
        }
        throw ApiError.internal('Login failed');
      }

      const { user, session } = result.value;

      setCookie(c, COOKIE_NAME, session.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
        path: '/',
        maxAge: COOKIE_MAX_AGE,
      });

      return c.json(user);
    }
  );

  // Logout
  app.post('/logout', async (c) => {
    const sessionId = getCookie(c, COOKIE_NAME);

    if (sessionId) {
      await authService.logout(sessionId);
    }

    deleteCookie(c, COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      path: '/',
    });

    return c.json({ message: 'Logged out' });
  });

  // Get current user
  app.get('/me', async (c) => {
    const sessionId = getCookie(c, COOKIE_NAME);

    if (!sessionId) {
      throw ApiError.unauthorized('Not authenticated');
    }

    const result = await authService.validateSession(sessionId);
    if (!result.ok) {
      throw ApiError.internal('Failed to validate session');
    }

    if (!result.value) {
      throw ApiError.unauthorized('Not authenticated');
    }

    return c.json(result.value);
  });

  return app;
}
