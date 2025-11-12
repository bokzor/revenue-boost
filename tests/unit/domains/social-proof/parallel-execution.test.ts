/**
 * Social Proof Service - Parallel Execution Tests
 *
 * Verifies that notification fetching runs in parallel and handles failures gracefully
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the services BEFORE importing
vi.mock('~/domains/social-proof/services/shopify-data.server', () => ({
  ShopifyDataService: {
    getRecentPurchases: vi.fn(),
    getSalesCountNotification: vi.fn(),
    getLowStockNotification: vi.fn(),
  },
}));

vi.mock('~/domains/social-proof/services/visitor-tracking.server', () => ({
  VisitorTrackingService: {
    getVisitorNotification: vi.fn(),
    getTrendingNotification: vi.fn(),
    getCartActivityNotification: vi.fn(),
    getRecentlyViewedNotification: vi.fn(),
  },
}));

vi.mock('~/domains/campaigns/index.server', () => ({
  CampaignService: {
    getCampaignById: vi.fn(),
  },
}));

// Now import after mocking
import { SocialProofService } from '~/domains/social-proof/services/social-proof.server';
import { ShopifyDataService } from '~/domains/social-proof/services/shopify-data.server';
import { VisitorTrackingService } from '~/domains/social-proof/services/visitor-tracking.server';
import { CampaignService } from '~/domains/campaigns/index.server';

describe('SocialProofService - Parallel Execution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should execute all enabled notification fetchers in parallel', async () => {
    // Mock campaign with all notifications enabled
    const mockCampaign = {
      id: 'campaign-1',
      storeId: 'store-1',
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

    vi.mocked(CampaignService.getCampaignById).mockResolvedValue(mockCampaign as any);

    // Mock all service methods to track call timing
    const startTime = Date.now();
    const callTimes: number[] = [];

    vi.mocked(ShopifyDataService.getRecentPurchases).mockImplementation(async () => {
      callTimes.push(Date.now() - startTime);
      await new Promise(resolve => setTimeout(resolve, 10)); // Simulate 10ms delay
      return [{ type: 'purchase', message: 'Purchase 1' }] as any;
    });

    vi.mocked(VisitorTrackingService.getVisitorNotification).mockImplementation(async () => {
      callTimes.push(Date.now() - startTime);
      await new Promise(resolve => setTimeout(resolve, 10));
      return { type: 'visitor', message: 'Visitor 1' } as any;
    });

    vi.mocked(ShopifyDataService.getSalesCountNotification).mockImplementation(async () => {
      callTimes.push(Date.now() - startTime);
      await new Promise(resolve => setTimeout(resolve, 10));
      return { type: 'sales', message: 'Sales 1' } as any;
    });

    vi.mocked(ShopifyDataService.getLowStockNotification).mockImplementation(async () => {
      callTimes.push(Date.now() - startTime);
      await new Promise(resolve => setTimeout(resolve, 10));
      return { type: 'lowstock', message: 'Low Stock 1' } as any;
    });

    vi.mocked(VisitorTrackingService.getTrendingNotification).mockImplementation(async () => {
      callTimes.push(Date.now() - startTime);
      await new Promise(resolve => setTimeout(resolve, 10));
      return { type: 'trending', message: 'Trending 1' } as any;
    });

    vi.mocked(VisitorTrackingService.getCartActivityNotification).mockImplementation(async () => {
      callTimes.push(Date.now() - startTime);
      await new Promise(resolve => setTimeout(resolve, 10));
      return { type: 'cart', message: 'Cart 1' } as any;
    });

    vi.mocked(VisitorTrackingService.getRecentlyViewedNotification).mockImplementation(async () => {
      callTimes.push(Date.now() - startTime);
      await new Promise(resolve => setTimeout(resolve, 10));
      return { type: 'viewed', message: 'Viewed 1' } as any;
    });

    // Execute
    const result = await SocialProofService.getNotifications({
      campaignId: 'campaign-1',
      storeId: 'store-1',
      productId: 'product-1',
    });

    // Verify all methods were called
    expect(ShopifyDataService.getRecentPurchases).toHaveBeenCalledTimes(1);
    expect(VisitorTrackingService.getVisitorNotification).toHaveBeenCalledTimes(1);
    expect(ShopifyDataService.getSalesCountNotification).toHaveBeenCalledTimes(1);
    expect(ShopifyDataService.getLowStockNotification).toHaveBeenCalledTimes(1);
    expect(VisitorTrackingService.getTrendingNotification).toHaveBeenCalledTimes(1);
    expect(VisitorTrackingService.getCartActivityNotification).toHaveBeenCalledTimes(1);
    expect(VisitorTrackingService.getRecentlyViewedNotification).toHaveBeenCalledTimes(1);

    // Verify parallel execution: all calls should start within a few ms of each other
    // If sequential, they would be 10ms apart. If parallel, they should all start ~0ms apart
    const maxTimeDiff = Math.max(...callTimes) - Math.min(...callTimes);
    expect(maxTimeDiff).toBeLessThan(5); // All should start within 5ms

    // Verify results are returned
    expect(result.length).toBeGreaterThan(0);
  });

  it('should handle individual notification failures gracefully', async () => {
    const mockCampaign = {
      id: 'campaign-1',
      storeId: 'store-1',
      contentConfig: {
        enablePurchaseNotifications: true,
        enableVisitorNotifications: true,
        maxNotificationsPerSession: 5,
      },
    };

    vi.mocked(CampaignService.getCampaignById).mockResolvedValue(mockCampaign as any);

    // One succeeds, one fails
    vi.mocked(ShopifyDataService.getRecentPurchases).mockResolvedValue([
      { type: 'purchase', message: 'Purchase 1' }
    ] as any);

    vi.mocked(VisitorTrackingService.getVisitorNotification).mockRejectedValue(
      new Error('Visitor tracking failed')
    );

    // Should not throw, should return successful results only
    const result = await SocialProofService.getNotifications({
      campaignId: 'campaign-1',
      storeId: 'store-1',
    });

    expect(result.length).toBeGreaterThan(0);
    expect(result[0].type).toBe('purchase');
  });

  it('should only call enabled notification types', async () => {
    const mockCampaign = {
      id: 'campaign-1',
      storeId: 'store-1',
      contentConfig: {
        enablePurchaseNotifications: true,
        enableVisitorNotifications: false, // Disabled
        enableSalesCountNotifications: true,
        maxNotificationsPerSession: 5,
      },
    };

    vi.mocked(CampaignService.getCampaignById).mockResolvedValue(mockCampaign as any);
    vi.mocked(ShopifyDataService.getRecentPurchases).mockResolvedValue([] as any);
    vi.mocked(ShopifyDataService.getSalesCountNotification).mockResolvedValue(null);

    await SocialProofService.getNotifications({
      campaignId: 'campaign-1',
      storeId: 'store-1',
    });

    // Should call enabled ones
    expect(ShopifyDataService.getRecentPurchases).toHaveBeenCalled();
    expect(ShopifyDataService.getSalesCountNotification).toHaveBeenCalled();

    // Should NOT call disabled one
    expect(VisitorTrackingService.getVisitorNotification).not.toHaveBeenCalled();
  });

  it('should skip product-specific notifications when productId is missing', async () => {
    const mockCampaign = {
      id: 'campaign-1',
      storeId: 'store-1',
      contentConfig: {
        enableLowStockAlerts: true,
        enableTrendingNotifications: true,
        maxNotificationsPerSession: 5,
      },
    };

    vi.mocked(CampaignService.getCampaignById).mockResolvedValue(mockCampaign as any);

    // Call without productId
    await SocialProofService.getNotifications({
      campaignId: 'campaign-1',
      storeId: 'store-1',
      // No productId
    });

    // Product-specific notifications should NOT be called
    expect(ShopifyDataService.getLowStockNotification).not.toHaveBeenCalled();
    expect(VisitorTrackingService.getTrendingNotification).not.toHaveBeenCalled();
  });
});

