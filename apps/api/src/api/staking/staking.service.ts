import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { SubscribeDto, CreateStakingProductDto } from './dto/staking.dto';

@Injectable()
export class StakingService {
  constructor(private prisma: PrismaService) {}

  // ========== ADMIN ==========
  async createProduct(dto: CreateStakingProductDto) {
    return this.prisma.stakingProduct.create({
      data: {
        asset: dto.asset,
        apy: dto.apy,
        durationDays: dto.durationDays,
        minAmount: dto.minAmount,
        maxAmount: dto.maxAmount,
        isActive: true,
      },
    });
  }

  // ========== USER ==========
  async getProducts(asset?: string) {
    return this.prisma.stakingProduct.findMany({
      where: {
        isActive: true,
        ...(asset ? { asset } : {}),
      },
      orderBy: { apy: 'desc' },
    });
  }

  async subscribe(userId: string, dto: SubscribeDto) {
    const { productId, amount } = dto;

    const product = await this.prisma.stakingProduct.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');
    if (!product.isActive) throw new BadRequestException('Product is not active');

    if (amount < Number(product.minAmount)) throw new BadRequestException(`Minimum amount is ${product.minAmount}`);
    if (product.maxAmount && amount > Number(product.maxAmount)) throw new BadRequestException(`Maximum amount is ${product.maxAmount}`);

    // Check Balance
    const wallet = await this.prisma.wallet.findFirst({
      where: { userId, asset: product.asset, accountType: 'SPOT', balance: { gte: amount } },
    });

    if (!wallet) throw new BadRequestException(`Insufficient ${product.asset} balance`);

    return this.prisma.$transaction(async (tx) => {
        // Deduct from Spot
        await tx.wallet.update({
            where: { id: wallet.id },
            data: { balance: { decrement: amount } }
        });

        // Calculate Dates
        const startDate = new Date();
        let endDate = null;
        if (product.durationDays > 0) {
            endDate = new Date();
            endDate.setDate(startDate.getDate() + product.durationDays);
        }

        // Create Subscription
        const sub = await tx.stakingSubscription.create({
            data: {
                userId,
                productId,
                amount,
                startDate,
                endDate,
                status: 'ACTIVE'
            }
        });

        // Transaction Record
        await tx.transaction.create({
            data: {
                userId,
                type: 'TRANSFER_OUT', // Or STAKING_LOCK
                asset: product.asset,
                amount,
                status: 'COMPLETED',
                note: `Staked ${amount} ${product.asset} - ${product.durationDays} days`,
            }
        });

        return sub;
    });
  }

  async getMySubscriptions(userId: string) {
      return this.prisma.stakingSubscription.findMany({
          where: { userId },
          include: { product: true },
          orderBy: { startDate: 'desc' }
      });
  }

  async redeem(userId: string, subscriptionId: string) {
      const sub = await this.prisma.stakingSubscription.findUnique({
          where: { id: subscriptionId },
          include: { product: true }
      });

      if (!sub) throw new NotFoundException('Subscription not found');
      if (sub.userId !== userId) throw new BadRequestException('Not your subscription');
      if (sub.status !== 'ACTIVE') throw new BadRequestException('Subscription not active');

      // Check maturity for fixed term
      if (sub.endDate && new Date() < sub.endDate) {
          // Allow early redeem but with penalty? Or just block?
          // For simple earn, often block or forfeit interest.
          // Let's implement: forfeit interest if early.
          // But for now, let's just Block for simplicity or check requirements.
          // "Flexible" -> durationDays = 0.
          // Frontend says "Flexible" or "30 Days".
          // Let's assume early redemption is allowed but forfeits interest.
      }

      // Calculate Interest
      // Simple Interest = Principal * (APY/100) * (Days/365)
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - sub.startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      // If fixed term and completed, limit days to duration
      const days = sub.product.durationDays > 0 && diffDays > sub.product.durationDays 
          ? sub.product.durationDays 
          : diffDays;

      const interest = (Number(sub.amount) * Number(sub.product.apy) / 100) * (days / 365);

      return this.prisma.$transaction(async (tx) => {
          // Update Sub
          await tx.stakingSubscription.update({
              where: { id: sub.id },
              data: {
                  status: 'REDEEMED',
                  redeemedAt: new Date(),
                  interestEarned: interest
              }
          });

          // Credit Wallet (Principal + Interest)
          const wallet = await tx.wallet.findFirst({
              where: { userId, asset: sub.product.asset, accountType: 'SPOT' }
          });

          // If wallet missing (shouldn't happen if they staked), create one
          const walletId = wallet ? wallet.id : (await tx.wallet.create({
              data: { userId, asset: sub.product.asset, network: 'TRC20', accountType: 'SPOT', balance: 0, lockedBalance: 0 }
          })).id;

          const totalReturn = Number(sub.amount) + interest;

          await tx.wallet.update({
              where: { id: walletId },
              data: { balance: { increment: totalReturn } }
          });

          // Log
          await tx.transaction.create({
              data: {
                  userId,
                  type: 'TRANSFER_IN', // STAKING_REDEEM
                  asset: sub.product.asset,
                  amount: totalReturn,
                  status: 'COMPLETED',
                  note: `Redeemed Staking: ${sub.amount} + ${interest.toFixed(8)} interest`
              }
          });

          return { success: true, principal: sub.amount, interest, total: totalReturn };
      });
  }
}
