/**
 * Performance Interceptor - Enterprise-grade Performance Monitoring
 * 
 * Features:
 * - Request timing
 * - Response compression info
 * - Slow request logging
 */

import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Performance');
  private readonly SLOW_REQUEST_THRESHOLD = 1000; // 1 second

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        
        // Log slow requests
        if (duration > this.SLOW_REQUEST_THRESHOLD) {
          this.logger.warn(`Slow request: ${method} ${url} - ${duration}ms`);
        }

        // Add timing header in development
        if (process.env.NODE_ENV !== 'production') {
          const response = context.switchToHttp().getResponse();
          response.setHeader('X-Response-Time', `${duration}ms`);
        }
      }),
    );
  }
}
