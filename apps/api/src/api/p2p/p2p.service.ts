import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class P2PService {
  constructor(private prisma: PrismaService) {}

  async getOffers(filters?: any) {
    const where: any = { isActive: true };
    if (filters?.type) where.type = filters.type;
    if (filters?.asset) where.asset = filters.asset;
    if (filters?.fiatCurrency) where.fiatCurrency = filters.fiatCurrency;
    if (filters?.countryCode) where.countryCode = filters.countryCode;

    return this.prisma.p2POffer.findMany({
      where,
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 20,
    });
  }

  async getOfferById(id: string) {
    const offer = await this.prisma.p2POffer.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    });
    if (!offer) throw new NotFoundException('Offer not found');
    return offer;
  }

  async createOffer(userId: string, data: any) {
    return this.prisma.p2POffer.create({
      data: { userId, ...data },
    });
  }

  async updateOffer(id: string, userId: string, data: any) {
    const offer = await this.prisma.p2POffer.findFirst({ where: { id, userId } });
    if (!offer) throw new NotFoundException('Offer not found');
    return this.prisma.p2POffer.update({ where: { id }, data });
  }

  async deleteOffer(id: string, userId: string) {
    const offer = await this.prisma.p2POffer.findFirst({ where: { id, userId } });
    if (!offer) throw new NotFoundException('Offer not found');
    return this.prisma.p2POffer.update({ where: { id }, data: { isActive: false } });
  }

  async getMyOffers(userId: string) {
    return this.prisma.p2POffer.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  async startTrade(userId: string, offerId: string, amount: number) {
    const offer = await this.prisma.p2POffer.findUnique({ where: { id: offerId } });
    if (!offer || !offer.isActive) throw new NotFoundException('Offer not found or inactive');
    if (new Decimal(amount).lessThan(offer.minLimit) || new Decimal(amount).greaterThan(offer.maxLimit)) {
      throw new BadRequestException('Amount out of range');
    }

    const fiatAmount = new Decimal(amount).mul(offer.price).toNumber();
    const buyerId = offer.type === 'SELL' ? userId : offer.userId;
    const sellerId = offer.type === 'SELL' ? offer.userId : userId;

    // ESCROW: Lock seller's funds
    const sellerWallet = await this.prisma.wallet.findFirst({
      where: { userId: sellerId, asset: offer.asset, accountType: 'FUNDING' },
    });

    if (!sellerWallet || new Decimal(sellerWallet.balance).lessThan(amount)) {
      throw new BadRequestException('Seller has insufficient balance');
    }

    // Use transaction to ensure atomicity
    return this.prisma.$transaction(async (tx) => {
      // Lock seller's funds (move from balance to lockedBalance)
      await tx.wallet.update({
        where: { id: sellerWallet.id },
        data: {
          balance: { decrement: amount },
          lockedBalance: { increment: amount },
        },
      });

      // Create the trade
      const trade = await tx.p2PTrade.create({
        data: {
          offerId,
          buyerId,
          sellerId,
          amount,
          fiatAmount,
          price: offer.price,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      });

      // Create notifications
      await tx.notification.createMany({
        data: [
          {
            userId: buyerId,
            type: 'P2P_TRADE',
            title: 'New Trade Started',
            message: `Trade #${trade.id.slice(0, 8)} started for ${amount} ${offer.asset}`,
          },
          {
            userId: sellerId,
            type: 'P2P_TRADE',
            title: 'New Trade Started',
            message: `Trade #${trade.id.slice(0, 8)} started. ${amount} ${offer.asset} locked in escrow.`,
          },
        ],
      });

      return trade;
    });
  }

  async resolveDispute(tradeId: string, userId: string, resolution: 'buyer_wins' | 'seller_wins') {
    const trade = await this.prisma.p2PTrade.findUnique({ 
      where: { id: tradeId },
      include: { offer: true },
    });
    if (!trade) throw new NotFoundException('Trade not found');
    if (trade.buyerId !== userId && trade.sellerId !== userId) {
      throw new BadRequestException('Not authorized');
    }
    if (trade.status !== 'DISPUTED') {
      throw new BadRequestException('Trade is not in dispute status');
    }

    return this.prisma.$transaction(async (tx) => {
      // Update trade status
      const updatedTrade = await tx.p2PTrade.update({
        where: { id: tradeId },
        data: {
          status: 'RESOLVED',
          disputeResult: resolution,
        },
      });

      if (resolution === 'buyer_wins') {
        // BUYER WINS: Release locked funds from seller TO buyer
        await tx.wallet.updateMany({
          where: { userId: trade.sellerId, asset: trade.offer.asset, accountType: 'FUNDING' },
          data: { lockedBalance: { decrement: Number(trade.amount) } },
        });

        let buyerWallet = await tx.wallet.findFirst({
          where: { userId: trade.buyerId, asset: trade.offer.asset, accountType: 'SPOT' },
        });

        if (!buyerWallet) {
          buyerWallet = await tx.wallet.create({
            data: {
              userId: trade.buyerId,
              asset: trade.offer.asset,
              network: 'TRC20',
              accountType: 'SPOT',
              balance: 0,
              lockedBalance: 0,
            },
          });
        }

        await tx.wallet.update({
          where: { id: buyerWallet.id },
          data: { balance: { increment: Number(trade.amount) } },
        });
      } else {
        // SELLER WINS: Refund locked funds BACK to seller's balance
        await tx.wallet.updateMany({
          where: { userId: trade.sellerId, asset: trade.offer.asset, accountType: 'FUNDING' },
          data: { 
            balance: { increment: Number(trade.amount) },
            lockedBalance: { decrement: Number(trade.amount) },
          },
        });
      }

      // Create notifications
      await tx.notification.createMany({
        data: [
          {
            userId: trade.buyerId,
            type: 'P2P_TRADE',
            title: resolution === 'buyer_wins' ? 'Dispute Resolved - You Won' : 'Dispute Resolved',
            message: `Trade #${tradeId.slice(0, 8)} dispute has been resolved.`,
          },
          {
            userId: trade.sellerId,
            type: 'P2P_TRADE',
            title: resolution === 'seller_wins' ? 'Dispute Resolved - You Won' : 'Dispute Resolved',
            message: `Trade #${tradeId.slice(0, 8)} dispute has been resolved.`,
          },
        ],
      });

      return updatedTrade;
    });
  }

  async getTradeById(id: string) {
    return this.prisma.p2PTrade.findUnique({
      where: { id },
      include: { offer: true, messages: { orderBy: { createdAt: 'asc' } } },
    });
  }

  async getActiveTrades(userId: string) {
    return this.prisma.p2PTrade.findMany({
      where: {
        OR: [{ buyerId: userId }, { sellerId: userId }],
        status: { in: ['WAITING_PAYMENT', 'PAID'] },
      },
      include: { offer: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async confirmPayment(tradeId: string, userId: string) {
    const trade = await this.prisma.p2PTrade.findUnique({ where: { id: tradeId } });
    if (!trade || trade.buyerId !== userId) throw new BadRequestException('Invalid action');
    return this.prisma.p2PTrade.update({
      where: { id: tradeId },
      data: { status: 'PAID', paidAt: new Date() },
    });
  }

  async releaseCrypto(tradeId: string, userId: string) {
    const trade = await this.prisma.p2PTrade.findUnique({
      where: { id: tradeId },
      include: { offer: true },
    });
    if (!trade || trade.sellerId !== userId) throw new BadRequestException('Invalid action');
    if (trade.status !== 'PAID') throw new BadRequestException('Payment not confirmed yet');

    // ESCROW: Release funds from seller's locked balance to buyer's wallet
    return this.prisma.$transaction(async (tx) => {
      // Reduce seller's locked balance
      await tx.wallet.updateMany({
        where: { userId: trade.sellerId, asset: trade.offer.asset, accountType: 'FUNDING' },
        data: { lockedBalance: { decrement: Number(trade.amount) } },
      });

      // Find or create buyer's wallet
      let buyerWallet = await tx.wallet.findFirst({
        where: { userId: trade.buyerId, asset: trade.offer.asset, accountType: 'SPOT' },
      });

      if (!buyerWallet) {
        buyerWallet = await tx.wallet.create({
          data: {
            userId: trade.buyerId,
            asset: trade.offer.asset,
            network: 'TRC20',
            accountType: 'SPOT',
            balance: 0,
            lockedBalance: 0,
          },
        });
      }

      // Credit buyer's wallet
      await tx.wallet.update({
        where: { id: buyerWallet.id },
        data: { balance: { increment: Number(trade.amount) } },
      });

      // Update trade status
      const updatedTrade = await tx.p2PTrade.update({
        where: { id: tradeId },
        data: { status: 'COMPLETED', releasedAt: new Date() },
      });

      // Create transaction records
      await tx.transaction.createMany({
        data: [
          {
            userId: trade.sellerId,
            type: 'P2P_SELL',
            asset: trade.offer.asset,
            amount: Number(trade.amount),
            status: 'COMPLETED',
          },
          {
            userId: trade.buyerId,
            type: 'P2P_BUY',
            asset: trade.offer.asset,
            amount: Number(trade.amount),
            status: 'COMPLETED',
          },
        ],
      });

      // Create notifications
      await tx.notification.createMany({
        data: [
          {
            userId: trade.buyerId,
            type: 'P2P_TRADE',
            title: 'Trade Completed',
            message: `You received ${trade.amount} ${trade.offer.asset} from trade #${tradeId.slice(0, 8)}`,
          },
          {
            userId: trade.sellerId,
            type: 'P2P_TRADE',
            title: 'Trade Completed',
            message: `You sold ${trade.amount} ${trade.offer.asset} in trade #${tradeId.slice(0, 8)}`,
          },
        ],
      });

      return updatedTrade;
    });
  }

  async cancelTrade(tradeId: string, userId: string, reason?: string) {
    const trade = await this.prisma.p2PTrade.findUnique({
      where: { id: tradeId },
      include: { offer: true },
    });

    if (!trade) throw new NotFoundException('Trade not found');
    if (trade.buyerId !== userId && trade.sellerId !== userId) {
      throw new BadRequestException('Not authorized');
    }
    if (!['WAITING_PAYMENT', 'PAID'].includes(trade.status)) {
      throw new BadRequestException('Trade cannot be cancelled');
    }

    // ESCROW: Refund seller's locked balance
    return this.prisma.$transaction(async (tx) => {
      // Return funds to seller's balance from locked
      await tx.wallet.updateMany({
        where: { userId: trade.sellerId, asset: trade.offer.asset, accountType: 'FUNDING' },
        data: {
          balance: { increment: Number(trade.amount) },
          lockedBalance: { decrement: Number(trade.amount) },
        },
      });

      // Update trade status
      const updatedTrade = await tx.p2PTrade.update({
        where: { id: tradeId },
        data: {
          status: 'CANCELLED',
          disputeReason: reason,
        },
      });

      // Create notifications
      await tx.notification.createMany({
        data: [
          {
            userId: trade.buyerId,
            type: 'P2P_TRADE',
            title: 'Trade Cancelled',
            message: `Trade #${tradeId.slice(0, 8)} has been cancelled${reason ? `: ${reason}` : ''}`,
          },
          {
            userId: trade.sellerId,
            type: 'P2P_TRADE',
            title: 'Trade Cancelled - Funds Released',
            message: `Trade #${tradeId.slice(0, 8)} cancelled. ${trade.amount} ${trade.offer.asset} returned to your wallet.`,
          },
        ],
      });

      return updatedTrade;
    });
  }

  async openDispute(tradeId: string, userId: string, reason: string) {
    const trade = await this.prisma.p2PTrade.findUnique({ where: { id: tradeId } });
    if (!trade) throw new NotFoundException('Trade not found');
    if (trade.buyerId !== userId && trade.sellerId !== userId) {
      throw new BadRequestException('Not authorized');
    }
    if (!['WAITING_PAYMENT', 'PAID'].includes(trade.status)) {
      throw new BadRequestException('Cannot dispute this trade');
    }

    return this.prisma.p2PTrade.update({
      where: { id: tradeId },
      data: { status: 'DISPUTED', disputeReason: reason },
    });
  }

  async sendMessage(tradeId: string, senderId: string, text: string) {
    return this.prisma.p2PMessage.create({
      data: { tradeId, senderId, text },
    });
  }

  async getMessages(tradeId: string) {
    return this.prisma.p2PMessage.findMany({
      where: { tradeId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getTradeHistory(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const where = {
      OR: [{ buyerId: userId }, { sellerId: userId }],
      status: { in: ['COMPLETED', 'CANCELLED', 'RESOLVED'] as any },
    };

    const [items, total] = await Promise.all([
      this.prisma.p2PTrade.findMany({
        where,
        include: { offer: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.p2PTrade.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getPaymentMethods(userId: string) {
    return this.prisma.paymentMethod.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addPaymentMethod(userId: string, method: string, details: Record<string, string>) {
    return this.prisma.paymentMethod.create({
      data: { userId, method, details },
    });
  }

  async deletePaymentMethod(userId: string, id: string) {
    const pm = await this.prisma.paymentMethod.findFirst({ where: { id, userId } });
    if (!pm) throw new NotFoundException('Payment method not found');
    await this.prisma.paymentMethod.delete({ where: { id } });
    return { message: 'Payment method deleted' };
  }
}
