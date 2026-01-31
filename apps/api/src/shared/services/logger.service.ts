/**
 * Enterprise Logger Service - Advanced Logging with Context
 * 
 * Features:
 * - Structured logging with JSON output
 * - Request context tracking
 * - Log levels (debug, info, warn, error)
 * - Sensitive data masking
 */

import { Injectable, Scope, LoggerService as NestLoggerService } from '@nestjs/common';

export interface LogContext {
  requestId?: string;
  userId?: string;
  action?: string;
  module?: string;
  duration?: number;
  [key: string]: any;
}

@Injectable({ scope: Scope.TRANSIENT })
export class AppLoggerService implements NestLoggerService {
  private context: string = 'Application';
  private static sensitiveFields = ['password', 'token', 'secret', 'authorization', 'apiKey'];

  setContext(context: string) {
    this.context = context;
  }

  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const sanitizedContext = context ? this.sanitize(context) : {};
    
    const logEntry = {
      timestamp,
      level,
      context: this.context,
      message,
      ...sanitizedContext,
    };

    // In production, output JSON; in dev, pretty print
    if (process.env.NODE_ENV === 'production') {
      return JSON.stringify(logEntry);
    }
    
    const contextStr = Object.keys(sanitizedContext).length 
      ? ` ${JSON.stringify(sanitizedContext)}`
      : '';
    return `[${timestamp}] [${level.toUpperCase()}] [${this.context}] ${message}${contextStr}`;
  }

  private sanitize(obj: any): any {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    const sanitized: any = Array.isArray(obj) ? [] : {};
    
    for (const key of Object.keys(obj)) {
      if (AppLoggerService.sensitiveFields.some(f => key.toLowerCase().includes(f))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object') {
        sanitized[key] = this.sanitize(obj[key]);
      } else {
        sanitized[key] = obj[key];
      }
    }
    
    return sanitized;
  }

  log(message: string, context?: LogContext | string) {
    const ctx = typeof context === 'string' ? { module: context } : context;
    process.stdout.write(this.formatMessage('info', message, ctx) + '\n');
  }

  error(message: string, trace?: string, context?: LogContext | string) {
    const ctx = typeof context === 'string' ? { module: context } : context;
    const fullContext = trace ? { ...ctx, trace } : ctx;
    process.stderr.write(this.formatMessage('error', message, fullContext) + '\n');
  }

  warn(message: string, context?: LogContext | string) {
    const ctx = typeof context === 'string' ? { module: context } : context;
    process.stdout.write(this.formatMessage('warn', message, ctx) + '\n');
  }

  debug(message: string, context?: LogContext | string) {
    if (process.env.NODE_ENV === 'production') return;
    const ctx = typeof context === 'string' ? { module: context } : context;
    process.stdout.write(this.formatMessage('debug', message, ctx) + '\n');
  }

  verbose(message: string, context?: LogContext | string) {
    if (process.env.NODE_ENV === 'production') return;
    const ctx = typeof context === 'string' ? { module: context } : context;
    process.stdout.write(this.formatMessage('verbose', message, ctx) + '\n');
  }

  // Business event logging
  logEvent(event: string, data?: any) {
    this.log(`Event: ${event}`, { event, data: this.sanitize(data) });
  }

  // API request logging
  logRequest(method: string, path: string, duration: number, statusCode: number, userId?: string) {
    this.log(`${method} ${path} ${statusCode} - ${duration}ms`, {
      method,
      path,
      duration,
      statusCode,
      userId,
    });
  }

  // Error with stack trace
  logError(error: Error, context?: LogContext) {
    this.error(error.message, error.stack, context);
  }
}

export default AppLoggerService;
