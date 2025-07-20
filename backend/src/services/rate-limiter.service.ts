import { RateLimiterRedis, RateLimiterRes } from 'rate-limiter-flexible';
import { redisClient } from '../config/redis';
import { logger } from '../utils/logger';

// Extend the RateLimiterRes type to include msBeforeNext
interface RateLimiterResponse extends RateLimiterRes {
  msBeforeNext: number;
  remainingPoints: number;
}

type RateLimitConfig = {
  points: number;
  duration: number;
  blockDuration?: number;
};

export class RateLimiterService {
  private static instance: RateLimiterService;
  private limiters: Map<string, RateLimiterRedis> = new Map();

  private constructor() {}

  public static getInstance(): RateLimiterService {
    if (!RateLimiterService.instance) {
      RateLimiterService.instance = new RateLimiterService();
    }
    return RateLimiterService.instance;
  }

  private getOrCreateLimiter(
    key: string,
    config: RateLimitConfig
  ): RateLimiterRedis {
    if (!this.limiters.has(key)) {
      this.limiters.set(
        key,
        new RateLimiterRedis({
          storeClient: redisClient,
          keyPrefix: `rate_limit:${key}`,
          points: config.points,
          duration: config.duration,
          blockDuration: config.blockDuration || 0,
          inmemoryBlockOnConsumed: config.points + 1,
          inmemoryBlockDuration: 60, // Block for 1 minute if in-memory limit is exceeded
          insuranceLimiter: new RateLimiterRedis({
            storeClient: redisClient,
            keyPrefix: `insurance:${key}`,
            points: config.points * 2,
            duration: config.duration,
          }),
        })
      );
    }
    return this.limiters.get(key)!;
  }

  /**
   * Apply rate limiting
   * @param key Unique identifier for the rate limit (e.g., 'login', 'api', 'send-email')
   * @param identifier Unique identifier for the client (e.g., IP, user ID, API key)
   * @param config Rate limit configuration
   */
  public async limit(
    key: string,
    identifier: string,
    config: RateLimitConfig
  ): Promise<{ allowed: boolean; headers: Record<string, string> }> {
    const limiter = this.getOrCreateLimiter(key, config);
    const rateLimiterRes = (await limiter.consume(identifier)) as RateLimiterResponse;

    const headers: Record<string, string> = {
      'X-RateLimit-Limit': config.points.toString(),
      'X-RateLimit-Remaining': rateLimiterRes.remainingPoints.toString(),
      'X-RateLimit-Reset': new Date(
        Date.now() + rateLimiterRes.msBeforeNext
      ).toISOString(),
    };

    // Only include Retry-After if remaining points are 0
    if (rateLimiterRes.remainingPoints <= 0) {
      headers['Retry-After'] = Math.ceil(rateLimiterRes.msBeforeNext / 1000).toString();
    }

    return {
      allowed: rateLimiterRes.remainingPoints > 0,
      headers,
    };
  }

  /**
   * Apply rate limiting and throw an error if the limit is exceeded
   */
  public async enforce(
    key: string,
    identifier: string,
    config: RateLimitConfig
  ): Promise<void> {
    try {
      const result = await this.limit(key, identifier, config);
      if (!result.allowed) {
        throw new Error('Rate limit exceeded');
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        logger.warn(`Rate limit exceeded for ${key}: ${error.message}`);
        const rateLimitError = new Error('Too Many Requests');
        (rateLimitError as any).status = 429;
        if ((error as any).msBeforeNext) {
          (rateLimitError as any).retryAfter = Math.ceil((error as any).msBeforeNext / 1000);
        }
        throw rateLimitError;
      }
      throw error;
    }
  }
}

export const rateLimiter = RateLimiterService.getInstance();

// Predefined rate limiters
export const RateLimits = {
  // Global API rate limiting
  API: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX: 100, // Limit each IP to 100 requests per windowMs
  },
  // Authentication endpoints
  AUTH: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX: 5, // 5 login attempts per 15 minutes
    BLOCK_DURATION: 30 * 60, // Block for 30 minutes after max attempts
  },
  // Email sending
  EMAIL: {
    WINDOW_MS: 60 * 60 * 1000, // 1 hour
    MAX: 100, // 100 emails per hour per user
  },
  // Password reset
  PASSWORD_RESET: {
    WINDOW_MS: 60 * 60 * 1000, // 1 hour
    MAX: 3, // 3 password reset attempts per hour
  },
};
