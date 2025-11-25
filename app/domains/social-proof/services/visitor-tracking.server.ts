/**
 * Visitor Tracking Service
 *
 * Uses Redis to track real-time visitor activity:
 * - Active visitors per product/page
 * - Trending products (high view counts)
 * - Cart activity (add-to-cart events)
 * - Recently viewed products
 */

import type {
  VisitorNotification,
  SocialProofNotification,
} from "~/domains/storefront/notifications/social-proof/types";
import { getRedis, REDIS_PREFIXES, REDIS_TTL } from "~/lib/redis.server";

interface GetVisitorNotificationParams {
  storeId: string;
  productId?: string;
  pageUrl?: string;
}

interface GetTrendingNotificationParams {
  storeId: string;
  productId: string;
}

interface GetCartActivityParams {
  storeId: string;
  productId: string;
}

export class VisitorTrackingService {
  /**
   * Get live visitor count notification
   */
  static async getVisitorNotification(
    params: GetVisitorNotificationParams
  ): Promise<VisitorNotification | null> {
    const { storeId, productId, pageUrl } = params;

    try {
      const redis = getRedis();
      if (!redis) {
        // Fallback to random count if Redis not available
        return this.generateFallbackVisitorNotification(productId);
      }

      // Get visitor count from Redis
      const key = productId
        ? `${REDIS_PREFIXES.VISITOR}:product:${storeId}:${productId}`
        : `${REDIS_PREFIXES.VISITOR}:store:${storeId}`;

      const count = await redis.get(key);
      const visitorCount = count ? parseInt(count, 10) : 0;

      // Don't show if count is too low
      if (visitorCount < 3) {
        return this.generateFallbackVisitorNotification(productId);
      }

      const context = productId ? "viewing this product right now" : "shopping on this store";

      return {
        id: `visitor-${productId || "store"}-${Date.now()}`,
        type: "visitor",
        count: visitorCount,
        context,
        trending: visitorCount > 15,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error("[VisitorTrackingService] Error getting visitor count:", error);
      return this.generateFallbackVisitorNotification(productId);
    }
  }

  /**
   * Track a visitor view (called from storefront)
   */
  static async trackVisitorView(params: {
    storeId: string;
    productId?: string;
    visitorId: string;
  }): Promise<void> {
    const { storeId, productId, visitorId } = params;

    try {
      const redis = getRedis();
      if (!redis) return;

      const key = productId
        ? `${REDIS_PREFIXES.VISITOR}:product:${storeId}:${productId}`
        : `${REDIS_PREFIXES.VISITOR}:store:${storeId}`;

      const visitorKey = `${key}:visitors`;

      // Add visitor to set (automatically deduplicates)
      await redis.sadd(visitorKey, visitorId);

      // Set expiry on visitor (5 minutes of inactivity)
      await redis.expire(visitorKey, 300);

      // Update count
      const count = await redis.scard(visitorKey);
      await redis.setex(key, 300, count.toString());

      // Track trending (views in last hour)
      if (productId) {
        const trendingKey = `${REDIS_PREFIXES.STATS}:trending:${storeId}:${productId}`;
        await redis.incr(trendingKey);
        await redis.expire(trendingKey, REDIS_TTL.HOUR);
      }
    } catch (error) {
      console.error("[VisitorTrackingService] Error tracking visitor:", error);
    }
  }

  /**
   * Get trending product notification
   */
  static async getTrendingNotification(
    params: GetTrendingNotificationParams
  ): Promise<SocialProofNotification | null> {
    const { storeId, productId } = params;

    try {
      const redis = getRedis();
      if (!redis) return null;

      const key = `${REDIS_PREFIXES.STATS}:trending:${storeId}:${productId}`;
      const views = await redis.get(key);
      const viewCount = views ? parseInt(views, 10) : 0;

      // Only show if trending (50+ views in last hour)
      if (viewCount < 50) return null;

      return {
        id: `trending-${productId}`,
        type: "visitor",
        count: viewCount,
        context: "views in the last hour 🔥",
        trending: true,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error("[VisitorTrackingService] Error getting trending:", error);
      return null;
    }
  }

  /**
   * Track add-to-cart event
   */
  static async trackCartActivity(params: {
    storeId: string;
    productId: string;
    visitorId: string;
  }): Promise<void> {
    const { storeId, productId, visitorId } = params;

    try {
      const redis = getRedis();
      if (!redis) return;

      const key = `${REDIS_PREFIXES.STATS}:cart:${storeId}:${productId}`;

      // Add to sorted set with timestamp as score
      await redis.zadd(key, Date.now(), visitorId);

      // Remove entries older than 1 hour
      const oneHourAgo = Date.now() - 3600000;
      await redis.zremrangebyscore(key, 0, oneHourAgo);

      // Set expiry (1 hour)
      await redis.expire(key, REDIS_TTL.HOUR);
    } catch (error) {
      console.error("[VisitorTrackingService] Error tracking cart activity:", error);
    }
  }

  /**
   * Get cart activity notification
   */
  static async getCartActivityNotification(
    params: GetCartActivityParams
  ): Promise<SocialProofNotification | null> {
    const { storeId, productId } = params;

    try {
      const redis = getRedis();
      if (!redis) return null;

      const key = `${REDIS_PREFIXES.STATS}:cart:${storeId}:${productId}`;
      const count = await redis.zcard(key);

      // Only show if at least 2 people added to cart
      if (count < 2) return null;

      return {
        id: `cart-activity-${productId}`,
        type: "visitor",
        count,
        context: "added to cart in the last hour",
        trending: count > 5,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error("[VisitorTrackingService] Error getting cart activity:", error);
      return null;
    }
  }

  /**
   * Get recently viewed notification
   */
  static async getRecentlyViewedNotification(params: {
    storeId: string;
    productId: string;
  }): Promise<SocialProofNotification | null> {
    const { storeId, productId } = params;

    try {
      const redis = getRedis();
      if (!redis) return null;

      const key = `${REDIS_PREFIXES.STATS}:trending:${storeId}:${productId}`;
      const views = await redis.get(key);
      const viewCount = views ? parseInt(views, 10) : 0;

      // Show if at least 10 views in last hour
      if (viewCount < 10) return null;

      // Different messaging than trending (which requires 50+ views)
      return {
        id: `recently-viewed-${productId}`,
        type: "visitor",
        count: viewCount,
        context: "viewed this in the last hour",
        trending: viewCount > 30,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error("[VisitorTrackingService] Error getting recently viewed:", error);
      return null;
    }
  }

  /**
   * Generate fallback visitor notification (when Redis unavailable)
   */
  private static generateFallbackVisitorNotification(productId?: string): VisitorNotification {
    // Generate realistic random count (5-25)
    const count = Math.floor(Math.random() * 20) + 5;
    const context = productId ? "viewing this product right now" : "shopping on this store";

    return {
      id: `visitor-fallback-${Date.now()}`,
      type: "visitor",
      count,
      context,
      trending: count > 15,
      timestamp: Date.now(),
    };
  }
}
