import { Request, Response, NextFunction } from 'express';
import { rateLimiter, RateLimits } from '../services/rate-limiter.service';
import { logger } from '../utils/logger';

/**
 * Rate limiter middleware factory
 * @param key Unique identifier for the rate limit
 * @param config Rate limit configuration
 * @param identifierFn Function to extract the identifier from the request (defaults to IP)
 */
export function rateLimit(
  key: string,
  config: {
    points: number;
    duration: number;
    blockDuration?: number;
  },
  identifierFn: (req: Request) => string = (req) => {
    // Default to IP address
    const forwarded = req.headers['x-forwarded-for'];
    const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded || 
               req.socket.remoteAddress || '').toString();
    return ip;
  }
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const identifier = identifierFn(req);
      const { headers } = await rateLimiter.limit(key, identifier, config);

      // Add rate limit headers to the response
      Object.entries(headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });

      next();
    } catch (error: any) {
      if (error.status === 429) {
        // Rate limit exceeded
        res.setHeader('Retry-After', error.retryAfter);
        return res.status(429).json({
          status: 'error',
          message: 'Too many requests, please try again later.',
          retryAfter: error.retryAfter,
        });
      }

      // Log other errors but don't block the request
      logger.error('Rate limiter error:', error);
      next();
    }
  };
}

// Pre-configured rate limiters
export const rateLimiters = {
  // Global API rate limiter
  api: rateLimit('api', {
    points: RateLimits.API.MAX,
    duration: RateLimits.API.WINDOW_MS,
  }),

  // Authentication rate limiter
  auth: rateLimit('auth', {
    points: RateLimits.AUTH.MAX,
    duration: RateLimits.AUTH.WINDOW_MS,
    blockDuration: RateLimits.AUTH.BLOCK_DURATION,
  }),

  // Email sending rate limiter
  email: (userId: string) =>
    rateLimit(
      `email:${userId}`,
      {
        points: RateLimits.EMAIL.MAX,
        duration: RateLimits.EMAIL.WINDOW_MS,
      },
      // Always use the same identifier for a user
      () => `user:${userId}`
    ),

  // Password reset rate limiter
  passwordReset: rateLimit('password-reset', {
    points: RateLimits.PASSWORD_RESET.MAX,
    duration: RateLimits.PASSWORD_RESET.WINDOW_MS,
  }),
};
