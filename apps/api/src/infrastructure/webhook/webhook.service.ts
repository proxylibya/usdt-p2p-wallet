/**
 * 🔔 Webhook Service - Enterprise-grade event notification system
 * Sends real-time notifications to external systems for critical events
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { generateHmac, generateSecureToken } from '../../shared/utils/crypto.util';

export enum WebhookEvent {
  // Transaction Events
  WITHDRAWAL_INITIATED = 'withdrawal.initiated',
  WITHDRAWAL_CONFIRMED = 'withdrawal.confirmed',
  WITHDRAWAL_COMPLETED = 'withdrawal.completed',
  WITHDRAWAL_FAILED = 'withdrawal.failed',
  DEPOSIT_RECEIVED = 'deposit.received',
  DEPOSIT_CONFIRMED = 'deposit.confirmed',
  
  // P2P Events
  TRADE_CREATED = 'p2p.trade.created',
  TRADE_PAYMENT_CONFIRMED = 'p2p.trade.payment_confirmed',
  TRADE_COMPLETED = 'p2p.trade.completed',
  TRADE_CANCELLED = 'p2p.trade.cancelled',
  TRADE_DISPUTED = 'p2p.trade.disputed',
  
  // User Events
  USER_REGISTERED = 'user.registered',
  USER_KYC_SUBMITTED = 'user.kyc.submitted',
  USER_KYC_VERIFIED = 'user.kyc.verified',
  
  // Security Events
  SUSPICIOUS_ACTIVITY = 'security.suspicious_activity',
  ACCOUNT_LOCKED = 'security.account_locked',
}

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: Record<string, any>;
  userId?: string;
  transactionId?: string;
}

interface WebhookConfig {
  url: string;
  secret: string;
  events: WebhookEvent[];
  isActive: boolean;
}

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);
  private webhookConfigs: WebhookConfig[] = [];

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.loadWebhookConfigs();
  }

  /**
   * Load webhook configurations from environment or database
   */
  private async loadWebhookConfigs() {
    // Load from environment for simple setup
    const envWebhookUrl = this.configService.get('WEBHOOK_URL');
    const envWebhookSecret = this.configService.get('WEBHOOK_SECRET');
    
    if (envWebhookUrl) {
      this.webhookConfigs.push({
        url: envWebhookUrl,
        secret: envWebhookSecret || generateSecureToken(32),
        events: Object.values(WebhookEvent),
        isActive: true,
      });
    }

    // TODO: Load additional webhooks from database for multi-tenant support
  }

  /**
   * Send webhook notification
   */
  async send(event: WebhookEvent, data: Record<string, any>, userId?: string, transactionId?: string): Promise<void> {
    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
      userId,
      transactionId,
    };

    const applicableWebhooks = this.webhookConfigs.filter(
      config => config.isActive && config.events.includes(event)
    );

    for (const webhook of applicableWebhooks) {
      await this.sendToEndpoint(webhook, payload);
    }
  }

  /**
   * Send payload to a specific webhook endpoint
   */
  private async sendToEndpoint(config: WebhookConfig, payload: WebhookPayload): Promise<void> {
    try {
      const payloadString = JSON.stringify(payload);
      const signature = generateHmac(payloadString, config.secret);
      
      const response = await fetch(config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': payload.event,
          'X-Webhook-Timestamp': payload.timestamp,
        },
        body: payloadString,
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        this.logger.warn(`Webhook delivery failed: ${config.url} - Status: ${response.status}`);
        await this.logWebhookDelivery(config.url, payload, false, response.status.toString());
      } else {
        await this.logWebhookDelivery(config.url, payload, true);
      }
    } catch (error) {
      this.logger.error(`Webhook delivery error: ${config.url}`, error);
      await this.logWebhookDelivery(config.url, payload, false, (error as Error).message);
    }
  }

  /**
   * Log webhook delivery attempt
   */
  private async logWebhookDelivery(
    url: string, 
    payload: WebhookPayload, 
    success: boolean, 
    errorMessage?: string
  ): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: 'WEBHOOK_DELIVERY',
          entity: 'Webhook',
          entityId: payload.transactionId,
          userId: payload.userId,
          newValue: {
            url: url.replace(/\/\/.*@/, '//***@'), // Mask credentials in URL
            event: payload.event,
            success,
            errorMessage,
            timestamp: payload.timestamp,
          },
        },
      });
    } catch (error) {
      this.logger.error('Failed to log webhook delivery', error);
    }
  }

  // ============================================
  // 📤 CONVENIENCE METHODS FOR COMMON EVENTS
  // ============================================

  async notifyWithdrawalInitiated(userId: string, transactionId: string, amount: number, asset: string) {
    await this.send(WebhookEvent.WITHDRAWAL_INITIATED, { amount, asset }, userId, transactionId);
  }

  async notifyWithdrawalConfirmed(userId: string, transactionId: string, amount: number, asset: string) {
    await this.send(WebhookEvent.WITHDRAWAL_CONFIRMED, { amount, asset }, userId, transactionId);
  }

  async notifyWithdrawalCompleted(userId: string, transactionId: string, amount: number, asset: string, txHash: string) {
    await this.send(WebhookEvent.WITHDRAWAL_COMPLETED, { amount, asset, txHash }, userId, transactionId);
  }

  async notifyWithdrawalFailed(userId: string, transactionId: string, reason: string) {
    await this.send(WebhookEvent.WITHDRAWAL_FAILED, { reason }, userId, transactionId);
  }

  async notifyDepositReceived(userId: string, transactionId: string, amount: number, asset: string) {
    await this.send(WebhookEvent.DEPOSIT_RECEIVED, { amount, asset }, userId, transactionId);
  }

  async notifyTradeCreated(userId: string, tradeId: string, amount: number, asset: string, price: number) {
    await this.send(WebhookEvent.TRADE_CREATED, { amount, asset, price }, userId, tradeId);
  }

  async notifyTradeCompleted(userId: string, tradeId: string, amount: number, asset: string) {
    await this.send(WebhookEvent.TRADE_COMPLETED, { amount, asset }, userId, tradeId);
  }

  async notifySuspiciousActivity(userId: string, activityType: string, details: Record<string, any>) {
    await this.send(WebhookEvent.SUSPICIOUS_ACTIVITY, { activityType, ...details }, userId);
  }
}
