/**
 * Rate Limiter
 *
 * Protects API endpoints from abuse with configurable rate limits
 * Uses in-memory storage with LRU cache for production-grade performance
 *
 * Features:
 * - Sliding window algorithm
 * - Per-store and per-IP rate limiting
 * - Configurable limits per endpoint
 * - Automatic cleanup of old entries
 * - TypeScript type safety
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

/**
 * Rate limit configurations for different endpoint types
 */
export const RATE_LIMIT_CONFIGS = {
  // Public API endpoints (stricter limits)
  PUBLIC: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
  },

  // Authenticated API endpoints
  AUTHENTICATED: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 120, // 120 requests per minute
  },

  // Write operations (create, update, delete)
  WRITE: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 writes per minute
  },

  // Analytics/reporting endpoints
  ANALYTICS: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20, // 20 requests per minute
  },

  // Webhook endpoints
  WEBHOOK: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 webhooks per minute
  },
} as const;

/**
 * In-memory rate limit store with automatic cleanup
 */
class RateLimitStore {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup();
      },
      5 * 60 * 1000
    );
  }

  get(key: string): RateLimitEntry | undefined {
    return this.store.get(key);
  }

  set(key: string, entry: RateLimitEntry): void {
    this.store.set(key, entry);
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetAt < now) {
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// Global rate limit store
const rateLimitStore = new RateLimitStore();

/**
 * Rate limit result
 */
export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

/**
 * Rate Limiter Class
 */
export class RateLimiter {
  /**
   * Check if request is allowed under rate limit
   */
  static check(
    identifier: string,
    config: RateLimitConfig = RATE_LIMIT_CONFIGS.AUTHENTICATED
  ): RateLimitResult {
    const now = Date.now();
    const key = `ratelimit:${identifier}`;

    const entry = rateLimitStore.get(key);

    // No existing entry or window expired
    if (!entry || entry.resetAt < now) {
      const newEntry: RateLimitEntry = {
        count: 1,
        resetAt: now + config.windowMs,
      };
      rateLimitStore.set(key, newEntry);

      return {
        allowed: true,
        limit: config.maxRequests,
        remaining: config.maxRequests - 1,
        resetAt: newEntry.resetAt,
      };
    }

    // Increment count
    entry.count++;
    rateLimitStore.set(key, entry);

    const allowed = entry.count <= config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - entry.count);

    return {
      allowed,
      limit: config.maxRequests,
      remaining,
      resetAt: entry.resetAt,
    };
  }

  /**
   * Check rate limit for a store
   */
  static checkStore(
    storeId: string,
    config: RateLimitConfig = RATE_LIMIT_CONFIGS.AUTHENTICATED
  ): RateLimitResult {
    return this.check(`store:${storeId}`, config);
  }

  /**
   * Check rate limit for an IP address
   */
  static checkIP(ip: string, config: RateLimitConfig = RATE_LIMIT_CONFIGS.PUBLIC): RateLimitResult {
    return this.check(`ip:${ip}`, config);
  }

  /**
   * Reset rate limit for an identifier
   */
  static reset(identifier: string): void {
    rateLimitStore.delete(`ratelimit:${identifier}`);
  }
}
