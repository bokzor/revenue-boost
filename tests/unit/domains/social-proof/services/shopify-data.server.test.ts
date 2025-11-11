/**
 * Unit Tests for ShopifyDataService
 *
 * Tests order fetching, sales counts, and low stock alerts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Mock } from 'vitest';
import type { PurchaseNotification } from "~/domains/storefront/notifications/social-proof/types";
import type Redis from 'ioredis';
import { ShopifyDataService } from '~/domains/social-proof/services/shopify-data.server';
import prisma from '~/db.server';
import { getRedis } from '~/lib/redis.server';

// Mock dependencies
vi.mock('~/db.server', () => ({
  default: {
    store: {
      findUnique: vi.fn(),
    },
    session: {
      findFirst: vi.fn(),
    },
  },
}));
vi.mock('~/lib/redis.server');
vi.mock('~/shopify.server', () => ({
  apiVersion: '2025-10',
}));

// Mock fetch globally
global.fetch = vi.fn();

describe('ShopifyDataService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getRecentPurchases', () => {
    it('should return cached purchases if available', async () => {
      const cachedData = [
        {
          id: 'purchase-1',
          type: 'purchase',
          customerName: 'John D.',
          location: 'New York, NY',
          productName: 'Test Product',
          timeAgo: '5 minutes ago',
          verified: true,
          timestamp: Date.now(),
        },
      ];

      const mockRedis = {
        get: vi.fn().mockResolvedValue(JSON.stringify(cachedData)),
        setex: vi.fn(),
      };

      vi.mocked(getRedis).mockReturnValue(mockRedis as unknown as Redis);

      const result = await ShopifyDataService.getRecentPurchases({
        storeId: 'test-store',
        limit: 5,
        hoursBack: 48,
      });

      expect(result).toEqual(cachedData);
      expect(mockRedis.get).toHaveBeenCalledWith('stats:purchases:test-store:all');
    });

    it('should fetch from Shopify API if cache miss', async () => {
      const mockRedis = {
        get: vi.fn().mockResolvedValue(null),
        setex: vi.fn(),
      };

      vi.mocked(getRedis).mockReturnValue(mockRedis as unknown as Redis);

      (prisma.store.findUnique as unknown as Mock).mockResolvedValue({
        id: 'test-store',
        shopifyDomain: 'test-store.myshopify.com',
      });

      (prisma.session.findFirst as unknown as Mock).mockResolvedValue({
        id: 'session-1',
        shop: 'test-store.myshopify.com',
        accessToken: 'test-token',
        isOnline: false,
      });

      const mockOrders = {
        data: {
          orders: {
            edges: [
              {
                node: {
                  id: 'gid://shopify/Order/123',
                  name: '#1001',
                  createdAt: new Date().toISOString(),
                  customer: {
                    firstName: 'John',
                    lastName: 'Doe',
                    defaultAddress: {
                      city: 'New York',
                      provinceCode: 'NY',
                      countryCode: 'US',
                    },
                  },
                  lineItems: {
                    edges: [
                      {
                        node: {
                          title: 'Test Product',
                          product: {
                            id: 'gid://shopify/Product/456',
                            featuredImage: {
                              url: 'https://example.com/image.jpg',
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            ],
          },
        },
      };

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => mockOrders,
      } as unknown as Response);

      const result = await ShopifyDataService.getRecentPurchases({
        storeId: 'test-store',
        limit: 5,
        hoursBack: 48,
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        type: 'purchase',
        customerName: 'John D.',
        location: 'New York, NY',
        productName: 'Test Product',
        verified: true,
      });

      expect(mockRedis.setex).toHaveBeenCalled();
    });

    it('should return empty array if no store found', async () => {
      vi.mocked(getRedis).mockReturnValue(null);
      (prisma.store.findUnique as unknown as Mock).mockResolvedValue(null);

      const result = await ShopifyDataService.getRecentPurchases({
        storeId: 'non-existent',
        limit: 5,
        hoursBack: 48,
      });

      expect(result).toEqual([]);
    });

    it('should handle Shopify API errors gracefully', async () => {
      vi.mocked(getRedis).mockReturnValue(null);
      (prisma.store.findUnique as unknown as Mock).mockResolvedValue({
        id: 'test-store',
        shopifyDomain: 'test-store.myshopify.com',
      });

      (prisma.session.findFirst as unknown as Mock).mockResolvedValue({
        id: 'session-1',
        shop: 'test-store.myshopify.com',
        accessToken: 'test-token',
        isOnline: false,
      });

      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as unknown as Response);

      const result = await ShopifyDataService.getRecentPurchases({
        storeId: 'test-store',
        limit: 5,
        hoursBack: 48,
      });

      expect(result).toEqual([]);
    });
  });

  describe('getSalesCountNotification', () => {
    it('should return sales count notification', async () => {
      const mockPurchases: PurchaseNotification[] = Array(15).fill(null).map((_, i) => ({
        id: `purchase-${i}`,
        type: 'purchase',
        customerName: `Customer ${i}`,
        location: 'Test City',
        productName: 'Test Product',
        timeAgo: '1 hour ago',
        verified: true,
        timestamp: Date.now(),
      }));

      vi.spyOn(ShopifyDataService, 'getRecentPurchases').mockResolvedValue(mockPurchases);

      const result = await ShopifyDataService.getSalesCountNotification({
        storeId: 'test-store',
        productId: 'product-123',
        hoursBack: 24,
      });

      expect(result).toMatchObject({
        type: 'visitor',
        count: 15,
        context: 'bought this in the last 24 hours',
        trending: true,
      });
    });

    it('should return null if no purchases', async () => {
      vi.spyOn(ShopifyDataService, 'getRecentPurchases').mockResolvedValue([]);

      const result = await ShopifyDataService.getSalesCountNotification({
        storeId: 'test-store',
        productId: 'product-123',
        hoursBack: 24,
      });

      expect(result).toBeNull();
    });
  });

  describe('getLowStockNotification', () => {
    it('should return low stock notification when inventory is low', async () => {
      const mockRedis = {
        get: vi.fn().mockResolvedValue(null),
        setex: vi.fn(),
      };

      vi.mocked(getRedis).mockReturnValue(mockRedis as unknown as Redis);

      (prisma.store.findUnique as unknown as Mock).mockResolvedValue({
        id: 'test-store',
        shopifyDomain: 'test-store.myshopify.com',
      });

      (prisma.session.findFirst as unknown as Mock).mockResolvedValue({
        id: 'session-1',
        shop: 'test-store.myshopify.com',
        accessToken: 'test-token',
        isOnline: false,
      });

      const mockInventory = {
        data: {
          product: {
            id: 'gid://shopify/Product/123',
            title: 'Test Product',
            totalInventory: 3,
            variants: {
              edges: [
                {
                  node: {
                    id: 'gid://shopify/ProductVariant/456',
                    inventoryQuantity: 3,
                  },
                },
              ],
            },
          },
        },
      };

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => mockInventory,
      } as unknown as Response);

      const result = await ShopifyDataService.getLowStockNotification({
        storeId: 'test-store',
        productId: 'gid://shopify/Product/123',
        threshold: 10,
      });

      expect(result).toMatchObject({
        type: 'visitor',
        count: 3,
        context: 'left in stock!',
        trending: true,
      });
    });

    it('should return null if inventory is above threshold', async () => {
      const mockRedis = {
        get: vi.fn().mockResolvedValue(null),
        setex: vi.fn(),
      };

      vi.mocked(getRedis).mockReturnValue(mockRedis as unknown as Redis);

      (prisma.store.findUnique as unknown as Mock).mockResolvedValue({
        id: 'test-store',
        shopifyDomain: 'test-store.myshopify.com',
      });

      (prisma.session.findFirst as unknown as Mock).mockResolvedValue({
        id: 'session-1',
        shop: 'test-store.myshopify.com',
        accessToken: 'test-token',
        isOnline: false,
      });

      const mockInventory = {
        data: {
          product: {
            id: 'gid://shopify/Product/123',
            title: 'Test Product',
            totalInventory: 50,
          },
        },
      };

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => mockInventory,
      } as unknown as Response);

      const result = await ShopifyDataService.getLowStockNotification({
        storeId: 'test-store',
        productId: 'gid://shopify/Product/123',
        threshold: 10,
      });

      expect(result).toBeNull();
    });
  });
});
