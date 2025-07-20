import { logger } from './logger';

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, unknown>;

  constructor(
    statusCode: number,
    message: string,
    isOperational = true,
    details?: Record<string, unknown>,
    stack = ''
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;

    if (stack) {
      this.stack = stack;
    } else if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    // Log the error
    this.logError();
  }

  private logError() {
    const errorDetails = {
      statusCode: this.statusCode,
      message: this.message,
      isOperational: this.isOperational,
      details: this.details,
      stack: this.stack,
    };

    if (this.statusCode >= 500) {
      logger.error('Server Error:', errorDetails);
    } else if (this.statusCode >= 400) {
      logger.warn('Client Error:', errorDetails);
    } else {
      logger.info('Informational Error:', errorDetails);
    }
  }

  // Common error types
  static badRequest(message: string, details?: Record<string, any>) {
    return new ApiError(400, message, true, details);
  }

  static unauthorized(message = 'Unauthorized', details?: Record<string, any>) {
    return new ApiError(401, message, true, details);
  }

  static forbidden(message = 'Forbidden', details?: Record<string, any>) {
    return new ApiError(403, message, true, details);
  }

  static notFound(message = 'Resource not found', details?: Record<string, any>) {
    return new ApiError(404, message, true, details);
  }

  static conflict(message = 'Conflict occurred', details?: Record<string, any>) {
    return new ApiError(409, message, true, details);
  }

  static validationError(
    message = 'Validation failed',
    errors: Record<string, string[]> = {}
  ) {
    return new ApiError(422, message, true, { errors });
  }

  static tooManyRequests(
    message = 'Too many requests',
    retryAfter?: number,
    details?: Record<string, any>
  ) {
    const responseDetails = {
      ...details,
      ...(retryAfter && { retryAfter }),
    };

    return new ApiError(429, message, true, responseDetails);
  }

  static internalServerError(
    message = 'Internal Server Error',
    isOperational = false,
    details?: Record<string, any>
  ) {
    return new ApiError(500, message, isOperational, details);
  }

  static notImplemented(message = 'Not Implemented', details?: Record<string, any>) {
    return new ApiError(501, message, true, details);
  }

  static serviceUnavailable(
    message = 'Service Unavailable',
    details?: Record<string, any>
  ) {
    return new ApiError(503, message, true, details);
  }

  // Helper to handle promise rejections
  static async handlePromise<T>(
    promise: Promise<T>,
    errorMessage: string,
    statusCode = 500
  ): Promise<T> {
    try {
      return await promise;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(statusCode, errorMessage, false, { originalError: error });
    }
  }

  // Convert any error to ApiError
  static fromError(error: unknown, defaultMessage = 'An error occurred'): ApiError {
    if (error instanceof ApiError) return error;

    if (error instanceof Error) {
      return new ApiError(500, error.message, false, { originalError: error });
    }

    if (typeof error === 'string') {
      return new ApiError(500, error, false);
    }

    return new ApiError(500, defaultMessage, false, { originalError: error });
  }
}

// Export common error types for easier imports
export const Errors = {
  BadRequest: (message: string, details?: Record<string, any>) =>
    ApiError.badRequest(message, details),
  Unauthorized: (message = 'Unauthorized', details?: Record<string, any>) =>
    ApiError.unauthorized(message, details),
  Forbidden: (message = 'Forbidden', details?: Record<string, any>) =>
    ApiError.forbidden(message, details),
  NotFound: (message = 'Resource not found', details?: Record<string, any>) =>
    ApiError.notFound(message, details),
  Conflict: (message = 'Conflict occurred', details?: Record<string, any>) =>
    ApiError.conflict(message, details),
  ValidationError: (message = 'Validation failed', errors: Record<string, string[]>) =>
    ApiError.validationError(message, errors),
  TooManyRequests: (message = 'Too many requests', retryAfter?: number) =>
    ApiError.tooManyRequests(message, retryAfter),
  InternalServerError: (message = 'Internal Server Error', isOperational = false) =>
    ApiError.internalServerError(message, isOperational),
  NotImplemented: (message = 'Not Implemented') =>
    ApiError.notImplemented(message),
  ServiceUnavailable: (message = 'Service Unavailable') =>
    ApiError.serviceUnavailable(message),
};
