/**
 * Integration Tests for Product Upsell API
 *
 * Tests the complete flow of product fetching based on selection methods:
 * - Manual product selection
 * - Collection-based selection
 * - AI-powered recommendations
 * - Discount code issuance
 * - Cart integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

// Helper to extract data and status from React Router's TypedResponse
async function extractResponse(response: any): Promise<{ data: any; status: number }> {
  // React Router's data() returns a Response object
  if (response instanceof Response) {
    const data = await response.json();
    return { data, status: response.status };
  }
  // Fallback: if it's already the data object
  return { data: response, status: 200 };
}

describe('Product Upsell Integration Tests', () => {
  const mockShop = 'test-store.myshopify.com';
  const mockStoreId = 'test-store';
  const mockCampaignId = 'campaign-123';

  let mockAdmin: any;
  let mockSession: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock Shopify admin client
    mockAdmin = {
      graphql: vi.fn(),
    };

    mockSession = {
      shop: mockShop,
      accessToken: 'test-token',
    };

    // Mock authenticate - cast to any to avoid type issues
    vi.mocked(authenticate).public = {
      appProxy: vi.fn().mockResolvedValue({
        admin: mockAdmin,
        session: mockSession,
      }),
    } as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Product Fetching - Manual Selection', () => {
    it('should fetch products by manually selected IDs', async () => {
      const selectedProducts = [
        'gid://shopify/Product/123',
        'gid://shopify/Product/456',
      ];

      const mockCampaign = {
        id: mockCampaignId,
        storeId: mockStoreId,
        templateType: 'PRODUCT_UPSELL',
        contentConfig: {
          productSelectionMethod: 'manual',
          selectedProducts,
          maxProducts: 2,
        },
      };

      // Mock campaign service
      vi.mocked(CampaignService.getCampaignById).mockResolvedValue(mockCampaign as any);

      // Mock Shopify GraphQL response
      mockAdmin.graphql.mockResolvedValue({
        json: async () => ({
          data: {
            nodes: [
              {
                id: 'gid://shopify/Product/123',
                title: 'Product 1',
                handle: 'product-1',
                onlineStoreUrl: 'https://test-store.myshopify.com/products/product-1',
                images: {
                  edges: [{ node: { url: 'https://cdn.shopify.com/image1.jpg', altText: 'Product 1' } }],
                },
                variants: {
                  edges: [{ node: { id: 'gid://shopify/ProductVariant/1', price: '29.99' } }],
                },
              },
              {
                id: 'gid://shopify/Product/456',
                title: 'Product 2',
                handle: 'product-2',
                onlineStoreUrl: 'https://test-store.myshopify.com/products/product-2',
                images: {
                  edges: [{ node: { url: 'https://cdn.shopify.com/image2.jpg', altText: 'Product 2' } }],
                },
                variants: {
                  edges: [{ node: { id: 'gid://shopify/ProductVariant/2', price: '39.99' } }],
                },
              },
            ],
          },
        }),
      });

      // Create request
      const request = new Request(
        `http://localhost/api/upsell-products?campaignId=${mockCampaignId}&shop=${mockShop}`
      );

      const response = await upsellProductsLoader({ request } as LoaderFunctionArgs);
      const { data } = await extractResponse(response);

      expect(data.products).toHaveLength(2);
      expect(data.products[0]).toMatchObject({
        id: 'gid://shopify/Product/123',
        title: 'Product 1',
        price: '29.99',
        handle: 'product-1',
      });
      expect(data.products[1]).toMatchObject({
        id: 'gid://shopify/Product/456',
        title: 'Product 2',
        price: '39.99',
        handle: 'product-2',
      });

      // Verify GraphQL was called with correct query
      expect(mockAdmin.graphql).toHaveBeenCalledWith(
        expect.stringContaining('query getUpsellProducts'),
        expect.objectContaining({
          variables: { ids: selectedProducts },
        })
      );
    });

    it('should return empty array when no products are selected', async () => {
      const mockCampaign = {
        id: mockCampaignId,
        storeId: mockStoreId,
        templateType: 'PRODUCT_UPSELL',
        contentConfig: {
          productSelectionMethod: 'manual',
          selectedProducts: [],
          maxProducts: 3,
        },
      };

      vi.mocked(CampaignService.getCampaignById).mockResolvedValue(mockCampaign as any);

      const request = new Request(
        `http://localhost/api/upsell-products?campaignId=${mockCampaignId}&shop=${mockShop}`
      );

      const response = await upsellProductsLoader({ request } as LoaderFunctionArgs);
      const { data, status } = await extractResponse(response);

      expect(data.products).toEqual([]);
      expect(mockAdmin.graphql).not.toHaveBeenCalled();
    });

    it('should handle invalid product IDs gracefully', async () => {
      const selectedProducts = [
        'gid://shopify/Product/999', // Non-existent product
      ];

      const mockCampaign = {
        id: mockCampaignId,
        storeId: mockStoreId,
        templateType: 'PRODUCT_UPSELL',
        contentConfig: {
          productSelectionMethod: 'manual',
          selectedProducts,
          maxProducts: 1,
        },
      };

      vi.mocked(CampaignService.getCampaignById).mockResolvedValue(mockCampaign as any);

      // Mock Shopify returning null for non-existent product
      mockAdmin.graphql.mockResolvedValue({
        json: async () => ({
          data: {
            nodes: [null], // Product not found
          },
        }),
      });

      const request = new Request(
        `http://localhost/api/upsell-products?campaignId=${mockCampaignId}&shop=${mockShop}`
      );

      const response = await upsellProductsLoader({ request } as LoaderFunctionArgs);
      const { data, status } = await extractResponse(response);

      // Should filter out null products
      expect(data.products).toEqual([]);
    });
  });

  describe('Product Fetching - Collection Selection', () => {
    it('should fetch products from a collection by ID', async () => {
      const collectionId = 'gid://shopify/Collection/789';

      const mockCampaign = {
        id: mockCampaignId,
        storeId: mockStoreId,
        templateType: 'PRODUCT_UPSELL',
        contentConfig: {
          productSelectionMethod: 'collection',
          selectedCollection: collectionId,
          maxProducts: 3,
        },
      };

      vi.mocked(CampaignService.getCampaignById).mockResolvedValue(mockCampaign as any);

      // Mock Shopify GraphQL response for collection
      mockAdmin.graphql.mockResolvedValue({
        json: async () => ({
          data: {
            collection: {
              products: {
                edges: [
                  {
                    node: {
                      id: 'gid://shopify/Product/111',
                      title: 'Collection Product 1',
                      handle: 'collection-product-1',
                      images: {
                        edges: [{ node: { url: 'https://cdn.shopify.com/col1.jpg', altText: 'Col 1' } }],
                      },
                      variants: {
                        edges: [{ node: { id: 'gid://shopify/ProductVariant/11', price: '19.99' } }],
                      },
                    },
                  },
                  {
                    node: {
                      id: 'gid://shopify/Product/222',
                      title: 'Collection Product 2',
                      handle: 'collection-product-2',
                      images: {
                        edges: [{ node: { url: 'https://cdn.shopify.com/col2.jpg', altText: 'Col 2' } }],
                      },
                      variants: {
                        edges: [{ node: { id: 'gid://shopify/ProductVariant/22', price: '24.99' } }],
                      },
                    },
                  },
                ],
              },
            },
          },
        }),
      });

      const request = new Request(
        `http://localhost/api/upsell-products?campaignId=${mockCampaignId}&shop=${mockShop}`
      );

      const response = await upsellProductsLoader({ request } as LoaderFunctionArgs);
      const { data, status } = await extractResponse(response);

      expect(data.products).toHaveLength(2);
      expect(data.products[0].title).toBe('Collection Product 1');
      expect(data.products[1].title).toBe('Collection Product 2');

      // Verify GraphQL was called with collection query
      expect(mockAdmin.graphql).toHaveBeenCalledWith(
        expect.stringContaining('query getCollectionProductsById'),
        expect.objectContaining({
          variables: { id: collectionId, first: 3 },
        })
      );
    });

    it('should fetch products from a collection by handle', async () => {
      const collectionHandle = 'summer-collection';

      const mockCampaign = {
        id: mockCampaignId,
        storeId: mockStoreId,
        templateType: 'PRODUCT_UPSELL',
        contentConfig: {
          productSelectionMethod: 'collection',
          selectedCollection: collectionHandle,
          maxProducts: 2,
        },
      };

      vi.mocked(CampaignService.getCampaignById).mockResolvedValue(mockCampaign as any);

      mockAdmin.graphql.mockResolvedValue({
        json: async () => ({
          data: {
            collectionByHandle: {
              products: {
                edges: [
                  {
                    node: {
                      id: 'gid://shopify/Product/333',
                      title: 'Summer Product',
                      handle: 'summer-product',
                      images: { edges: [{ node: { url: 'https://cdn.shopify.com/summer.jpg', altText: 'Summer' } }] },
                      variants: { edges: [{ node: { id: 'gid://shopify/ProductVariant/33', price: '49.99' } }] },
                    },
                  },
                ],
              },
            },
          },
        }),
      });

      const request = new Request(
        `http://localhost/api/upsell-products?campaignId=${mockCampaignId}&shop=${mockShop}`
      );

      const response = await upsellProductsLoader({ request } as LoaderFunctionArgs);
      const { data, status } = await extractResponse(response);

      expect(data.products).toHaveLength(1);
      expect(data.products[0].title).toBe('Summer Product');

      // Verify GraphQL was called with handle query
      expect(mockAdmin.graphql).toHaveBeenCalledWith(
        expect.stringContaining('query getCollectionProductsByHandle'),
        expect.objectContaining({
          variables: { handle: collectionHandle, first: 2 },
        })
      );
    });

    it('should return empty array when collection is not found', async () => {
      const mockCampaign = {
        id: mockCampaignId,
        storeId: mockStoreId,
        templateType: 'PRODUCT_UPSELL',
        contentConfig: {
          productSelectionMethod: 'collection',
          selectedCollection: 'non-existent-collection',
          maxProducts: 3,
        },
      };

      vi.mocked(CampaignService.getCampaignById).mockResolvedValue(mockCampaign as any);

      mockAdmin.graphql.mockResolvedValue({
        json: async () => ({
          data: {
            collectionByHandle: null, // Collection not found
          },
        }),
      });

      const request = new Request(
        `http://localhost/api/upsell-products?campaignId=${mockCampaignId}&shop=${mockShop}`
      );

      const response = await upsellProductsLoader({ request } as LoaderFunctionArgs);
      const { data, status } = await extractResponse(response);

      expect(data.products).toEqual([]);
    });

    it('should return empty array when selectedCollection is not provided', async () => {
      const mockCampaign = {
        id: mockCampaignId,
        storeId: mockStoreId,
        templateType: 'PRODUCT_UPSELL',
        contentConfig: {
          productSelectionMethod: 'collection',
          // selectedCollection is missing
          maxProducts: 3,
        },
      };

      vi.mocked(CampaignService.getCampaignById).mockResolvedValue(mockCampaign as any);

      const request = new Request(
        `http://localhost/api/upsell-products?campaignId=${mockCampaignId}&shop=${mockShop}`
      );

      const response = await upsellProductsLoader({ request } as LoaderFunctionArgs);
      const { data, status } = await extractResponse(response);

      expect(data.products).toEqual([]);
      expect(mockAdmin.graphql).not.toHaveBeenCalled();
    });
  });

  describe('Product Fetching - AI Recommendations', () => {
    it('should fetch popular products for AI mode', async () => {
      const mockCampaign = {
        id: mockCampaignId,
        storeId: mockStoreId,
        templateType: 'PRODUCT_UPSELL',
        contentConfig: {
          productSelectionMethod: 'ai',
          maxProducts: 4,
        },
      };

      vi.mocked(CampaignService.getCampaignById).mockResolvedValue(mockCampaign as any);

      // Mock Shopify GraphQL response for popular products
      mockAdmin.graphql.mockResolvedValue({
        json: async () => ({
          data: {
            products: {
              edges: [
                {
                  node: {
                    id: 'gid://shopify/Product/501',
                    title: 'Popular Product 1',
                    handle: 'popular-1',
                    images: { edges: [{ node: { url: 'https://cdn.shopify.com/pop1.jpg', altText: 'Pop 1' } }] },
                    variants: { edges: [{ node: { id: 'gid://shopify/ProductVariant/51', price: '59.99' } }] },
                  },
                },
                {
                  node: {
                    id: 'gid://shopify/Product/502',
                    title: 'Popular Product 2',
                    handle: 'popular-2',
                    images: { edges: [{ node: { url: 'https://cdn.shopify.com/pop2.jpg', altText: 'Pop 2' } }] },
                    variants: { edges: [{ node: { id: 'gid://shopify/ProductVariant/52', price: '69.99' } }] },
                  },
                },
              ],
            },
          },
        }),
      });

      const request = new Request(
        `http://localhost/api/upsell-products?campaignId=${mockCampaignId}&shop=${mockShop}`
      );

      const response = await upsellProductsLoader({ request } as LoaderFunctionArgs);
      const { data, status } = await extractResponse(response);

      expect(data.products).toHaveLength(2);
      expect(data.products[0].title).toBe('Popular Product 1');
      expect(data.products[1].title).toBe('Popular Product 2');

      // Verify GraphQL was called for popular products
      expect(mockAdmin.graphql).toHaveBeenCalledWith(
        expect.stringContaining('query getPopularProducts'),
        expect.objectContaining({
          variables: { first: 4 },
        })
      );
    });

    it('should exclude cart products from AI recommendations', async () => {
      const cartProductIds = 'gid://shopify/Product/501,gid://shopify/Product/502';

      const mockCampaign = {
        id: mockCampaignId,
        storeId: mockStoreId,
        templateType: 'PRODUCT_UPSELL',
        contentConfig: {
          productSelectionMethod: 'ai',
          maxProducts: 3,
        },
      };

      vi.mocked(CampaignService.getCampaignById).mockResolvedValue(mockCampaign as any);

      mockAdmin.graphql.mockResolvedValue({
        json: async () => ({
          data: {
            products: {
              edges: [
                {
                  node: {
                    id: 'gid://shopify/Product/501',
                    title: 'In Cart Product',
                    handle: 'in-cart',
                    images: { edges: [] },
                    variants: { edges: [{ node: { id: 'gid://shopify/ProductVariant/51', price: '29.99' } }] },
                  },
                },
                {
                  node: {
                    id: 'gid://shopify/Product/503',
                    title: 'Recommended Product',
                    handle: 'recommended',
                    images: { edges: [] },
                    variants: { edges: [{ node: { id: 'gid://shopify/ProductVariant/53', price: '39.99' } }] },
                  },
                },
              ],
            },
          },
        }),
      });

      const request = new Request(
        `http://localhost/api/upsell-products?campaignId=${mockCampaignId}&shop=${mockShop}&cartProductIds=${encodeURIComponent(cartProductIds)}`
      );

      const response = await upsellProductsLoader({ request } as LoaderFunctionArgs);
      const { data, status } = await extractResponse(response);

      // Should only include products NOT in cart
      expect(data.products).toHaveLength(1);
      expect(data.products[0].id).toBe('gid://shopify/Product/503');
      expect(data.products[0].title).toBe('Recommended Product');
    });

    it('should return empty array when no products are available', async () => {
      const mockCampaign = {
        id: mockCampaignId,
        storeId: mockStoreId,
        templateType: 'PRODUCT_UPSELL',
        contentConfig: {
          productSelectionMethod: 'ai',
          maxProducts: 3,
        },
      };

      vi.mocked(CampaignService.getCampaignById).mockResolvedValue(mockCampaign as any);

      mockAdmin.graphql.mockResolvedValue({
        json: async () => ({
          data: {
            products: {
              edges: [],
            },
          },
        }),
      });

      const request = new Request(
        `http://localhost/api/upsell-products?campaignId=${mockCampaignId}&shop=${mockShop}`
      );

      const response = await upsellProductsLoader({ request } as LoaderFunctionArgs);
      const { data, status } = await extractResponse(response);

      expect(data.products).toEqual([]);
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

    it('should return 500 on Shopify API errors', async () => {
      const mockCampaign = {
        id: mockCampaignId,
        storeId: mockStoreId,
        templateType: 'PRODUCT_UPSELL',
        contentConfig: {
          productSelectionMethod: 'manual',
          selectedProducts: ['gid://shopify/Product/123'],
        },
      };

      vi.mocked(CampaignService.getCampaignById).mockResolvedValue(mockCampaign as any);

      // Mock Shopify API error
      mockAdmin.graphql.mockRejectedValue(new Error('Shopify API Error'));

      const request = new Request(
        `http://localhost/api/upsell-products?campaignId=${mockCampaignId}&shop=${mockShop}`
      );

      const response = await upsellProductsLoader({ request } as LoaderFunctionArgs);
      const { data, status } = await extractResponse(response);

      expect(status).toBe(500);
      expect(data.error).toBe('Failed to resolve upsell products');
    });
  });
});

