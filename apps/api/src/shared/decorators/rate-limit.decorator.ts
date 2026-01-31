/**
 * Rate Limit Decorators - Endpoint-specific rate limiting
 */

import { SetMetadata } from '@nestjs/common';

export const THROTTLE_TTL = 'throttle:ttl';
export const THROTTLE_LIMIT = 'throttle:limit';

/**
 * Custom rate limit for sensitive endpoints
 * @param ttl Time to live in seconds
 * @param limit Max requests in TTL period
 */
export const RateLimit = (ttl: number, limit: number) => {
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    SetMetadata(THROTTLE_TTL, ttl)(target, propertyKey!, descriptor!);
    SetMetadata(THROTTLE_LIMIT, limit)(target, propertyKey!, descriptor!);
  };
};

/**
 * Strict rate limit for auth endpoints (5 requests per minute)
 */
export const AuthRateLimit = () => RateLimit(60, 5);

/**
 * Strict rate limit for financial operations (10 requests per minute)
 */
export const FinancialRateLimit = () => RateLimit(60, 10);

/**
 * Relaxed rate limit for read operations (100 requests per minute)
 */
export const ReadRateLimit = () => RateLimit(60, 100);
