import type { MiddlewareHandler } from 'hono';
import { isProduction } from '../config/index.js';

/**
 * Middleware that adds security headers to all responses
 */
export function createSecurityHeaders(): MiddlewareHandler {
  return async function securityHeaders(c, next) {
    await next();

    // Prevent MIME type sniffing
    c.header('X-Content-Type-Options', 'nosniff');

    // Prevent clickjacking by denying framing
    c.header('X-Frame-Options', 'DENY');

    // Enable XSS filter in browsers (legacy but still useful)
    c.header('X-XSS-Protection', '1; mode=block');

    // Control referrer information sent with requests
    c.header('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Enable HSTS in production only
    if (isProduction()) {
      c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
  };
}
