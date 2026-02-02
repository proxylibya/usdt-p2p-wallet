/**
 * 🛡️ Withdrawal Rate Limit Guard - Prevents abuse of withdrawal endpoints
 * Enterprise-grade protection against:
 * - Brute force OTP attacks
 * - Rapid withdrawal attempts
 * - Account draining attacks
 */

import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { RedisService } from '../../infrastructure/cache/redis.service';

interface RateLimitConfig {
  maxAttempts: number;
  windowSeconds: number;
  blockDurationSeconds: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Withdrawal request: 5 per hour
  'withdrawal:request': {
    maxAttempts: 5,
    windowSeconds: 3600,
    blockDurationSeconds: 7200, // 2 hours block
  },
  // OTP verification: 5 attempts per request
  'withdrawal:otp': {
    maxAttempts: 5,
    windowSeconds: 600, // 10 minutes
    blockDurationSeconds: 1800, // 30 minutes block
  },
  // Failed OTP: 3 consecutive failures = block
  'withdrawal:otp:failed': {
    maxAttempts: 3,
    windowSeconds: 600,
    blockDurationSeconds: 3600, // 1 hour block
  },
};

@Injectable()
export class WithdrawalRateLimitGuard implements CanActivate {
  constructor(private redis: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    const path = request.path;
    const ip = request.ip || request.headers['x-forwarded-for'] || 'unknown';

    if (!userId) {
      return true; // Let auth guard handle this
    }

    // Determine rate limit type based on endpoint
    let limitType = 'withdrawal:request';
    if (path.includes('/confirm')) {
      limitType = 'withdrawal:otp';
    }

    const config = RATE_LIMITS[limitType];
    const key = `ratelimit:${limitType}:${userId}`;
    const blockKey = `ratelimit:blocked:${limitType}:${userId}`;

    // Check if user is blocked
    const isBlocked = await this.redis.get(blockKey);
    if (isBlocked) {
      const ttl = await this.redis.getTtl(blockKey);
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Too many attempts. Please try again in ${Math.ceil(ttl / 60)} minutes.`,
          retryAfter: ttl,
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    // Get current attempt count
    const attempts = await this.redis.increment(key);
    
    // Set expiry on first attempt
    if (attempts === 1) {
      await this.redis.expire(key, config.windowSeconds);
    }

    // Check if limit exceeded
    if (attempts > config.maxAttempts) {
      // Block the user
      await this.redis.set(blockKey, '1', config.blockDurationSeconds);
      
      // Log security event
      console.warn(`[SECURITY] Rate limit exceeded for ${limitType} - User: ${userId}, IP: ${ip}`);
      
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Rate limit exceeded. You are blocked for ${config.blockDurationSeconds / 60} minutes.`,
          retryAfter: config.blockDurationSeconds,
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    // Add rate limit headers
    const response = context.switchToHttp().getResponse();
    response.setHeader('X-RateLimit-Limit', config.maxAttempts);
    response.setHeader('X-RateLimit-Remaining', Math.max(0, config.maxAttempts - attempts));
    response.setHeader('X-RateLimit-Reset', Date.now() + config.windowSeconds * 1000);

    return true;
  }
}

/**
 * Track failed OTP attempts separately
 */
@Injectable()
export class OtpFailureTracker {
  constructor(private redis: RedisService) {}

  async trackFailure(userId: string): Promise<void> {
    const key = `ratelimit:withdrawal:otp:failed:${userId}`;
    const blockKey = `ratelimit:blocked:withdrawal:otp:${userId}`;
    const config = RATE_LIMITS['withdrawal:otp:failed'];

    const failures = await this.redis.increment(key);
    
    if (failures === 1) {
      await this.redis.expire(key, config.windowSeconds);
    }

    if (failures >= config.maxAttempts) {
      await this.redis.set(blockKey, '1', config.blockDurationSeconds);
      console.warn(`[SECURITY] User ${userId} blocked due to ${failures} failed OTP attempts`);
    }
  }

  async resetFailures(userId: string): Promise<void> {
    const key = `ratelimit:withdrawal:otp:failed:${userId}`;
    await this.redis.del(key);
  }

  async isBlocked(userId: string): Promise<boolean> {
    const blockKey = `ratelimit:blocked:withdrawal:otp:${userId}`;
    const isBlocked = await this.redis.get(blockKey);
    return !!isBlocked;
  }
}
