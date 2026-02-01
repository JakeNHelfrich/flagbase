import type { MiddlewareHandler } from 'hono';
import { ApiError } from '../utils/api-error.js';

// HTTP methods that are considered safe and don't need CSRF protection
const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

/**
 * CSRF protection middleware
 * - Skips validation for safe methods (GET, HEAD, OPTIONS)
 * - For state-changing methods: validates Origin or Referer header against allowed origins
 * - Returns 403 with CSRF_VALIDATION_FAILED error code for failures
 */
export function createCsrfProtection(allowedOrigins: string[]): MiddlewareHandler {
  // Normalize allowed origins to lowercase for comparison
  const normalizedOrigins = new Set(allowedOrigins.map((origin) => origin.toLowerCase()));

  return async function csrfProtection(c, next) {
    const method = c.req.method.toUpperCase();

    // Skip CSRF validation for safe methods
    if (SAFE_METHODS.includes(method)) {
      return next();
    }

    // Get Origin header first, fall back to Referer
    const origin = c.req.header('Origin');
    const referer = c.req.header('Referer');

    let requestOrigin: string | null = null;

    if (origin) {
      requestOrigin = origin.toLowerCase();
    } else if (referer) {
      // Extract origin from Referer URL
      try {
        const refererUrl = new URL(referer);
        requestOrigin = refererUrl.origin.toLowerCase();
      } catch {
        // Invalid Referer URL
        throw ApiError.csrfFailed('Invalid Referer header');
      }
    }

    // No origin information provided
    if (!requestOrigin) {
      throw ApiError.csrfFailed('Missing Origin or Referer header');
    }

    // Validate against allowed origins
    if (!normalizedOrigins.has(requestOrigin)) {
      throw ApiError.csrfFailed('Origin not allowed');
    }

    return next();
  };
}
