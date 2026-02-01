import type { MiddlewareHandler } from 'hono';
import { ApiError } from '../utils/api-error.js';

interface RateLimitConfig {
  windowMs: number; // time window in milliseconds
  maxRequests: number; // max requests per window
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store for rate limit tracking
const store = new Map<string, RateLimitEntry>();

// Cleanup interval to prevent memory leaks (runs every minute)
const CLEANUP_INTERVAL_MS = 60_000;

let cleanupIntervalId: ReturnType<typeof setInterval> | null = null;

function startCleanup(): void {
  if (cleanupIntervalId) return;

  cleanupIntervalId = setInterval(() => {
    const now = Date.now();
    store.forEach((entry, key) => {
      if (entry.resetAt <= now) {
        store.delete(key);
      }
    });
  }, CLEANUP_INTERVAL_MS);

  // Don't prevent Node from exiting
  if (cleanupIntervalId.unref) {
    cleanupIntervalId.unref();
  }
}

/**
 * Creates a rate limiting middleware with the given configuration
 */
function createRateLimiter(
  config: RateLimitConfig,
  keyExtractor: (c: Parameters<MiddlewareHandler>[0]) => string
): MiddlewareHandler {
  // Ensure cleanup is running
  startCleanup();

  return async function rateLimiter(c, next) {
    const key = keyExtractor(c);
    const now = Date.now();

    let entry = store.get(key);

    // Reset if window has expired
    if (!entry || entry.resetAt <= now) {
      entry = {
        count: 0,
        resetAt: now + config.windowMs,
      };
    }

    entry.count++;
    store.set(key, entry);

    const remaining = Math.max(0, config.maxRequests - entry.count);
    const resetAtSeconds = Math.ceil(entry.resetAt / 1000);

    // Set rate limit headers
    c.header('X-RateLimit-Limit', config.maxRequests.toString());
    c.header('X-RateLimit-Remaining', remaining.toString());
    c.header('X-RateLimit-Reset', resetAtSeconds.toString());

    // Check if rate limit exceeded
    if (entry.count > config.maxRequests) {
      throw ApiError.rateLimited('Too many requests, please try again later');
    }

    return next();
  };
}

/**
 * Get client IP from request
 */
function getClientIp(c: Parameters<MiddlewareHandler>[0]): string {
  // Check common proxy headers
  const forwarded = c.req.header('X-Forwarded-For');
  if (forwarded) {
    // X-Forwarded-For can contain multiple IPs, the first is the client
    const firstIp = forwarded.split(',')[0];
    if (firstIp) {
      return firstIp.trim();
    }
  }

  const realIp = c.req.header('X-Real-IP');
  if (realIp) {
    return realIp;
  }

  // Fall back to connection info (may not be available in all environments)
  return 'unknown';
}

/**
 * Rate limiter for authentication endpoints
 * 10 requests per minute per IP
 */
export function createAuthRateLimiter(): MiddlewareHandler {
  return createRateLimiter(
    { windowMs: 60_000, maxRequests: 10 },
    (c) => `auth:${getClientIp(c)}`
  );
}

/**
 * Rate limiter for SDK endpoints
 * 1000 requests per minute per SDK key
 */
export function createSdkRateLimiter(): MiddlewareHandler {
  return createRateLimiter({ windowMs: 60_000, maxRequests: 1000 }, (c) => {
    // Extract SDK key from Authorization header
    const authHeader = c.req.header('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      return `sdk:${authHeader.slice(7)}`;
    }
    // Fall back to IP if no SDK key
    return `sdk:ip:${getClientIp(c)}`;
  });
}

/**
 * Rate limiter for general API endpoints
 * 100 requests per minute per IP
 */
export function createGeneralRateLimiter(): MiddlewareHandler {
  return createRateLimiter(
    { windowMs: 60_000, maxRequests: 100 },
    (c) => `general:${getClientIp(c)}`
  );
}
