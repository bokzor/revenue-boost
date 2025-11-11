/**
 * Shopify Data Service
 * 
 * Fetches real data from Shopify Admin API:
 * - Recent orders (for purchase notifications)
 * - Product inventory (for low stock alerts)
 * - Sales statistics (for sales count notifications)
 */

import type {
  PurchaseNotification,
  SocialProofNotification
} from "~/domains/storefront/notifications/social-proof/types";
import prisma from "~/db.server";
import { apiVersion } from "~/shopify.server";
import { getRedis, REDIS_PREFIXES, REDIS_TTL } from "~/lib/redis.server";

interface GetRecentPurchasesParams {
  storeId: string;
  productId?: string;
  limit?: number;
  hoursBack?: number;
}

interface GetSalesCountParams {
  storeId: string;
  productId?: string;
  hoursBack?: number;
}

interface GetLowStockParams {
  storeId: string;
  productId: string;
  threshold?: number;
}

export class ShopifyDataService {
  /**
   * Get recent purchase notifications from Shopify orders
   */
  static async getRecentPurchases(
    params: GetRecentPurchasesParams
  ): Promise<PurchaseNotification[]> {
    const { storeId, productId, limit = 5, hoursBack = 48 } = params;

    try {
      // Check Redis cache first
      const redis = getRedis();
      const cacheKey = `${REDIS_PREFIXES.STATS}:purchases:${storeId}:${productId || 'all'}`;
      
      if (redis) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      }

      // Get store session for Shopify API
      const store = await prisma.store.findUnique({
        where: { id: storeId },
      });

      if (!store) {
        return [];
      }

      // Fetch recent orders from Shopify
      const notifications = await this.fetchOrdersFromShopify(
        store.shopifyDomain,
        productId,
        limit,
        hoursBack
      );

      // Cache results for 30 seconds
      if (redis && notifications.length > 0) {
        await redis.setex(cacheKey, 30, JSON.stringify(notifications));
      }

      return notifications;
    } catch (error) {
      console.error("[ShopifyDataService] Error fetching purchases:", error);
      return [];
    }
  }

  /**
   * Fetch orders from Shopify Admin API
   */
  private static async fetchOrdersFromShopify(
    shopDomain: string,
    productId: string | undefined,
    limit: number,
    hoursBack: number
  ): Promise<PurchaseNotification[]> {
    try {
      // Get offline session for this shop
      const session = await prisma.session.findFirst({
        where: {
          shop: shopDomain,
          isOnline: false,
        },
        orderBy: {
          expires: 'desc',
        },
      });

      if (!session) {
        console.warn(`[ShopifyDataService] No session found for shop: ${shopDomain}`);
        return [];
      }

      // Calculate date range
      const createdAtMin = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();

      // GraphQL query for recent orders
      const query = `
        query getRecentOrders($first: Int!) {
          orders(first: $first, query: "created_at:>='${createdAtMin}'", sortKey: CREATED_AT, reverse: true) {
            edges {
              node {
                id
                name
                createdAt
                customer {
                  firstName
                  lastName
                  defaultAddress {
                    city
                    provinceCode
                    countryCode
                  }
                }
                lineItems(first: 5) {
                  edges {
                    node {
                      title
                      product {
                        id
                        featuredImage {
                          url
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `;

      // Make direct GraphQL request to Shopify Admin API
      const response = await fetch(
        `https://${shopDomain}/admin/api/${apiVersion}/graphql.json`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': session.accessToken,
          },
          body: JSON.stringify({
            query,
            variables: {
              first: limit * 2, // Fetch more to filter
            },
          }),
        }
      );

      if (!response.ok) {
        console.error(`[ShopifyDataService] Shopify API error: ${response.status} ${response.statusText}`);
        return [];
      }

      const result = await response.json();

      if (!result.data?.orders?.edges) {
        return [];
      }

      // Transform orders to purchase notifications
      const notifications: PurchaseNotification[] = [];

      for (const edge of result.data.orders.edges) {
        const order = edge.node;

        // Skip orders without customer info
        if (!order.customer) continue;

        // Get first line item
        const lineItem = order.lineItems?.edges?.[0]?.node;
        if (!lineItem) continue;

        // Filter by product if specified
        if (productId && lineItem.product?.id !== productId) {
          continue;
        }

        // Anonymize customer name (privacy-compliant)
        const firstName = order.customer.firstName || 'Someone';
        const lastName = order.customer.lastName || '';
        const anonymizedName = `${firstName} ${lastName.charAt(0)}.`;

        // Get location
        const address = order.customer.defaultAddress;
        const city = address?.city || 'nearby';
        const province = address?.provinceCode || '';
        const location = province ? `${city}, ${province}` : city;

        // Calculate time ago
        const createdAt = new Date(order.createdAt);
        const timeAgo = this.formatTimeAgo(createdAt);

        notifications.push({
          id: `purchase-${order.id}`,
          type: 'purchase',
          customerName: anonymizedName,
          location,
          productName: lineItem.title,
          productImage: lineItem.product?.featuredImage?.url,
          timeAgo,
          verified: true,
          timestamp: createdAt.getTime(),
        });

        if (notifications.length >= limit) break;
      }

      return notifications;
    } catch (error) {
      console.error("[ShopifyDataService] Error in fetchOrdersFromShopify:", error);
      return [];
    }
  }

  /**
   * Get sales count notification for a product
   */
  static async getSalesCountNotification(
    params: GetSalesCountParams
  ): Promise<SocialProofNotification | null> {
    const { storeId, productId, hoursBack = 24 } = params;

    try {
      const purchases = await this.getRecentPurchases({
        storeId,
        productId,
        limit: 100,
        hoursBack,
      });

      if (purchases.length === 0) return null;

      return {
        id: `sales-count-${productId || 'all'}`,
        type: 'visitor', // Reuse visitor type for now
        count: purchases.length,
        context: `bought this in the last ${hoursBack} hours`,
        trending: purchases.length > 10,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error("[ShopifyDataService] Error getting sales count:", error);
      return null;
    }
  }

  /**
   * Get low stock notification for a product
   */
  static async getLowStockNotification(
    params: GetLowStockParams
  ): Promise<SocialProofNotification | null> {
    const { storeId, productId, threshold = 10 } = params;

    try {
      // Check Redis cache first
      const redis = getRedis();
      const cacheKey = `${REDIS_PREFIXES.STATS}:low-stock:${storeId}:${productId}`;

      if (redis) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      }

      // Get store session for Shopify API
      const store = await prisma.store.findUnique({
        where: { id: storeId },
      });

      if (!store) {
        return null;
      }

      // Fetch inventory from Shopify
      const notification = await this.fetchInventoryFromShopify(
        store.shopifyDomain,
        productId,
        threshold
      );

      // Cache results for 5 minutes (inventory doesn't change that often)
      if (redis && notification) {
        await redis.setex(cacheKey, 300, JSON.stringify(notification));
      }

      return notification;
    } catch (error) {
      console.error("[ShopifyDataService] Error getting low stock:", error);
      return null;
    }
  }

  /**
   * Fetch inventory from Shopify Admin API
   */
  private static async fetchInventoryFromShopify(
    shopDomain: string,
    productId: string,
    threshold: number
  ): Promise<SocialProofNotification | null> {
    try {
      // Get offline session for this shop
      const session = await prisma.session.findFirst({
        where: {
          shop: shopDomain,
          isOnline: false,
        },
        orderBy: {
          expires: 'desc',
        },
      });

      if (!session) {
        console.warn(`[ShopifyDataService] No session found for shop: ${shopDomain}`);
        return null;
      }

      // GraphQL query for product inventory
      const query = `
        query getProductInventory($id: ID!) {
          product(id: $id) {
            id
            title
            totalInventory
            variants(first: 10) {
              edges {
                node {
                  id
                  inventoryQuantity
                }
              }
            }
          }
        }
      `;

      // Make direct GraphQL request to Shopify Admin API
      const response = await fetch(
        `https://${shopDomain}/admin/api/${apiVersion}/graphql.json`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': session.accessToken,
          },
          body: JSON.stringify({
            query,
            variables: {
              id: productId,
            },
          }),
        }
      );

      if (!response.ok) {
        console.error(`[ShopifyDataService] Shopify API error: ${response.status} ${response.statusText}`);
        return null;
      }

      const result = await response.json();

      if (!result.data?.product) {
        return null;
      }

      const product = result.data.product;
      const totalInventory = product.totalInventory || 0;

      // Only show low stock alert if inventory is low but not zero
      if (totalInventory > 0 && totalInventory <= threshold) {
        return {
          id: `low-stock-${productId}`,
          type: 'visitor',
          count: totalInventory,
          context: totalInventory === 1 ? 'left in stock!' : 'left in stock!',
          trending: totalInventory <= 5, // Extra urgency for very low stock
          timestamp: Date.now(),
        };
      }

      return null;
    } catch (error) {
      console.error("[ShopifyDataService] Error in fetchInventoryFromShopify:", error);
      return null;
    }
  }

  /**
   * Format time ago string
   */
  private static formatTimeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  }
}

