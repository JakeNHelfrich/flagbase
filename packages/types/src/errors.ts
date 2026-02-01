/**
 * Error codes used throughout the Flagbase service
 */
export enum ErrorCode {
  // Auth errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  SESSION_EXPIRED = 'SESSION_EXPIRED',

  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_FLAG_KEY = 'INVALID_FLAG_KEY',
  INVALID_PROJECT_KEY = 'INVALID_PROJECT_KEY',

  // Not found errors
  FLAG_NOT_FOUND = 'FLAG_NOT_FOUND',
  PROJECT_NOT_FOUND = 'PROJECT_NOT_FOUND',
  ENVIRONMENT_NOT_FOUND = 'ENVIRONMENT_NOT_FOUND',
  SDK_KEY_NOT_FOUND = 'SDK_KEY_NOT_FOUND',

  // Conflict errors
  FLAG_KEY_EXISTS = 'FLAG_KEY_EXISTS',
  PROJECT_KEY_EXISTS = 'PROJECT_KEY_EXISTS',
  EMAIL_EXISTS = 'EMAIL_EXISTS',

  // SDK errors
  INVALID_SDK_KEY = 'INVALID_SDK_KEY',
  SDK_KEY_REVOKED = 'SDK_KEY_REVOKED',

  // Security errors
  RATE_LIMITED = 'RATE_LIMITED',
  CSRF_VALIDATION_FAILED = 'CSRF_VALIDATION_FAILED',

  // Internal errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
}

/**
 * Standard error response structure
 */
export interface ErrorResponse {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
}
