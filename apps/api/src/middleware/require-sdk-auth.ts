import type { MiddlewareHandler } from 'hono';
import type { SDKKeyService } from '../services/sdk-key-service.js';
import { ApiError } from '../utils/api-error.js';

declare module 'hono' {
  interface ContextVariableMap {
    sdkKeyInfo: {
      projectId: string;
      environmentId: string;
      keyId: string;
    };
  }
}

export function createRequireSdkAuth(sdkKeyService: SDKKeyService): MiddlewareHandler {
  return async (c, next) => {
    const sdkKey = c.req.param('sdkKey');

    if (!sdkKey) {
      throw ApiError.unauthorized('SDK key is required');
    }

    const result = await sdkKeyService.verifyKey(sdkKey);

    if (!result.ok) {
      throw ApiError.unauthorized('Invalid SDK key');
    }

    if (!result.value) {
      throw ApiError.unauthorized('Invalid SDK key');
    }

    // Check if key is revoked
    if (result.value.revokedAt !== null) {
      throw ApiError.unauthorized('SDK key has been revoked');
    }

    // Set SDK key info on context
    c.set('sdkKeyInfo', {
      projectId: result.value.projectId,
      environmentId: result.value.environmentId,
      keyId: result.value.id,
    });

    return next();
  };
}
