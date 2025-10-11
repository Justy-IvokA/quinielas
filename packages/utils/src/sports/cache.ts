/**
 * Sports API Cache
 * 
 * Sistema de caché en memoria para reducir llamadas a APIs externas.
 * Útil para evitar rate limits y mejorar performance.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export class SportsAPICache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL: number;

  constructor(defaultTTLMinutes: number = 60) {
    this.defaultTTL = defaultTTLMinutes * 60 * 1000; // Convert to ms
  }

  /**
   * Genera una key única para el caché
   */
  private generateKey(provider: string, method: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join("&");
    return `${provider}:${method}:${sortedParams}`;
  }

  /**
   * Obtiene un valor del caché si existe y no ha expirado
   */
  get<T>(provider: string, method: string, params: Record<string, any>): T | null {
    const key = this.generateKey(provider, method, params);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Verificar si expiró
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    console.log(`[Cache] HIT: ${key}`);
    return entry.data as T;
  }

  /**
   * Guarda un valor en el caché
   */
  set<T>(
    provider: string,
    method: string,
    params: Record<string, any>,
    data: T,
    ttlMinutes?: number
  ): void {
    const key = this.generateKey(provider, method, params);
    const ttl = ttlMinutes ? ttlMinutes * 60 * 1000 : this.defaultTTL;

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl
    });

    console.log(`[Cache] SET: ${key} (TTL: ${ttlMinutes || this.defaultTTL / 60000}min)`);
  }

  /**
   * Invalida una entrada específica del caché
   */
  invalidate(provider: string, method: string, params: Record<string, any>): void {
    const key = this.generateKey(provider, method, params);
    this.cache.delete(key);
    console.log(`[Cache] INVALIDATE: ${key}`);
  }

  /**
   * Invalida todas las entradas de un provider
   */
  invalidateProvider(provider: string): void {
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${provider}:`)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(`[Cache] INVALIDATE PROVIDER: ${provider} (${keysToDelete.length} entries)`);
  }

  /**
   * Limpia todas las entradas expiradas
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(`[Cache] CLEANUP: Removed ${keysToDelete.length} expired entries`);
  }

  /**
   * Limpia todo el caché
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`[Cache] CLEAR: Removed ${size} entries`);
  }

  /**
   * Obtiene estadísticas del caché
   */
  getStats() {
    const now = Date.now();
    let activeEntries = 0;
    let expiredEntries = 0;

    for (const entry of this.cache.values()) {
      if (now > entry.expiresAt) {
        expiredEntries++;
      } else {
        activeEntries++;
      }
    }

    return {
      total: this.cache.size,
      active: activeEntries,
      expired: expiredEntries
    };
  }
}

// Singleton instance
export const sportsAPICache = new SportsAPICache(60); // 60 minutos por defecto

// Auto-cleanup cada hora
setInterval(() => {
  sportsAPICache.cleanup();
}, 60 * 60 * 1000);
