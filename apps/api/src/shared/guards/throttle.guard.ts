/**
 * Custom Throttle Guard - Enterprise-grade Rate Limiting
 * 
 * Features:
 * - Per-endpoint rate limits
 * - User-based tracking
 * - IP-based tracking for unauthenticated requests
 */

import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';

@Injectable()
export class CustomThrottleGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Use user ID if authenticated, otherwise use IP
    const userId = req.user?.id;
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    
    return userId ? `user:${userId}` : `ip:${ip}`;
  }

  protected async throwThrottlingException(): Promise<void> {
    throw new ThrottlerException('Too many requests. Please try again later.');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Skip rate limiting for health checks
    if (request.url === '/api/v1/health') {
      return true;
    }

    return super.canActivate(context);
  }
}
