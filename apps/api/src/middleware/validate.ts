import { zValidator } from '@hono/zod-validator';
import type { z } from 'zod';
import { ApiError } from '../utils/api-error.js';
import { ErrorCode } from '@flagbase/types';

type Target = 'json' | 'query' | 'param';

export function validate<T extends z.ZodType>(target: Target, schema: T) {
  return zValidator(target, schema, (result, c) => {
    if (!result.success) {
      const details = result.error.flatten();
      throw ApiError.badRequest(ErrorCode.VALIDATION_ERROR, 'Validation failed', {
        fieldErrors: details.fieldErrors,
        formErrors: details.formErrors,
      });
    }
  });
}
