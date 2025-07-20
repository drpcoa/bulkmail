import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { redisClient } from '../config/redis';
import { config } from '../config/env';
import { logger } from '../config/logger';
import { ApiError } from '../utils/ApiError';

// Rate limiting configuration
const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient.getClient(),
  keyPrefix: 'rate_limit',
  points: config.rateLimit.max, // Maximum number of points
  duration: config.rateLimit.windowMs / 1000, // Convert to seconds
  blockDuration: 60 * 15, // Block for 15 minutes if limit is exceeded
});

// Rate limiter middleware
export const rateLimiterMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Use IP address as a unique identifier
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    
    // Apply rate limiting
    await rateLimiter.consume(clientIp, 1); // Consume 1 point per request
    
    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': config.rateLimit.max.toString(),
      'X-RateLimit-Remaining': (config.rateLimit.max - 1).toString(),
      'X-RateLimit-Reset': (Date.now() + config.rateLimit.windowMs).toString(),
    });
    
    next();
  } catch (error) {
    // Rate limit exceeded
    const retryAfter = error.msBeforeNext ? Math.ceil(error.msBeforeNext / 1000) : 60;
    
    res.set({
      'Retry-After': retryAfter.toString(),
      'X-RateLimit-Retry-After': retryAfter.toString(),
    });
    
    logger.warn(`Rate limit exceeded for IP: ${req.ip} - Path: ${req.path}`);
    
    next(
      new ApiError(
        429,
        'Too Many Requests',
        `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
        true
      )
    );
  }
};

// Special rate limiter for authentication endpoints
export const authRateLimiter = new RateLimiterRedis({
  storeClient: redisClient.getClient(),
  keyPrefix: 'auth_rate_limit',
  points: 5, // 5 login attempts
  duration: 60 * 15, // 15 minutes
  blockDuration: 60 * 60, // Block for 1 hour after 5 failed attempts
});

// Authentication rate limiter middleware
export const authRateLimiterMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    await authRateLimiter.consume(clientIp, 1);
    next();
  } catch (error) {
    const retryAfter = error.msBeforeNext ? Math.ceil(error.msBeforeNext / 1000) : 60;
    
    res.set({
      'Retry-After': retryAfter.toString(),
    });
    
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    
    next(
      new ApiError(
        429,
        'Too Many Requests',
        `Too many login attempts. Please try again in ${retryAfter} seconds.`,
        true
      )
    );
  }
};

// Export rate limiter for programmatic use
export { rateLimiter };
