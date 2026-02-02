/**
 * 📋 Audit Service - Enterprise-grade audit logging for compliance and security
 * Tracks all sensitive operations with full context for regulatory compliance
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { maskSensitiveData } from '../../shared/utils/crypto.util';

export enum AuditAction {
  // Authentication
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PASSWORD_RESET = 'PASSWORD_RESET',
  OTP_REQUESTED = 'OTP_REQUESTED',
  OTP_VERIFIED = 'OTP_VERIFIED',
  OTP_FAILED = 'OTP_FAILED',
  
  // Wallet Operations
  WALLET_CREATED = 'WALLET_CREATED',
  DEPOSIT_INITIATED = 'DEPOSIT_INITIATED',
  DEPOSIT_COMPLETED = 'DEPOSIT_COMPLETED',
  WITHDRAWAL_REQUESTED = 'WITHDRAWAL_REQUESTED',
  WITHDRAWAL_OTP_SENT = 'WITHDRAWAL_OTP_SENT',
  WITHDRAWAL_CONFIRMED = 'WITHDRAWAL_CONFIRMED',
  WITHDRAWAL_FAILED = 'WITHDRAWAL_FAILED',
  WITHDRAWAL_CANCELLED = 'WITHDRAWAL_CANCELLED',
  TRANSFER_INTERNAL = 'TRANSFER_INTERNAL',
  TRANSFER_TO_USER = 'TRANSFER_TO_USER',
  
  // P2P Trading
  P2P_OFFER_CREATED = 'P2P_OFFER_CREATED',
  P2P_OFFER_UPDATED = 'P2P_OFFER_UPDATED',
  P2P_OFFER_DELETED = 'P2P_OFFER_DELETED',
  P2P_TRADE_STARTED = 'P2P_TRADE_STARTED',
  P2P_PAYMENT_CONFIRMED = 'P2P_PAYMENT_CONFIRMED',
  P2P_CRYPTO_RELEASED = 'P2P_CRYPTO_RELEASED',
  P2P_TRADE_CANCELLED = 'P2P_TRADE_CANCELLED',
  P2P_DISPUTE_OPENED = 'P2P_DISPUTE_OPENED',
  P2P_DISPUTE_RESOLVED = 'P2P_DISPUTE_RESOLVED',
  
  // User Management
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_BANNED = 'USER_BANNED',
  USER_UNBANNED = 'USER_UNBANNED',
  KYC_SUBMITTED = 'KYC_SUBMITTED',
  KYC_APPROVED = 'KYC_APPROVED',
  KYC_REJECTED = 'KYC_REJECTED',
  
  // Admin Actions
  ADMIN_LOGIN = 'ADMIN_LOGIN',
  ADMIN_ACTION = 'ADMIN_ACTION',
  SETTINGS_CHANGED = 'SETTINGS_CHANGED',
  
  // Security Events
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INVALID_ACCESS_ATTEMPT = 'INVALID_ACCESS_ATTEMPT',
  
  // Network Configuration
  NETWORK_MODE_CHANGED = 'NETWORK_MODE_CHANGED',
  NETWORK_CONFIG_UPDATED = 'NETWORK_CONFIG_UPDATED',
  NETWORK_CONFIRMATION_CODE_SET = 'NETWORK_CONFIRMATION_CODE_SET',
}

export enum AuditSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
}

export interface AuditContext {
  userId?: string;
  adminId?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  requestId?: string;
}

export interface AuditData {
  action: AuditAction;
  severity?: AuditSeverity;
  entity: string;
  entityId?: string;
  context: AuditContext;
  oldValue?: any;
  newValue?: any;
  metadata?: Record<string, any>;
  success?: boolean;
  errorMessage?: string;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  /**
   * Log an audit event
   */
  async log(data: AuditData): Promise<void> {
    try {
      // Sanitize sensitive data before logging
      const sanitizedOldValue = this.sanitizeData(data.oldValue);
      const sanitizedNewValue = this.sanitizeData(data.newValue);
      const sanitizedMetadata = this.sanitizeData(data.metadata);

      await this.prisma.auditLog.create({
        data: {
          action: data.action,
          entity: data.entity,
          entityId: data.entityId,
          userId: data.context.userId,
          adminId: data.context.adminId,
          ipAddress: data.context.ipAddress,
          userAgent: data.context.userAgent,
          oldValue: sanitizedOldValue,
          newValue: {
            ...sanitizedNewValue,
            _audit: {
              severity: data.severity || AuditSeverity.INFO,
              sessionId: data.context.sessionId,
              requestId: data.context.requestId,
              success: data.success ?? true,
              errorMessage: data.errorMessage,
              ...sanitizedMetadata,
            },
          } as any,
        },
      });

      // For critical events, also log to console for immediate visibility
      if (data.severity === AuditSeverity.CRITICAL) {
        console.error(`[AUDIT CRITICAL] ${data.action} - Entity: ${data.entity} - User: ${data.context.userId}`);
      }
    } catch (error) {
      // Never let audit logging failure break the main flow
      console.error('[AUDIT ERROR] Failed to write audit log:', error);
    }
  }

  /**
   * Log authentication events
   */
  async logAuth(
    action: AuditAction,
    userId: string | undefined,
    context: AuditContext,
    success: boolean,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      action,
      severity: success ? AuditSeverity.INFO : AuditSeverity.WARNING,
      entity: 'User',
      entityId: userId,
      context: { ...context, userId },
      metadata,
      success,
    });
  }

  /**
   * Log wallet/financial operations
   */
  async logWalletOperation(
    action: AuditAction,
    userId: string,
    walletId: string,
    context: AuditContext,
    details: {
      amount?: number;
      asset?: string;
      network?: string;
      address?: string;
      transactionId?: string;
      fee?: number;
    },
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    await this.log({
      action,
      severity: success ? AuditSeverity.INFO : AuditSeverity.WARNING,
      entity: 'Wallet',
      entityId: walletId,
      context: { ...context, userId },
      newValue: {
        amount: details.amount,
        asset: details.asset,
        network: details.network,
        address: details.address ? maskSensitiveData(details.address, 6) : undefined,
        transactionId: details.transactionId,
        fee: details.fee,
      },
      success,
      errorMessage,
    });
  }

  /**
   * Log P2P trading operations
   */
  async logP2POperation(
    action: AuditAction,
    userId: string,
    entityId: string,
    context: AuditContext,
    details: Record<string, any>,
    success: boolean = true
  ): Promise<void> {
    await this.log({
      action,
      severity: AuditSeverity.INFO,
      entity: 'P2PTrade',
      entityId,
      context: { ...context, userId },
      newValue: details,
      success,
    });
  }

  /**
   * Log admin actions
   */
  async logAdminAction(
    action: string,
    adminId: string,
    targetEntity: string,
    targetId: string,
    context: AuditContext,
    changes: { oldValue?: any; newValue?: any }
  ): Promise<void> {
    await this.log({
      action: AuditAction.ADMIN_ACTION,
      severity: AuditSeverity.WARNING,
      entity: targetEntity,
      entityId: targetId,
      context: { ...context, adminId },
      oldValue: changes.oldValue,
      newValue: changes.newValue,
      metadata: { adminAction: action },
    });
  }

  /**
   * Log security events
   */
  async logSecurityEvent(
    action: AuditAction,
    context: AuditContext,
    details: Record<string, any>
  ): Promise<void> {
    await this.log({
      action,
      severity: AuditSeverity.CRITICAL,
      entity: 'Security',
      context,
      metadata: details,
      success: false,
    });
  }

  /**
   * Get audit logs for a specific user
   */
  async getUserAuditLogs(userId: string, limit: number = 50, offset: number = 0) {
    return this.prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Get audit logs for a specific entity
   */
  async getEntityAuditLogs(entity: string, entityId: string, limit: number = 50) {
    return this.prisma.auditLog.findMany({
      where: { entity, entityId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Sanitize data to remove or mask sensitive information
   */
  private sanitizeData(data: any): any {
    if (!data) return data;
    
    const sensitiveFields = ['password', 'passwordHash', 'otp', 'otpHash', 'secret', 'token', 'accessToken', 'refreshToken'];
    
    if (typeof data === 'object') {
      const sanitized = { ...data };
      for (const field of sensitiveFields) {
        if (sanitized[field]) {
          sanitized[field] = '[REDACTED]';
        }
      }
      // Mask addresses partially
      if (sanitized.address && typeof sanitized.address === 'string') {
        sanitized.address = maskSensitiveData(sanitized.address, 6);
      }
      if (sanitized.phone && typeof sanitized.phone === 'string') {
        sanitized.phone = maskSensitiveData(sanitized.phone, 3);
      }
      return sanitized;
    }
    
    return data;
  }
}
