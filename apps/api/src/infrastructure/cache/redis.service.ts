import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis | null = null;
  private memoryCache: Map<string, { value: string; expiry: number }> = new Map();
  private readonly logger = new Logger(RedisService.name);
  private useMemoryFallback = false;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const redisEnabled = this.configService.get('REDIS_ENABLED', 'true') === 'true';
    
    if (!redisEnabled) {
      this.useMemoryFallback = true;
      this.logger.warn('Redis disabled - using in-memory cache (dev mode only)');
      return;
    }

    try {
      this.client = new Redis({
        host: this.configService.get('REDIS_HOST', 'localhost'),
        port: this.configService.get('REDIS_PORT', 6379),
        password: this.configService.get('REDIS_PASSWORD') || undefined,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });

      await this.client.connect();
      this.logger.log('Redis connected');

      this.client.on('error', (err) => {
        this.logger.error('Redis error:', err);
      });
    } catch (error) {
      this.logger.warn('Redis connection failed - using in-memory cache fallback');
      this.useMemoryFallback = true;
      this.client = null;
    }
  }

  async onModuleDestroy() {
    await this.client?.quit();
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.useMemoryFallback) {
      this.memoryCache.set(key, { value, expiry: ttlSeconds ? Date.now() + ttlSeconds * 1000 : Infinity });
    } else if (this.client) {
      if (ttlSeconds) {
        await this.client.set(key, value, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, value);
      }
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.useMemoryFallback) {
      const cached = this.memoryCache.get(key);
      if (cached && cached.expiry > Date.now()) {
        return cached.value;
      }
      this.memoryCache.delete(key);
      return null;
    }
    return this.client ? this.client.get(key) : null;
  }

  async del(key: string): Promise<void> {
    if (this.useMemoryFallback) {
      this.memoryCache.delete(key);
    } else if (this.client) {
      await this.client.del(key);
    }
  }

  async exists(key: string): Promise<boolean> {
    if (this.useMemoryFallback) {
      const cached = this.memoryCache.get(key);
      return cached ? cached.expiry > Date.now() : false;
    }
    if (!this.client) return false;
    const result = await this.client.exists(key);
    return result === 1;
  }

  // JSON operations
  async getJson<T>(key: string): Promise<T | null> {
    const data = await this.get(key);
    return data ? JSON.parse(data) : null;
  }

  async setJson<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlSeconds);
  }

  // Session management
  async setSession(userId: string, sessionId: string, data: any, ttlSeconds: number = 604800): Promise<void> {
    const key = `session:${userId}:${sessionId}`;
    await this.setJson(key, data, ttlSeconds);
  }

  async getSession(userId: string, sessionId: string): Promise<any> {
    const key = `session:${userId}:${sessionId}`;
    return this.getJson(key);
  }

  async deleteSession(userId: string, sessionId: string): Promise<void> {
    const key = `session:${userId}:${sessionId}`;
    await this.del(key);
  }

  async deleteAllUserSessions(userId: string): Promise<void> {
    if (this.useMemoryFallback) {
      const prefix = `session:${userId}:`;
      for (const key of this.memoryCache.keys()) {
        if (key.startsWith(prefix)) this.memoryCache.delete(key);
      }
    } else if (this.client) {
      const pattern = `session:${userId}:*`;
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) await this.client.del(...keys);
    }
  }

  // Rate limiting
  async incrementRateLimit(key: string, ttlSeconds: number): Promise<number> {
    if (this.useMemoryFallback) {
      const cached = this.memoryCache.get(key);
      const count = cached ? parseInt(cached.value) + 1 : 1;
      this.memoryCache.set(key, { value: String(count), expiry: Date.now() + ttlSeconds * 1000 });
      return count;
    }
    if (!this.client) return 0;
    const multi = this.client.multi();
    multi.incr(key);
    multi.expire(key, ttlSeconds);
    const results = await multi.exec();
    return results ? (results[0][1] as number) : 0;
  }

  // Cache with prefix
  async cacheGet<T>(prefix: string, id: string): Promise<T | null> {
    return this.getJson<T>(`cache:${prefix}:${id}`);
  }

  async cacheSet<T>(prefix: string, id: string, data: T, ttlSeconds: number = 300): Promise<void> {
    await this.setJson(`cache:${prefix}:${id}`, data, ttlSeconds);
  }

  async cacheInvalidate(prefix: string, id?: string): Promise<void> {
    if (id) {
      await this.del(`cache:${prefix}:${id}`);
    } else if (this.useMemoryFallback) {
      const pattern = `cache:${prefix}:`;
      for (const key of this.memoryCache.keys()) {
        if (key.startsWith(pattern)) this.memoryCache.delete(key);
      }
    } else if (this.client) {
      const keys = await this.client.keys(`cache:${prefix}:*`);
      if (keys.length > 0) await this.client.del(...keys);
    }
  }

  // Health check
  async isHealthy(): Promise<boolean> {
    if (this.useMemoryFallback) return true;
    try {
      if (!this.client) return false;
      await this.client.ping();
      return true;
    } catch {
      return false;
    }
  }
}
