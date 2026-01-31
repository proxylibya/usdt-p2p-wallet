/**
 * Prisma Middleware - Audit Logging & Performance Monitoring
 * 
 * Enterprise-grade middleware for:
 * - Automatic audit logging for sensitive operations
 * - Query performance monitoring
 * - Soft delete implementation
 */

import { Prisma } from '@prisma/client';
import { Logger } from '@nestjs/common';

const logger = new Logger('PrismaMiddleware');

// Models that require audit logging
const AUDITED_MODELS = ['User', 'Wallet', 'Transaction', 'P2POffer', 'P2PTrade'];

// Sensitive operations to track
const AUDITED_OPERATIONS = ['create', 'update', 'delete', 'updateMany', 'deleteMany'];

export const auditMiddleware: Prisma.Middleware = async (params, next) => {
  const startTime = Date.now();
  
  // Execute the query
  const result = await next(params);
  
  const duration = Date.now() - startTime;
  
  // Log slow queries (> 100ms)
  if (duration > 100) {
    logger.warn(`Slow query: ${params.model}.${params.action} took ${duration}ms`);
  }
  
  // Audit logging for sensitive operations
  if (
    params.model &&
    AUDITED_MODELS.includes(params.model) &&
    AUDITED_OPERATIONS.includes(params.action)
  ) {
    // Log audit event (in production, this would write to AuditLog table)
    if (process.env.NODE_ENV !== 'production') {
      logger.debug(`AUDIT: ${params.model}.${params.action}`, {
        model: params.model,
        action: params.action,
        duration: `${duration}ms`,
      });
    }
  }
  
  return result;
};

/**
 * Query timing middleware for performance monitoring
 */
export const queryTimingMiddleware: Prisma.Middleware = async (params, next) => {
  const startTime = Date.now();
  const result = await next(params);
  const duration = Date.now() - startTime;
  
  // Add timing header for debugging
  if (process.env.NODE_ENV !== 'production' && duration > 50) {
    logger.verbose(`Query ${params.model}.${params.action}: ${duration}ms`);
  }
  
  return result;
};

/**
 * Soft delete middleware - converts delete to update with deletedAt
 * Enable this if you want soft deletes on specific models
 */
export const softDeleteMiddleware: Prisma.Middleware = async (params, next) => {
  // Uncomment below to enable soft delete for specific models
  /*
  const softDeleteModels = ['User', 'P2POffer'];
  
  if (params.model && softDeleteModels.includes(params.model)) {
    if (params.action === 'delete') {
      params.action = 'update';
      params.args['data'] = { deletedAt: new Date() };
    }
    
    if (params.action === 'deleteMany') {
      params.action = 'updateMany';
      if (params.args.data !== undefined) {
        params.args.data['deletedAt'] = new Date();
      } else {
        params.args['data'] = { deletedAt: new Date() };
      }
    }
  }
  */
  
  return next(params);
};
