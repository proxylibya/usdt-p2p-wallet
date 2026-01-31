import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { RedisService } from '../../infrastructure/cache/redis.service';

export interface SwapQuote {
  fromAsset: string;
  toAsset: string;
  fromAmount: number;
  toAmount: number;
  rate: number;
  fee: number;
  feePercentage: number;
  expiresAt: Date;
  quoteId: string;
}

@Injectable()
export class SwapService {
  private readonly logger = new Logger(SwapService.name);
  private readonly FEE_PERCENTAGE = 0.5; // 0.5% swap fee

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private configService: ConfigService,
  ) {}

  async getSupportedPairs() {
    return [
      { from: 'USDT', to: 'USDC', minAmount: 10, maxAmount: 100000 },
      { from: 'USDC', to: 'USDT', minAmount: 10, maxAmount: 100000 },
      { from: 'USDT', to: 'BTC', minAmount: 10, maxAmount: 50000 },
      { from: 'BTC', to: 'USDT', minAmount: 0.0001, maxAmount: 10 },
      { from: 'USDT', to: 'ETH', minAmount: 10, maxAmount: 50000 },
      { from: 'ETH', to: 'USDT', minAmount: 0.01, maxAmount: 100 },
    ];
  }

  async getQuote(fromAsset: string, toAsset: string, fromAmount: number): Promise<SwapQuote> {
    if (fromAmount <= 0) throw new BadRequestException('Amount must be positive');

    const rate = await this.getExchangeRate(fromAsset, toAsset);
    const grossAmount = fromAmount * rate;
    const fee = grossAmount * (this.FEE_PERCENTAGE / 100);
    const toAmount = grossAmount - fee;

    const quoteId = `swap_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const expiresAt = new Date(Date.now() + 30 * 1000); // 30 seconds

    const quote: SwapQuote = {
      fromAsset,
      toAsset,
      fromAmount,
      toAmount: Math.round(toAmount * 100000000) / 100000000,
      rate,
      fee: Math.round(fee * 100000000) / 100000000,
      feePercentage: this.FEE_PERCENTAGE,
      expiresAt,
      quoteId,
    };

    // Cache quote for 30 seconds
    await this.redis.setJson(`quote:${quoteId}`, quote, 30);

    return quote;
  }

  async executeSwap(userId: string, quoteId: string) {
    // Get cached quote
    const quote = await this.redis.getJson<SwapQuote>(`quote:${quoteId}`);
    if (!quote) throw new BadRequestException('Quote expired or not found');

    // Check if quote is still valid
    if (new Date() > new Date(quote.expiresAt)) {
      throw new BadRequestException('Quote expired');
    }

    // Get user's source wallet
    const fromWallet = await this.prisma.wallet.findFirst({
      where: { userId, asset: quote.fromAsset, accountType: 'SPOT' },
    });

    if (!fromWallet || Number(fromWallet.balance) < quote.fromAmount) {
      throw new BadRequestException('Insufficient balance');
    }

    // Execute swap atomically with race condition protection
    return this.prisma.$transaction(async (tx) => {
      // Deduct from source wallet with atomic balance check
      const updateResult = await tx.wallet.updateMany({
        where: { 
          id: fromWallet.id,
          balance: { gte: quote.fromAmount }
        },
        data: { balance: { decrement: quote.fromAmount } },
      });

      if (updateResult.count === 0) {
        throw new BadRequestException('Insufficient balance');
      }

      // Find or create destination wallet
      let toWallet = await tx.wallet.findFirst({
        where: { userId, asset: quote.toAsset, accountType: 'SPOT' },
      });

      if (!toWallet) {
        toWallet = await tx.wallet.create({
          data: {
            userId,
            asset: quote.toAsset,
            network: this.getDefaultNetwork(quote.toAsset),
            accountType: 'SPOT',
            balance: 0,
            lockedBalance: 0,
          },
        });
      }

      // Credit destination wallet
      await tx.wallet.update({
        where: { id: toWallet.id },
        data: { balance: { increment: quote.toAmount } },
      });

      // Create transaction records
      // Create SWAP_OUT transaction (from source)
      const swapOutTx = await tx.transaction.create({
        data: {
          userId,
          type: 'SWAP_OUT',
          asset: quote.fromAsset,
          amount: quote.fromAmount,
          fee: quote.fee,
          status: 'COMPLETED',
          metadata: {
            quoteId,
            fromAsset: quote.fromAsset,
            toAsset: quote.toAsset,
            fromAmount: quote.fromAmount,
            toAmount: quote.toAmount,
            rate: quote.rate,
          },
        },
      });

      // Create SWAP_IN transaction (to destination)
      await tx.transaction.create({
        data: {
          userId,
          type: 'SWAP_IN',
          asset: quote.toAsset,
          amount: quote.toAmount,
          status: 'COMPLETED',
          metadata: {
            quoteId,
            linkedTxId: swapOutTx.id,
          },
        },
      });

      // Create notification
      await tx.notification.create({
        data: {
          userId,
          type: 'TRANSACTION',
          title: 'Swap Completed',
          message: `Swapped ${quote.fromAmount} ${quote.fromAsset} to ${quote.toAmount} ${quote.toAsset}`,
        },
      });

      // Delete used quote
      await this.redis.del(`quote:${quoteId}`);

      return {
        success: true,
        transactionId: swapOutTx.id,
        fromAsset: quote.fromAsset,
        toAsset: quote.toAsset,
        fromAmount: quote.fromAmount,
        toAmount: quote.toAmount,
        fee: quote.fee,
      };
    });
  }

  async getSwapHistory(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { userId, type: { in: ['SWAP_IN', 'SWAP_OUT'] } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({ where: { userId, type: { in: ['SWAP_IN', 'SWAP_OUT'] } } }),
    ]);

    return { items, total, page, limit };
  }

  private async getExchangeRate(fromAsset: string, toAsset: string): Promise<number> {
    // Try to get from cache
    const cacheKey = `rate:${fromAsset}:${toAsset}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return parseFloat(cached);

    // Fetch live rates from market service or external API
    try {
      const prices = await this.fetchLivePrices([fromAsset, toAsset]);
      const fromPrice = prices[fromAsset] || 1;
      const toPrice = prices[toAsset] || 1;
      const rate = fromPrice / toPrice;

      // Cache for 10 seconds
      await this.redis.set(cacheKey, rate.toString(), 10);
      return rate;
    } catch (error) {
      this.logger.error(`Failed to fetch exchange rate: ${error.message}`);
      // Fallback to hardcoded rates for stablecoins
      return this.getFallbackRate(fromAsset, toAsset);
    }
  }

  private async fetchLivePrices(assets: string[]): Promise<Record<string, number>> {
    const prices: Record<string, number> = {};

    try {
      const binanceUrl = this.configService.get('BINANCE_API_URL', 'https://api.binance.com/api/v3');
      const response = await fetch(`${binanceUrl}/ticker/price`);
      const data = await response.json();

      for (const asset of assets) {
        if (asset === 'USDT') {
          prices[asset] = 1;
        } else {
          const ticker = data.find((t: any) => t.symbol === `${asset}USDT`);
          if (ticker) prices[asset] = parseFloat(ticker.price);
        }
      }
    } catch (error) {
      this.logger.warn('Failed to fetch Binance prices, using fallback');
    }

    return prices;
  }

  private getFallbackRate(fromAsset: string, toAsset: string): number {
    const stablecoins = ['USDT', 'USDC', 'BUSD', 'DAI'];
    if (stablecoins.includes(fromAsset) && stablecoins.includes(toAsset)) {
      return 1; // 1:1 for stablecoins
    }
    throw new BadRequestException('Unable to get exchange rate');
  }

  private getDefaultNetwork(asset: string): string {
    const networks: Record<string, string> = {
      USDT: 'TRC20',
      USDC: 'ERC20',
      BTC: 'BTC',
      ETH: 'ERC20',
    };
    return networks[asset] || 'ERC20';
  }
}
