/**
 * Cache Service - Client-side caching for performance
 * 
 * Features:
 * - Memory cache with TTL
 * - LocalStorage persistence
 * - Stale-while-revalidate strategy
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CacheService {
  private memoryCache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get cached data
   */
  get<T>(key: string): T | null {
    // Check memory cache first
    const memEntry = this.memoryCache.get(key);
    if (memEntry && !this.isExpired(memEntry)) {
      return memEntry.data as T;
    }

    // Check localStorage
    try {
      const stored = localStorage.getItem(`cache:${key}`);
      if (stored) {
        const entry: CacheEntry<T> = JSON.parse(stored);
        if (!this.isExpired(entry)) {
          // Restore to memory cache
          this.memoryCache.set(key, entry);
          return entry.data;
        }
        // Clean up expired
        localStorage.removeItem(`cache:${key}`);
      }
    } catch {
      // Silent fail
    }

    return null;
  }

  /**
   * Set cache data
   */
  set<T>(key: string, data: T, ttlMs: number = this.DEFAULT_TTL, persist: boolean = false): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    };

    this.memoryCache.set(key, entry);

    if (persist) {
      try {
        localStorage.setItem(`cache:${key}`, JSON.stringify(entry));
      } catch {
        // Storage full or not available
      }
    }
  }

  /**
   * Delete cache entry
   */
  delete(key: string): void {
    this.memoryCache.delete(key);
    try {
      localStorage.removeItem(`cache:${key}`);
    } catch {
      // Silent fail
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.memoryCache.clear();
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('cache:'));
      keys.forEach(k => localStorage.removeItem(k));
    } catch {
      // Silent fail
    }
  }

  /**
   * Get stale data while fetching fresh
   */
  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: { ttl?: number; persist?: boolean; staleWhileRevalidate?: boolean } = {}
  ): Promise<T> {
    const { ttl = this.DEFAULT_TTL, persist = false, staleWhileRevalidate = true } = options;

    const cached = this.get<T>(key);

    if (cached !== null) {
      if (staleWhileRevalidate) {
        // Return cached immediately, refresh in background
        fetcher().then(fresh => this.set(key, fresh, ttl, persist)).catch(() => {});
      }
      return cached;
    }

    // No cache, must fetch
    const fresh = await fetcher();
    this.set(key, fresh, ttl, persist);
    return fresh;
  }

  /**
   * Invalidate cache by pattern
   */
  invalidatePattern(pattern: string): void {
    // Memory cache
    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern)) {
        this.memoryCache.delete(key);
      }
    }

    // LocalStorage
    try {
      const keys = Object.keys(localStorage).filter(k => 
        k.startsWith('cache:') && k.includes(pattern)
      );
      keys.forEach(k => localStorage.removeItem(k));
    } catch {
      // Silent fail
    }
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }
}

export const cacheService = new CacheService();
export default cacheService;
