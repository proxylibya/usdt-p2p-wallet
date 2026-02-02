import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class CleanupService implements OnModuleInit {
  private readonly logger = new Logger(CleanupService.name);
  private sessionCleanupInterval: NodeJS.Timeout;
  private tradeExpiryInterval: NodeJS.Timeout;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  onModuleInit() {
    // Start cleanup jobs
    this.startSessionCleanup();
    this.startTradeExpiryCheck();
    this.logger.log('Cleanup service initialized');
  }

  private startSessionCleanup() {
    const interval = this.configService.get('SESSION_CLEANUP_INTERVAL', 3600000); // Default 1 hour
    
    this.sessionCleanupInterval = setInterval(async () => {
      await this.cleanExpiredSessions();
    }, interval);

    // Run immediately on startup
    this.cleanExpiredSessions();
  }

  private startTradeExpiryCheck() {
    const interval = this.configService.get('TRADE_EXPIRY_CHECK_INTERVAL', 60000); // Default 1 minute
    
    this.tradeExpiryInterval = setInterval(async () => {
      await this.cancelExpiredTrades();
    }, interval);

    // Run immediately on startup
    this.cancelExpiredTrades();
  }

  async cleanExpiredSessions(): Promise<number> {
    try {
      const result = await this.prisma.session.deleteMany({
        where: {
          expiresAt: { lt: new Date() },
        },
      });
      
      if (result.count > 0) {
        this.logger.log(`Cleaned ${result.count} expired sessions`);
      }
      
      return result.count;
    } catch (error) {
      this.logger.error('Failed to clean expired sessions', error);
      return 0;
    }
  }

  async cancelExpiredTrades(): Promise<number> {
    try {
      // Find expired trades that are still waiting for payment
      const expiredTrades = await this.prisma.p2PTrade.findMany({
        where: {
          status: 'WAITING_PAYMENT',
          expiresAt: { lt: new Date() },
        },
        include: { offer: true },
      });

      let cancelledCount = 0;

      for (const trade of expiredTrades) {
        try {
          await this.prisma.$transaction(async (tx) => {
            // Return locked funds to seller
            await tx.wallet.updateMany({
              where: { 
                userId: trade.sellerId, 
                asset: trade.offer.asset, 
                accountType: 'FUNDING' 
              },
              data: {
                balance: { increment: Number(trade.amount) },
                lockedBalance: { decrement: Number(trade.amount) },
              },
            });

            // Update trade status
            await tx.p2PTrade.update({
              where: { id: trade.id },
              data: {
                status: 'CANCELLED',
                cancelledAt: new Date(),
                disputeReason: 'Trade expired - payment timeout',
              },
            });

            // Notify both parties
            await tx.notification.createMany({
              data: [
                {
                  userId: trade.buyerId,
                  type: 'P2P_TRADE',
                  title: 'Trade Expired',
                  message: `Trade #${trade.id.slice(0, 8)} has expired due to payment timeout.`,
                },
                {
                  userId: trade.sellerId,
                  type: 'P2P_TRADE',
                  title: 'Trade Expired - Funds Released',
                  message: `Trade #${trade.id.slice(0, 8)} expired. ${trade.amount} ${trade.offer.asset} returned to your wallet.`,
                },
              ],
            });
          });

          cancelledCount++;
        } catch (error) {
          this.logger.error(`Failed to cancel expired trade ${trade.id}`, error);
        }
      }

      if (cancelledCount > 0) {
        this.logger.log(`Cancelled ${cancelledCount} expired trades`);
      }

      return cancelledCount;
    } catch (error) {
      this.logger.error('Failed to cancel expired trades', error);
      return 0;
    }
  }

  async cleanOldNotifications(daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await this.prisma.notification.deleteMany({
        where: {
          isRead: true,
          createdAt: { lt: cutoffDate },
        },
      });

      if (result.count > 0) {
        this.logger.log(`Cleaned ${result.count} old notifications`);
      }

      return result.count;
    } catch (error) {
      this.logger.error('Failed to clean old notifications', error);
      return 0;
    }
  }

  async cleanOldAuditLogs(daysOld: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await this.prisma.auditLog.deleteMany({
        where: {
          createdAt: { lt: cutoffDate },
        },
      });

      if (result.count > 0) {
        this.logger.log(`Cleaned ${result.count} old audit logs`);
      }

      return result.count;
    } catch (error) {
      this.logger.error('Failed to clean old audit logs', error);
      return 0;
    }
  }

  onModuleDestroy() {
    if (this.sessionCleanupInterval) {
      clearInterval(this.sessionCleanupInterval);
    }
    if (this.tradeExpiryInterval) {
      clearInterval(this.tradeExpiryInterval);
    }
  }
}
