/**
 * Request ID Interceptor - Adds unique request ID for tracking
 */

import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    
    // Generate or use existing request ID
    const requestId = request.headers['x-request-id'] || uuidv4();
    
    // Set on request for use in services/logging
    request.requestId = requestId;
    
    // Set response header
    response.setHeader('X-Request-ID', requestId);
    
    return next.handle().pipe(
      tap({
        next: () => {
          // Request completed successfully
        },
        error: () => {
          // Error occurred - ID still in header for client reference
        },
      }),
    );
  }
}
