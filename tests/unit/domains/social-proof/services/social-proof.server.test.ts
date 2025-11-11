/**
 * Unit Tests for SocialProofService
 *
 * Tests notification orchestration and filtering
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { CampaignWithConfigs } from '~/domains/campaigns/types/campaign';
import { SocialProofService } from '~/domains/social-proof/services/social-proof.server';
import { ShopifyDataService } from '~/domains/social-proof/services/shopify-data.server';
import { VisitorTrackingService } from '~/domains/social-proof/services/visitor-tracking.server';
import { CampaignService } from '~/domains/campaigns/index.server';

// Mock Shopify server to avoid initialization errors
vi.mock('~/shopify.server', () => ({
  apiVersion: '2025-10',
  authenticate: {
    admin: vi.fn(),
  },
}));

// Mock dependencies
vi.mock('~/domains/social-proof/services/shopify-data.server');
vi.mock('~/domains/social-proof/services/visitor-tracking.server');
vi.mock('~/domains/campaigns/index.server');

describe('SocialProofService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getNotifications', () => {
    it('should return all enabled notification types', async () => {
      const mockCampaign = {
        id: 'campaign-123',
        storeId: 'test-store',
        contentConfig: {
          enablePurchaseNotifications: true,
          enableVisitorNotifications: true,
          enableSalesCountNotifications: true,
          enableLowStockAlerts: true,
          enableTrendingNotifications: true,
          enableCartActivityNotifications: true,
          enableRecentlyViewedNotifications: true,
          maxNotificationsPerSession: 5,
        },
      };

      vi.mocked(CampaignService.getCampaignById).mockResolvedValue(mockCampaign as Partial<CampaignWithConfigs> as CampaignWithConfigs);

      const mockPurchases = [
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

      const mockVisitor = {
        id: 'visitor-1',
        type: 'visitor',
        count: 12,
        context: 'viewing this product right now',
        trending: false,
        timestamp: Date.now(),
      };

      const mockSalesCount = {
        id: 'sales-1',
        type: 'visitor',
        count: 15,
        context: 'bought this in the last 24 hours',
        trending: true,
        timestamp: Date.now(),
      };

      vi.mocked(ShopifyDataService.getRecentPurchases).mockResolvedValue(mockPurchases as any);
      vi.mocked(VisitorTrackingService.getVisitorNotification).mockResolvedValue(mockVisitor as any);
      vi.mocked(ShopifyDataService.getSalesCountNotification).mockResolvedValue(mockSalesCount as any);
      vi.mocked(ShopifyDataService.getLowStockNotification).mockResolvedValue(null);
      vi.mocked(VisitorTrackingService.getTrendingNotification).mockResolvedValue(null);
      vi.mocked(VisitorTrackingService.getCartActivityNotification).mockResolvedValue(null);
      vi.mocked(VisitorTrackingService.getRecentlyViewedNotification).mockResolvedValue(null);

      const result = await SocialProofService.getNotifications({
        campaignId: 'campaign-123',
        storeId: 'test-store',
        productId: 'product-123',
      });

      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThanOrEqual(5); // maxNotificationsPerSession
    });

    it('should return empty array if campaign not found', async () => {
      vi.mocked(CampaignService.getCampaignById).mockResolvedValue(null);

      const result = await SocialProofService.getNotifications({
        campaignId: 'non-existent',
        storeId: 'test-store',
      });

      expect(result).toEqual([]);
    });

    it('should respect notification type toggles', async () => {
      const mockCampaign = {
        id: 'campaign-123',
        storeId: 'test-store',
        contentConfig: {
          enablePurchaseNotifications: false, // Disabled
          enableVisitorNotifications: true,
          maxNotificationsPerSession: 5,
        },
      };

      vi.mocked(CampaignService.getCampaignById).mockResolvedValue(mockCampaign as Partial<CampaignWithConfigs> as CampaignWithConfigs);

      const mockVisitor = {
        id: 'visitor-1',
        type: 'visitor',
        count: 12,
        context: 'viewing this product right now',
        trending: false,
        timestamp: Date.now(),
      };

      vi.mocked(VisitorTrackingService.getVisitorNotification).mockResolvedValue(mockVisitor as any);

      await SocialProofService.getNotifications({
        campaignId: 'campaign-123',
        storeId: 'test-store',
      });

      // Should not call getRecentPurchases since it's disabled
      expect(ShopifyDataService.getRecentPurchases).not.toHaveBeenCalled();

      // Should still get visitor notification
      expect(VisitorTrackingService.getVisitorNotification).toHaveBeenCalled();
    });

    it('should limit notifications to maxNotificationsPerSession', async () => {
      const mockCampaign = {
        id: 'campaign-123',
        storeId: 'test-store',
        contentConfig: {
          enablePurchaseNotifications: true,
          enableVisitorNotifications: true,
          enableSalesCountNotifications: true,
          maxNotificationsPerSession: 2, // Limit to 2
        },
      };

      vi.mocked(CampaignService.getCampaignById).mockResolvedValue(mockCampaign as Partial<CampaignWithConfigs> as CampaignWithConfigs);

      // Return multiple notifications
      vi.mocked(ShopifyDataService.getRecentPurchases).mockResolvedValue([
        { id: 'p1', type: 'purchase' },
        { id: 'p2', type: 'purchase' },
        { id: 'p3', type: 'purchase' },
      ] as any);

      vi.mocked(VisitorTrackingService.getVisitorNotification).mockResolvedValue({
        id: 'v1',
        type: 'visitor',
      } as any);

      vi.mocked(ShopifyDataService.getSalesCountNotification).mockResolvedValue({
        id: 's1',
        type: 'visitor',
      } as any);

      const result = await SocialProofService.getNotifications({
        campaignId: 'campaign-123',
        storeId: 'test-store',
      });

      expect(result.length).toBe(2); // Should be limited to 2
    });
  });
});
