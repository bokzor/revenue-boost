/**
import type Redis from 'ioredis';
 * Unit Tests for VisitorTrackingService
 *
 * Tests visitor counting, trending, cart activity, and recently viewed
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VisitorTrackingService } from '~/domains/social-proof/services/visitor-tracking.server';
import { getRedis } from '~/lib/redis.server';
import Redis from "ioredis";

// Mock dependencies
vi.mock('~/lib/redis.server', () => {
  const getRedis = vi.fn();
  const REDIS_PREFIXES = {
    FREQUENCY_CAP: 'freq_cap',
    GLOBAL_FREQUENCY: 'global_freq_cap',
    COOLDOWN: 'cooldown',
    VISITOR: 'visitor',
    PAGE_VIEW: 'pageview',
    STATS: 'stats',
    SESSION: 'session',
  };
  const REDIS_TTL = {
    SESSION: 3600,
    HOUR: 3600,
    DAY: 86400,
    WEEK: 604800,
    MONTH: 2592000,
    VISITOR: 7776000,
  };
  return { getRedis, REDIS_PREFIXES, REDIS_TTL };
});

describe('VisitorTrackingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getVisitorNotification', () => {
    it('should return visitor count notification from Redis', async () => {
      const mockRedis = {
        get: vi.fn().mockResolvedValue('12'),
      };

      vi.mocked(getRedis).mockReturnValue(mockRedis as Partial<Redis> as Redis);

      const result = await VisitorTrackingService.getVisitorNotification({
        storeId: 'test-store',
        productId: 'product-123',
      });

      expect(result).toMatchObject({
        type: 'visitor',
        count: 12,
        context: 'viewing this product right now',
        trending: false,
      });

      expect(mockRedis.get).toHaveBeenCalledWith('visitor:product:test-store:product-123');
    });

    it('should mark as trending if count > 15', async () => {
      const mockRedis = {
        get: vi.fn().mockResolvedValue('20'),
      };

      vi.mocked(getRedis).mockReturnValue(mockRedis as Partial<Redis> as Redis);

      const result = await VisitorTrackingService.getVisitorNotification({
        storeId: 'test-store',
        productId: 'product-123',
      });

      expect(result?.trending).toBe(true);
    });

    it('should return fallback notification if count < 3', async () => {
      const mockRedis = {
        get: vi.fn().mockResolvedValue('2'),
      };

      vi.mocked(getRedis).mockReturnValue(mockRedis as Partial<Redis> as Redis);

      const result = await VisitorTrackingService.getVisitorNotification({
        storeId: 'test-store',
        productId: 'product-123',
      });

      // Should return fallback with random count
      expect(result).toBeDefined();
      expect(result?.count).toBeGreaterThanOrEqual(5);
      expect(result?.count).toBeLessThanOrEqual(25);
    });

    it('should return fallback if Redis unavailable', async () => {
      vi.mocked(getRedis).mockReturnValue(null);

      const result = await VisitorTrackingService.getVisitorNotification({
        storeId: 'test-store',
        productId: 'product-123',
      });

      expect(result).toBeDefined();
      expect(result?.id).toContain('visitor-fallback');
    });
  });

  describe('trackVisitorView', () => {
    it('should track visitor view in Redis', async () => {
      const mockRedis = {
        sadd: vi.fn(),
        expire: vi.fn(),
        scard: vi.fn().mockResolvedValue(5),
        setex: vi.fn(),
        incr: vi.fn(),
      };

      vi.mocked(getRedis).mockReturnValue(mockRedis as Partial<Redis> as Redis);

      await VisitorTrackingService.trackVisitorView({
        storeId: 'test-store',
        productId: 'product-123',
        visitorId: 'visitor-456',
      });

      expect(mockRedis.sadd).toHaveBeenCalledWith(
        'visitor:product:test-store:product-123:visitors',
        'visitor-456'
      );
      expect(mockRedis.expire).toHaveBeenCalled();
      expect(mockRedis.setex).toHaveBeenCalled();
      expect(mockRedis.incr).toHaveBeenCalled(); // Trending tracking
    });

    it('should handle Redis errors gracefully', async () => {
      const mockRedis = {
        sadd: vi.fn().mockRejectedValue(new Error('Redis error')),
      };

      vi.mocked(getRedis).mockReturnValue(mockRedis as Partial<Redis> as Redis);

      // Should not throw
      await expect(
        VisitorTrackingService.trackVisitorView({
          storeId: 'test-store',
          productId: 'product-123',
          visitorId: 'visitor-456',
        })
      ).resolves.not.toThrow();
    });
  });

  describe('getTrendingNotification', () => {
    it('should return trending notification for 50+ views', async () => {
      const mockRedis = {
        get: vi.fn().mockResolvedValue('75'),
      };

      vi.mocked(getRedis).mockReturnValue(mockRedis as Partial<Redis> as Redis);

      const result = await VisitorTrackingService.getTrendingNotification({
        storeId: 'test-store',
        productId: 'product-123',
      });

      expect(result).toMatchObject({
        type: 'visitor',
        count: 75,
        context: 'views in the last hour 🔥',
        trending: true,
      });
    });

    it('should return null if views < 50', async () => {
      const mockRedis = {
        get: vi.fn().mockResolvedValue('30'),
      };

      vi.mocked(getRedis).mockReturnValue(mockRedis as Partial<Redis> as Redis);

      const result = await VisitorTrackingService.getTrendingNotification({
        storeId: 'test-store',
        productId: 'product-123',
      });

      expect(result).toBeNull();
    });
  });

  describe('trackCartActivity', () => {
    it('should track add-to-cart event in Redis', async () => {
      const mockRedis = {
        zadd: vi.fn(),
        zremrangebyscore: vi.fn(),
        expire: vi.fn(),
      };

      vi.mocked(getRedis).mockReturnValue(mockRedis as Partial<Redis> as Redis);

      await VisitorTrackingService.trackCartActivity({
        storeId: 'test-store',
        productId: 'product-123',
        visitorId: 'visitor-456',
      });

      expect(mockRedis.zadd).toHaveBeenCalled();
      expect(mockRedis.zremrangebyscore).toHaveBeenCalled(); // Remove old entries
      expect(mockRedis.expire).toHaveBeenCalled();
    });
  });

  describe('getCartActivityNotification', () => {
    it('should return cart activity notification', async () => {
      const mockRedis = {
        zcard: vi.fn().mockResolvedValue(5),
      };

      vi.mocked(getRedis).mockReturnValue(mockRedis as unknown as Redis);

      const result = await VisitorTrackingService.getCartActivityNotification({
        storeId: 'test-store',
        productId: 'product-123',
      });

      expect(result).toMatchObject({
        type: 'visitor',
        count: 5,
        context: 'added to cart in the last hour',
        trending: false,
      });
    });

    it('should mark as trending if count > 5', async () => {
      const mockRedis = {
        zcard: vi.fn().mockResolvedValue(8),
      };

      vi.mocked(getRedis).mockReturnValue(mockRedis as unknown as Redis);

      const result = await VisitorTrackingService.getCartActivityNotification({
        storeId: 'test-store',
        productId: 'product-123',
      });

      // Narrow to VisitorNotification to access 'trending'
      expect(result && result.type === 'visitor' ? result.trending : undefined).toBe(true);
    });

    it('should return null if count < 2', async () => {
      const mockRedis = {
        zcard: vi.fn().mockResolvedValue(1),
      };

      vi.mocked(getRedis).mockReturnValue(mockRedis as unknown as Redis);

      const result = await VisitorTrackingService.getCartActivityNotification({
        storeId: 'test-store',
        productId: 'product-123',
      });

      expect(result).toBeNull();
    });
  });

  describe('getRecentlyViewedNotification', () => {
    it('should return recently viewed notification', async () => {
      const mockRedis = {
        get: vi.fn().mockResolvedValue('25'),
      };

      vi.mocked(getRedis).mockReturnValue(mockRedis as unknown as Redis);

      const result = await VisitorTrackingService.getRecentlyViewedNotification({
        storeId: 'test-store',
        productId: 'product-123',
      });

      expect(result).toMatchObject({
        type: 'visitor',
        count: 25,
        context: 'viewed this in the last hour',
        trending: false,
      });
    });

    it('should mark as trending if views > 30', async () => {
      const mockRedis = {
        get: vi.fn().mockResolvedValue('45'),
      };

      vi.mocked(getRedis).mockReturnValue(mockRedis as unknown as Redis);

      const result = await VisitorTrackingService.getRecentlyViewedNotification({
        storeId: 'test-store',
        productId: 'product-123',
      });

      // Narrow to VisitorNotification to access 'trending'
      expect(result && result.type === 'visitor' ? result.trending : undefined).toBe(true);
    });

    it('should return null if views < 10', async () => {
      const mockRedis = {
        get: vi.fn().mockResolvedValue('5'),
      };

      vi.mocked(getRedis).mockReturnValue(mockRedis as Partial<Redis> as Redis);

      const result = await VisitorTrackingService.getRecentlyViewedNotification({
        storeId: 'test-store',
        productId: 'product-123',
      });

      expect(result).toBeNull();
    });
  });
});
