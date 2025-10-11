/**
 * Simple in-memory LRU cache for API responses
 * Used for provider responses and leaderboard aggregations
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class LRUCache<T> {
  private cache: Map<string, CacheEntry<T>>;
  private maxSize: number;
  private defaultTTL: number;

  constructor(maxSize = 100, defaultTTLSeconds = 60) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTLSeconds * 1000;
  }

  set(key: string, value: T, ttlSeconds?: number): void {
    const ttl = ttlSeconds ? ttlSeconds * 1000 : this.defaultTTL;
    const expiresAt = Date.now() + ttl;

    // If cache is full, remove oldest entry
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, { value, expiresAt });
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      return undefined;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    // Move to end (LRU)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
    }
  }

  size(): number {
    return this.cache.size;
  }
}

// Global cache instances
export const providerCache = new LRUCache<any>(50, 60); // 60s TTL for provider responses
export const leaderboardCache = new LRUCache<any>(100, 30); // 30s TTL for leaderboard
export const fixturesCache = new LRUCache<any>(100, 60); // 60s TTL for fixtures

/**
 * Helper to generate cache keys
 */
export function cacheKey(...parts: (string | number | boolean | undefined)[]): string {
  return parts.filter((p) => p !== undefined).join(":");
}

/**
 * Invalidate all caches for a specific pool
 */
export function invalidatePoolCaches(poolId: string): void {
  leaderboardCache.invalidatePattern(`^pool:${poolId}:`);
  fixturesCache.invalidatePattern(`^pool:${poolId}:`);
}

/**
 * Invalidate all caches for a specific season
 */
export function invalidateSeasonCaches(seasonId: string): void {
  fixturesCache.invalidatePattern(`^season:${seasonId}:`);
  providerCache.invalidatePattern(`^season:${seasonId}:`);
}
