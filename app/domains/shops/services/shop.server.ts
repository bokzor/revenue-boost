/**
 * Shop Service
 *
 * Handles fetching and caching shop information from Shopify Admin API.
 * Primary responsibility: Maintain accurate timezone data for each store.
 *
 * SOLID Compliance:
 * - Single Responsibility: Only handles shop data from Shopify
 * - All functions are < 50 lines
 */

import prisma from "~/db.server";

const TIMEZONE_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Shop details from Shopify Admin API
 */
export interface ShopDetails {
  ianaTimezone: string;
  name: string;
}

export class ShopService {
  /**
   * Get shop timezone (cached or fresh from Shopify)
   *
   * @param admin - Shopify Admin API client
   * @param storeId - Database store ID
   * @returns IANA timezone string (e.g., "America/New_York")
   */
  static async getShopTimezone(admin: any, storeId: string): Promise<string> {
    try {
      const store = await prisma.store.findUnique({
        where: { id: storeId },
        select: {
          timezone: true,
          timezoneUpdatedAt: true,
        },
      });

      if (!store) {
        console.warn(`[ShopService] Store not found: ${storeId}, defaulting to UTC`);
        return "UTC";
      }

      // Check if cached timezone is fresh (< 24 hours old)
      if (
        store.timezone &&
        store.timezoneUpdatedAt &&
        this.isTimezoneCacheFresh(store.timezoneUpdatedAt)
      ) {
        return store.timezone;
      }

      // Fetch fresh timezone from Shopify
      console.log(`[ShopService] Fetching fresh timezone for store ${storeId}`);
      const shopDetails = await this.fetchShopDetails(admin);

      // Update cache in database
      await prisma.store.update({
        where: { id: storeId },
        data: {
          timezone: shopDetails.ianaTimezone,
          timezoneUpdatedAt: new Date(),
        },
      });

      return shopDetails.ianaTimezone;
    } catch (error) {
      console.error("[ShopService] Error getting shop timezone:", error);
      // Fallback to cached timezone or UTC
      const store = await prisma.store.findUnique({
        where: { id: storeId },
        select: { timezone: true },
      });
      return store?.timezone || "UTC";
    }
  }

  /**
   * Fetch shop details from Shopify Admin API
   *
   * @param admin - Shopify Admin API client
   * @returns Shop details including IANA timezone
   */
  static async fetchShopDetails(admin: any): Promise<ShopDetails> {
    const query = `
      query {
        shop {
          ianaTimezone
          name
        }
      }
    `;

    const response = await admin.graphql(query);
    const data = await response.json();

    if (!data.data?.shop) {
      throw new Error("Failed to fetch shop details from Shopify");
    }

    const { ianaTimezone, name } = data.data.shop;

    if (!ianaTimezone) {
      console.warn("[ShopService] Shop ianaTimezone not available, using UTC");
      return { ianaTimezone: "UTC", name };
    }

    return { ianaTimezone, name };
  }

  /**
   * Check if timezone cache is fresh (< 24 hours old)
   *
   * @param timezoneUpdatedAt - Last update timestamp
   * @returns true if cache is fresh, false otherwise
   */
  static isTimezoneCacheFresh(timezoneUpdatedAt: Date | null): boolean {
    if (!timezoneUpdatedAt) return false;

    const now = new Date();
    const ageMs = now.getTime() - timezoneUpdatedAt.getTime();

    return ageMs < TIMEZONE_CACHE_TTL_MS;
  }

  /**
   * Get shop timezone by shop domain (for public API routes)
   * This is useful for storefront endpoints that don't have admin context
   *
   * @param shopDomain - Shopify shop domain (e.g., "myshop.myshopify.com")
   * @returns IANA timezone string or "UTC" if not found
   */
  static async getTimezoneByShopDomain(shopDomain: string): Promise<string> {
    try {
      const store = await prisma.store.findUnique({
        where: { shopifyDomain: shopDomain },
        select: { timezone: true },
      });

      return store?.timezone || "UTC";
    } catch (error) {
      console.error(`[ShopService] Error fetching timezone for shop ${shopDomain}:`, error);
      return "UTC";
    }
  }
}
