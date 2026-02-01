import type { Context } from 'hono';
import { ApiError } from '../utils/api-error.js';
import { ErrorCode } from '@flagbase/types';
import type { Logger } from 'pino';

export function createErrorHandler(logger: Logger) {
  return function errorHandler(err: Error, c: Context) {
    if (err instanceof ApiError) {
      logger.warn({ err, path: c.req.path }, 'API error');
      return c.json(err.toJSON(), err.statusCode as 400 | 401 | 403 | 404 | 409 | 500);
    }

    logger.error({ err, path: c.req.path }, 'Unhandled error');
    return c.json(
      {
        code: ErrorCode.INTERNAL_ERROR,
        message: 'Internal server error',
      },
      500
    );
  };
}
