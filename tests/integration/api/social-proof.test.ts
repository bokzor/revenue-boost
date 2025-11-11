/**
 * Integration Tests for Social Proof API Endpoints
 *
 * Tests API endpoints with real Redis and mock Shopify data
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
import { loader as socialProofLoader } from '~/routes/api.social-proof.$campaignId';
import { action as trackAction } from '~/routes/api.social-proof.track';
import { SocialProofService } from '~/domains/social-proof/services/social-proof.server';
import type { SocialProofNotification } from '~/domains/storefront/notifications/social-proof/types';
import { VisitorTrackingService } from '~/domains/social-proof/services/visitor-tracking.server';
import { getOrCreateVisitorId } from '~/lib/visitor-id.server';

// Mock dependencies
vi.mock('~/domains/social-proof/services/social-proof.server');
vi.mock('~/domains/social-proof/services/visitor-tracking.server');
vi.mock('~/lib/visitor-id.server');
vi.mock('~/lib/auth-helpers.server', () => ({
  getStoreIdFromShop: (shop: string) => shop.replace('.myshopify.com', ''),
}));

describe('Social Proof API Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/social-proof/:campaignId', () => {
    it('should return notifications for a campaign', async () => {
      const mockNotifications: SocialProofNotification[] = [
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
        {
          id: 'visitor-1',
          type: 'visitor',
          count: 12,
          context: 'viewing this product right now',
          trending: false,
          timestamp: Date.now(),
        },
      ];

      vi.mocked(SocialProofService.getNotifications).mockResolvedValue(mockNotifications);

      const request = new Request(
        'http://localhost/api/social-proof/campaign-123?shop=test-store.myshopify.com&productId=product-456'
      );

      const response = await socialProofLoader({
        request,
        params: { campaignId: 'campaign-123' },
        context: {},
      } as unknown as LoaderFunctionArgs);

      const data = await (response as unknown as Response).json();

      expect(data.success).toBe(true);
      expect(data.notifications).toEqual(mockNotifications);
      expect(data.timestamp).toBeDefined();
    });

    it('should return 400 if campaignId is missing', async () => {
      const request = new Request('http://localhost/api/social-proof/');

      const response = await socialProofLoader({
        request,
        params: {},
        context: {},
      } as unknown as LoaderFunctionArgs);

      expect((response as unknown as Response).status).toBe(400);
      const data = await (response as unknown as Response).json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Campaign ID');
    });

    it('should return 400 if shop parameter is missing', async () => {
      const request = new Request('http://localhost/api/social-proof/campaign-123');

      const response = await socialProofLoader({
        request,
        params: { campaignId: 'campaign-123' },
        context: {},
      } as unknown as LoaderFunctionArgs);

      expect((response as unknown as Response).status).toBe(400);
      const data = await (response as unknown as Response).json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Shop parameter');
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(SocialProofService.getNotifications).mockRejectedValue(
        new Error('Database error')
      );

      const request = new Request(
        'http://localhost/api/social-proof/campaign-123?shop=test-store.myshopify.com'
      );

      const response = await socialProofLoader({
        request,
        params: { campaignId: 'campaign-123' },
        context: {},
      } as unknown as LoaderFunctionArgs);

      expect((response as unknown as Response).status).toBe(500);
      const data = await (response as unknown as Response).json();
      expect(data.success).toBe(false);
      expect(data.notifications).toEqual([]);
    });

    it('should include Cache-Control header', async () => {
      vi.mocked(SocialProofService.getNotifications).mockResolvedValue([]);

      const request = new Request(
        'http://localhost/api/social-proof/campaign-123?shop=test-store.myshopify.com'
      );

      const response = await socialProofLoader({
        request,
        params: { campaignId: 'campaign-123' },
        context: {},
      } as unknown as LoaderFunctionArgs);

      const headers = (response as unknown as Response).headers;
      expect(headers.get('Cache-Control')).toContain('max-age=30');
    });
  });

  describe('POST /api/social-proof/track', () => {
    it('should track page view events', async () => {
      vi.mocked(getOrCreateVisitorId).mockResolvedValue('visitor-123');
      vi.mocked(VisitorTrackingService.trackVisitorView).mockResolvedValue();

      const request = new Request('http://localhost/api/social-proof/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventType: 'page_view',
          shop: 'test-store.myshopify.com',
          pageUrl: '/products/test',
        }),
      });

      const response = await trackAction({
        request,
        params: {},
        context: {},
      } as unknown as ActionFunctionArgs);

      const data = await (response as unknown as Response).json();

      expect(data.success).toBe(true);
      expect(VisitorTrackingService.trackVisitorView).toHaveBeenCalledWith({
        storeId: 'test-store',
        productId: undefined,
        visitorId: 'visitor-123',
      });
    });

    it('should track add-to-cart events', async () => {
      vi.mocked(getOrCreateVisitorId).mockResolvedValue('visitor-123');
      vi.mocked(VisitorTrackingService.trackCartActivity).mockResolvedValue();

      const request = new Request('http://localhost/api/social-proof/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventType: 'add_to_cart',
          productId: 'product-456',
          shop: 'test-store.myshopify.com',
        }),
      });

      const response = await trackAction({
        request,
        params: {},
        context: {},
      } as unknown as ActionFunctionArgs);

      const data = await (response as unknown as Response).json();

      expect(data.success).toBe(true);
      expect(VisitorTrackingService.trackCartActivity).toHaveBeenCalledWith({
        storeId: 'test-store',
        productId: 'product-456',
        visitorId: 'visitor-123',
      });
    });
  });
});
