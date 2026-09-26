// In-memory TTL cache to minimize expensive commercial map provider calls

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class MapServiceCache {
  private cache = new Map<string, CacheEntry<any>>();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlSeconds: number = 3600): void {
    // Keep cache bounded
    if (this.cache.size > 2000) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

export const mapCache = new MapServiceCache();
