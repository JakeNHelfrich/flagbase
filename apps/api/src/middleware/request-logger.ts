import type { MiddlewareHandler } from 'hono';
import type { Logger } from 'pino';

export function createRequestLogger(logger: Logger): MiddlewareHandler {
  return async (c, next) => {
    const start = Date.now();
    const method = c.req.method;
    const path = c.req.path;

    logger.info({ method, path }, 'Incoming request');

    await next();

    const duration = Date.now() - start;
    const status = c.res.status;

    logger.info({ method, path, status, duration }, 'Request completed');
  };
}
