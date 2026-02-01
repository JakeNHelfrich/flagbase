import { Hono } from 'hono';
import type { Container } from './container.js';
import { createCorsMiddleware } from './middleware/cors.js';
import { createRequestLogger } from './middleware/request-logger.js';
import { createErrorHandler } from './middleware/error-handler.js';
import { createSecurityHeaders, createCsrfProtection } from './middleware/index.js';
import { createV1Routes } from './routes/v1/index.js';
import { config } from './config/index.js';

export function createApp(container: Container) {
  const app = new Hono();
  const { logger } = container;

  // Global middleware - order matters: security headers → CORS → CSRF → logger
  const allowedOrigins =
    config.NODE_ENV === 'development'
      ? ['http://localhost:5173', 'http://127.0.0.1:5173']
      : ['http://localhost:3000'];

  app.use('*', createSecurityHeaders());
  app.use('*', createCorsMiddleware());
  app.use('*', createCsrfProtection(allowedOrigins));
  app.use('*', createRequestLogger(logger));

  // Health check endpoint
  app.get('/health', (c) => {
    return c.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API v1 routes
  app.route('/api/v1', createV1Routes(container));

  // Error handler
  app.onError(createErrorHandler(logger));

  // 404 handler
  app.notFound((c) => {
    return c.json({ code: 'NOT_FOUND', message: 'Route not found' }, 404);
  });

  return app;
}
