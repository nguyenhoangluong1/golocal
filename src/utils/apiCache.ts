/**
 * Simple in-memory cache for API responses
 * Helps reduce redundant API calls and improve performance
 */

interface CacheEntry {
  data: any;
  timestamp: number;
  expiresAt: number;
}

class APICache {
  private cache: Map<string, CacheEntry> = new Map();
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutes default

  /**
   * Get cached data if it exists and hasn't expired
   */
  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set cache entry with optional TTL
   */
  set(key: string, data: any, ttl?: number): void {
    const now = Date.now();
    const expiresAt = now + (ttl || this.defaultTTL);

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt,
    });
  }

  /**
   * Remove specific cache entry
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Generate cache key from request config
   */
  generateKey(url: string, params?: any): string {
    const paramsStr = params ? JSON.stringify(params) : '';
    return `${url}${paramsStr}`;
  }

  /**
   * Clean expired entries (call periodically)
   */
  cleanExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// Singleton instance
export const apiCache = new APICache();

// Clean expired entries every 10 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    apiCache.cleanExpired();
  }, 10 * 60 * 1000);
}

