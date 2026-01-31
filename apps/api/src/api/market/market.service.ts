import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../infrastructure/cache/redis.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class MarketService {
  private binanceUrl: string;

  constructor(
    private configService: ConfigService,
    private redis: RedisService,
    private prisma: PrismaService,
  ) {
    this.binanceUrl = this.configService.get('BINANCE_API_URL', 'https://api.binance.com/api/v3');
  }

  async getMarketCoins() {
    const cached = await this.redis.cacheGet<any[]>('market', 'coins');
    if (cached) return cached;

    try {
      const response = await fetch(`${this.binanceUrl}/ticker/24hr`);
      const data = await response.json();

      const symbolMap: Record<string, string> = {
        'BTCUSDT': 'btc', 'ETHUSDT': 'eth', 'BNBUSDT': 'bnb',
        'SOLUSDT': 'sol', 'XRPUSDT': 'xrp', 'ADAUSDT': 'ada',
      };

      const coins = data
        .filter((t: any) => symbolMap[t.symbol])
        .map((t: any) => ({
          id: symbolMap[t.symbol],
          symbol: t.symbol.replace('USDT', ''),
          price: parseFloat(t.lastPrice),
          change24h: parseFloat(t.priceChangePercent),
          volume24h: parseFloat(t.quoteVolume),
        }));

      // Add USDT
      coins.push({ id: 'usdt', symbol: 'USDT', price: 1.00, change24h: 0, volume24h: 0 });

      await this.redis.cacheSet('market', 'coins', coins, 60);
      return coins;
    } catch {
      return [];
    }
  }

  async getCoinById(id: string) {
    const coins = await this.getMarketCoins();
    return coins.find((c: any) => c.id === id);
  }

  async getLivePrices(symbols: string[]) {
    const prices: Record<string, any> = {};
    const coins = await this.getMarketCoins();
    
    for (const symbol of symbols) {
      const coin = coins.find((c: any) => c.symbol === symbol);
      if (coin) {
        prices[symbol] = { price: coin.price, change24h: coin.change24h };
      }
    }
    
    return prices;
  }

  // ========== PRICE ALERTS ==========

  async getPriceAlerts(userId: string) {
    return this.prisma.priceAlert.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPriceAlert(userId: string, data: { assetSymbol: string; targetPrice: number; condition: string }) {
    return this.prisma.priceAlert.create({
      data: { userId, assetSymbol: data.assetSymbol, targetPrice: data.targetPrice, condition: data.condition },
    });
  }

  async deletePriceAlert(id: string, userId: string) {
    return this.prisma.priceAlert.deleteMany({ where: { id, userId } });
  }

  async checkPriceAlerts() {
    const coins = await this.getMarketCoins();
    const alerts = await this.prisma.priceAlert.findMany({
      where: { isTriggered: false, isActive: true },
      include: { user: { select: { id: true, name: true } } },
    });

    const triggered: any[] = [];

    for (const alert of alerts) {
      const coin = coins.find((c: any) => c.symbol === alert.assetSymbol);
      if (!coin) continue;

      const shouldTrigger = 
        (alert.condition === 'ABOVE' && coin.price >= Number(alert.targetPrice)) ||
        (alert.condition === 'BELOW' && coin.price <= Number(alert.targetPrice));

      if (shouldTrigger) {
        await this.prisma.priceAlert.update({
          where: { id: alert.id },
          data: { isTriggered: true, triggeredAt: new Date() },
        });
        triggered.push({ ...alert, currentPrice: coin.price });
      }
    }

    return triggered;
  }
}
