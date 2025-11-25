/**
 * Route-Level Integration Tests for Product Upsell API
 * 
 * Tests the complete HTTP request/response flow (20% of integration tests)
 * - Request parsing
 * - Authentication
 * - Response formatting
 * - Error handling (400, 401, 404, 500)
 * 
 * These tests ensure the HTTP layer works correctly end-to-end.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { LoaderFunctionArgs } from 'react-router';

// Mock dependencies BEFORE imports
vi.mock('~/shopify.server');
vi.mock('~/domains/campaigns/index.server');
vi.mock('~/lib/auth-helpers.server', () => ({
  getStoreIdFromShop: (shop: string) => shop.replace('.myshopify.com', ''),
}));

// Import after mocks
import { loader as upsellProductsLoader } from '~/routes/api.upsell-products';
import { authenticate } from '~/shopify.server';
import { CampaignService } from '~/domains/campaigns/index.server';

// Helper to extract data and status from React Router's Response
async function extractResponse(response: any): Promise<{ data: any; status: number }> {
  if (response instanceof Response) {
    const data = await response.json();
    return { data, status: response.status };
  }
  return { data: response, status: 200 };
}

describe.skip('Product Upsell API Route - Critical Paths', () => {
  const mockShop = 'test-store.myshopify.com';
  const mockStoreId = 'test-store';
  const mockCampaignId = 'campaign-123';

  let mockAdmin: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockAdmin = {
      graphql: vi.fn(),
    };

    // Mock authenticate
    vi.mocked(authenticate).public = {
      appProxy: vi.fn().mockResolvedValue({
        admin: mockAdmin,
        session: { shop: mockShop, accessToken: 'test-token' },
      }),
    } as any;
  });

  describe('Happy Path - Manual Selection', () => {
    it('should return products for valid manual selection request', async () => {
      const mockCampaign = {
        id: mockCampaignId,
        storeId: mockStoreId,
        templateType: 'PRODUCT_UPSELL',
        contentConfig: {
          productSelectionMethod: 'manual',
          selectedProducts: ['gid://shopify/Product/123'],
          maxProducts: 3,
        },
      };

      vi.mocked(CampaignService.getCampaignById).mockResolvedValue(mockCampaign as any);

      mockAdmin.graphql.mockResolvedValue({
        json: async () => ({
          data: {
            nodes: [
              {
                id: 'gid://shopify/Product/123',
                title: 'Test Product',
                handle: 'test-product',
                images: { edges: [{ node: { url: 'https://cdn.shopify.com/image.jpg', altText: 'Test' } }] },
                variants: { edges: [{ node: { id: 'gid://shopify/ProductVariant/1', price: '29.99' } }] },
              },
            ],
          },
        }),
      });

      const request = new Request(
        `http://localhost/api/upsell-products?campaignId=${mockCampaignId}&shop=${mockShop}`
      );

      const response = await upsellProductsLoader({ request } as LoaderFunctionArgs);
      const { data, status } = await extractResponse(response);

      expect(status).toBe(200);
      expect(data.products).toHaveLength(1);
      expect(data.products[0]).toMatchObject({
        id: 'gid://shopify/Product/123',
        title: 'Test Product',
        price: '29.99',
      });
    });
  });

  describe('Error Handling', () => {
    it('should return 400 for missing campaignId', async () => {
      const request = new Request(
        `http://localhost/api/upsell-products?shop=${mockShop}`
      );

      const response = await upsellProductsLoader({ request } as LoaderFunctionArgs);
      const { data, status } = await extractResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe('Invalid query');
    });

    it('should return 400 for missing shop parameter', async () => {
      const request = new Request(
        `http://localhost/api/upsell-products?campaignId=${mockCampaignId}`
      );

      const response = await upsellProductsLoader({ request } as LoaderFunctionArgs);
      const { data, status } = await extractResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe('Missing shop parameter');
    });

    it('should return 401 when authentication fails', async () => {
      vi.mocked(authenticate).public = {
        appProxy: vi.fn().mockResolvedValue({
          admin: null, // Auth failed
          session: null,
        }),
      } as any;

      const request = new Request(
        `http://localhost/api/upsell-products?campaignId=${mockCampaignId}&shop=${mockShop}`
      );

      const response = await upsellProductsLoader({ request } as LoaderFunctionArgs);
      const { data, status } = await extractResponse(response);

      expect(status).toBe(401);
      expect(data.error).toBe('Authentication failed');
    });

    it('should return 404 when campaign is not found', async () => {
      vi.mocked(CampaignService.getCampaignById).mockResolvedValue(null);

      const request = new Request(
        `http://localhost/api/upsell-products?campaignId=${mockCampaignId}&shop=${mockShop}`
      );

      const response = await upsellProductsLoader({ request } as LoaderFunctionArgs);
      const { data, status } = await extractResponse(response);

      expect(status).toBe(404);
      expect(data.error).toBe('Campaign not found');
    });
  });
});

