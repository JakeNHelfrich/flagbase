import { ErrorCode } from '@flagbase/types';

export class ApiError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details: Record<string, unknown> | undefined;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }

  static badRequest(code: ErrorCode, message: string, details?: Record<string, unknown>): ApiError {
    return new ApiError(code, message, 400, details);
  }

  static unauthorized(message = 'Unauthorized'): ApiError {
    return new ApiError(ErrorCode.UNAUTHORIZED, message, 401);
  }

  static forbidden(message = 'Forbidden'): ApiError {
    return new ApiError(ErrorCode.UNAUTHORIZED, message, 403);
  }

  static notFound(code: ErrorCode, message: string): ApiError {
    return new ApiError(code, message, 404);
  }

  static conflict(code: ErrorCode, message: string): ApiError {
    return new ApiError(code, message, 409);
  }

  static internal(message = 'Internal server error'): ApiError {
    return new ApiError(ErrorCode.INTERNAL_ERROR, message, 500);
  }

  static rateLimited(message = 'Too many requests'): ApiError {
    return new ApiError(ErrorCode.RATE_LIMITED, message, 429);
  }

  static csrfFailed(message = 'CSRF validation failed'): ApiError {
    return new ApiError(ErrorCode.CSRF_VALIDATION_FAILED, message, 403);
  }

  toJSON(): { code: ErrorCode; message: string; details?: Record<string, unknown> } {
    const result: { code: ErrorCode; message: string; details?: Record<string, unknown> } = {
      code: this.code,
      message: this.message,
    };
    if (this.details !== undefined) {
      result.details = this.details;
    }
    return result;
  }
}
