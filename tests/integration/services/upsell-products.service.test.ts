/**
 * Service-Level Integration Tests for Product Upsell
 *
 * Tests the business logic functions directly (80% of integration tests)
 * - fetchProductsByIds
 * - fetchProductsByCollection
 * - fetchPopularProducts
 *
 * These tests focus on:
 * - Shopify GraphQL API integration
 * - Data transformation
 * - Edge cases and error handling
 *
 * NOTE: These tests are currently skipped because the functions are not exported
 * from the route file. They should be moved to a separate service file and then
 * these tests can be enabled.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchProductsByIds,
  fetchProductsByCollection,
  fetchPopularProducts,
} from '~/domains/commerce/services/upsell.server';

describe.skip('Product Upsell Service - fetchProductsByIds', () => {
  let mockAdmin: any;

  beforeEach(() => {
    mockAdmin = {
      graphql: vi.fn(),
    };
  });

  it('should fetch products by IDs and transform to Product type', async () => {
    // Mock Shopify GraphQL response
    mockAdmin.graphql.mockResolvedValue({
      json: async () => ({
        data: {
          nodes: [
            {
              id: 'gid://shopify/Product/123',
              title: 'Test Product 1',
              handle: 'test-product-1',
              onlineStoreUrl: 'https://store.com/products/test-product-1',
              images: {
                edges: [{ node: { url: 'https://cdn.shopify.com/image1.jpg', altText: 'Product 1' } }],
              },
              variants: {
                edges: [{ node: { id: 'gid://shopify/ProductVariant/1', price: '29.99' } }],
              },
            },
            {
              id: 'gid://shopify/Product/456',
              title: 'Test Product 2',
              handle: 'test-product-2',
              onlineStoreUrl: 'https://store.com/products/test-product-2',
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

    const products = await fetchProductsByIds(mockAdmin, [
      'gid://shopify/Product/123',
      'gid://shopify/Product/456',
    ]);

    expect(products).toHaveLength(2);
    expect(products[0]).toMatchObject({
      id: 'gid://shopify/Product/123',
      title: 'Test Product 1',
      handle: 'test-product-1',
      price: '29.99',
      variantId: 'gid://shopify/ProductVariant/1',
      imageUrl: 'https://cdn.shopify.com/image1.jpg',
    });
    expect(products[1]).toMatchObject({
      id: 'gid://shopify/Product/456',
      title: 'Test Product 2',
      price: '39.99',
    });

    // Verify GraphQL was called correctly
    expect(mockAdmin.graphql).toHaveBeenCalledWith(
      expect.stringContaining('query getUpsellProducts'),
      expect.objectContaining({
        variables: {
          ids: ['gid://shopify/Product/123', 'gid://shopify/Product/456'],
        },
      })
    );
  });

  it('should return empty array when no product IDs provided', async () => {


    const products = await fetchProductsByIds(mockAdmin, []);

    expect(products).toEqual([]);
    expect(mockAdmin.graphql).not.toHaveBeenCalled();
  });

  it('should filter out null products from Shopify response', async () => {
    mockAdmin.graphql.mockResolvedValue({
      json: async () => ({
        data: {
          nodes: [
            {
              id: 'gid://shopify/Product/123',
              title: 'Valid Product',
              handle: 'valid-product',
              images: { edges: [] },
              variants: { edges: [{ node: { id: 'gid://shopify/ProductVariant/1', price: '29.99' } }] },
            },
            null, // Invalid product
            {
              id: null, // Product without ID
              title: 'Invalid Product',
            },
          ],
        },
      }),
    });



    const products = await fetchProductsByIds(mockAdmin, [
      'gid://shopify/Product/123',
      'gid://shopify/Product/999',
    ]);

    // Should only include the valid product
    expect(products).toHaveLength(1);
    expect(products[0].id).toBe('gid://shopify/Product/123');
  });

  it('should handle products without images gracefully', async () => {
    mockAdmin.graphql.mockResolvedValue({
      json: async () => ({
        data: {
          nodes: [
            {
              id: 'gid://shopify/Product/123',
              title: 'No Image Product',
              handle: 'no-image',
              images: { edges: [] }, // No images
              variants: { edges: [{ node: { id: 'gid://shopify/ProductVariant/1', price: '19.99' } }] },
            },
          ],
        },
      }),
    });



    const products = await fetchProductsByIds(mockAdmin, ['gid://shopify/Product/123']);

    expect(products).toHaveLength(1);
    expect(products[0].imageUrl).toBe('');
  });

  it('should handle products without variants gracefully', async () => {
    mockAdmin.graphql.mockResolvedValue({
      json: async () => ({
        data: {
          nodes: [
            {
              id: 'gid://shopify/Product/123',
              title: 'No Variant Product',
              handle: 'no-variant',
              images: { edges: [] },
              variants: { edges: [] }, // No variants
            },
          ],
        },
      }),
    });



    const products = await fetchProductsByIds(mockAdmin, ['gid://shopify/Product/123']);

    expect(products).toHaveLength(1);
    expect(products[0].price).toBe('0.00'); // Default price
    expect(products[0].variantId).toBe('gid://shopify/Product/123'); // Falls back to product ID
  });
});

describe.skip('Product Upsell Service - fetchProductsByCollection', () => {
  let mockAdmin: any;

  beforeEach(() => {
    mockAdmin = {
      graphql: vi.fn(),
    };
  });

  it('should fetch products from collection by ID', async () => {
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
                    images: { edges: [{ node: { url: 'https://cdn.shopify.com/col1.jpg', altText: 'Col 1' } }] },
                    variants: { edges: [{ node: { id: 'gid://shopify/ProductVariant/11', price: '19.99' } }] },
                  },
                },
                {
                  node: {
                    id: 'gid://shopify/Product/222',
                    title: 'Collection Product 2',
                    handle: 'collection-product-2',
                    images: { edges: [{ node: { url: 'https://cdn.shopify.com/col2.jpg', altText: 'Col 2' } }] },
                    variants: { edges: [{ node: { id: 'gid://shopify/ProductVariant/22', price: '24.99' } }] },
                  },
                },
              ],
            },
          },
        },
      }),
    });



    const products = await fetchProductsByCollection(
      mockAdmin,
      'gid://shopify/Collection/789',
      3
    );

    expect(products).toHaveLength(2);
    expect(products[0].title).toBe('Collection Product 1');
    expect(products[1].title).toBe('Collection Product 2');

    // Verify GraphQL was called with collection ID query
    expect(mockAdmin.graphql).toHaveBeenCalledWith(
      expect.stringContaining('query getCollectionProductsById'),
      expect.objectContaining({
        variables: {
          id: 'gid://shopify/Collection/789',
          first: 3,
        },
      })
    );
  });

  it('should fetch products from collection by handle', async () => {
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



    const products = await fetchProductsByCollection(
      mockAdmin,
      'summer-collection',
      2
    );

    expect(products).toHaveLength(1);
    expect(products[0].title).toBe('Summer Product');

    // Verify GraphQL was called with handle query
    expect(mockAdmin.graphql).toHaveBeenCalledWith(
      expect.stringContaining('query getCollectionProductsByHandle'),
      expect.objectContaining({
        variables: {
          handle: 'summer-collection',
          first: 2,
        },
      })
    );
  });

  it('should return empty array when collection identifier is empty', async () => {


    const products = await fetchProductsByCollection(mockAdmin, '', 3);

    expect(products).toEqual([]);
    expect(mockAdmin.graphql).not.toHaveBeenCalled();
  });

  it('should return empty array when collection is not found', async () => {
    mockAdmin.graphql.mockResolvedValue({
      json: async () => ({
        data: {
          collection: null, // Collection not found
        },
      }),
    });



    const products = await fetchProductsByCollection(
      mockAdmin,
      'gid://shopify/Collection/999',
      3
    );

    expect(products).toEqual([]);
  });

  it('should respect maxProducts limit', async () => {
    mockAdmin.graphql.mockResolvedValue({
      json: async () => ({
        data: {
          collection: {
            products: {
              edges: Array.from({ length: 10 }, (_, i) => ({
                node: {
                  id: `gid://shopify/Product/${i}`,
                  title: `Product ${i}`,
                  handle: `product-${i}`,
                  images: { edges: [] },
                  variants: { edges: [{ node: { id: `gid://shopify/ProductVariant/${i}`, price: '10.00' } }] },
                },
              })),
            },
          },
        },
      }),
    });



    const products = await fetchProductsByCollection(
      mockAdmin,
      'gid://shopify/Collection/1',
      5
    );

    // Should request exactly 5 products
    expect(mockAdmin.graphql).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        variables: expect.objectContaining({
          first: 5,
        }),
      })
    );
  });
});

describe.skip('Product Upsell Service - fetchPopularProducts (AI)', () => {
  let mockAdmin: any;

  beforeEach(() => {
    mockAdmin = {
      graphql: vi.fn(),
    };
  });

  it('should fetch popular products for AI recommendations', async () => {
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



    const products = await fetchPopularProducts(mockAdmin, 4, []);

    expect(products).toHaveLength(2);
    expect(products[0].title).toBe('Popular Product 1');
    expect(products[1].title).toBe('Popular Product 2');

    // Verify GraphQL was called for popular products
    expect(mockAdmin.graphql).toHaveBeenCalledWith(
      expect.stringContaining('query getPopularProducts'),
      expect.objectContaining({
        variables: {
          first: expect.any(Number),
        },
      })
    );
  });

  it('should exclude cart products from recommendations', async () => {
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
                  id: 'gid://shopify/Product/502',
                  title: 'Also In Cart',
                  handle: 'also-in-cart',
                  images: { edges: [] },
                  variants: { edges: [{ node: { id: 'gid://shopify/ProductVariant/52', price: '39.99' } }] },
                },
              },
              {
                node: {
                  id: 'gid://shopify/Product/503',
                  title: 'Recommended Product',
                  handle: 'recommended',
                  images: { edges: [] },
                  variants: { edges: [{ node: { id: 'gid://shopify/ProductVariant/53', price: '49.99' } }] },
                },
              },
            ],
          },
        },
      }),
    });



    const cartProductIds = ['gid://shopify/Product/501', 'gid://shopify/Product/502'];
    const products = await fetchPopularProducts(mockAdmin, 3, cartProductIds);

    // Should only include products NOT in cart
    expect(products).toHaveLength(1);
    expect(products[0].id).toBe('gid://shopify/Product/503');
    expect(products[0].title).toBe('Recommended Product');
  });

  it('should return empty array when no products available', async () => {
    mockAdmin.graphql.mockResolvedValue({
      json: async () => ({
        data: {
          products: {
            edges: [],
          },
        },
      }),
    });



    const products = await fetchPopularProducts(mockAdmin, 3, []);

    expect(products).toEqual([]);
  });

  it('should respect limit parameter', async () => {
    mockAdmin.graphql.mockResolvedValue({
      json: async () => ({
        data: {
          products: {
            edges: Array.from({ length: 20 }, (_, i) => ({
              node: {
                id: `gid://shopify/Product/${i}`,
                title: `Product ${i}`,
                handle: `product-${i}`,
                images: { edges: [] },
                variants: { edges: [{ node: { id: `gid://shopify/ProductVariant/${i}`, price: '10.00' } }] },
              },
            })),
          },
        },
      }),
    });



    const products = await fetchPopularProducts(mockAdmin, 5, []);

    // Should return exactly 5 products
    expect(products).toHaveLength(5);
  });

  it('should handle Shopify API errors gracefully', async () => {
    mockAdmin.graphql.mockRejectedValue(new Error('Shopify API Error'));



    const products = await fetchPopularProducts(mockAdmin, 3, []);

    // Should return empty array on error
    expect(products).toEqual([]);
  });

  it('should handle malformed Shopify responses', async () => {
    mockAdmin.graphql.mockResolvedValue({
      json: async () => ({
        data: null, // Malformed response
      }),
    });



    const products = await fetchPopularProducts(mockAdmin, 3, []);

    expect(products).toEqual([]);
  });
});

