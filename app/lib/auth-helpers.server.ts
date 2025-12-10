/**
 * Authentication Helper Functions
 *
 * Shared utilities for authentication and session management
 */

import prisma from "~/db.server";
import { authenticate, apiVersion } from "~/shopify.server";
import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";
import {
  POPUP_FREQUENCY_BEST_PRACTICES,
  SOCIAL_PROOF_FREQUENCY_BEST_PRACTICES,
  BANNER_FREQUENCY_BEST_PRACTICES,
} from "~/domains/store/types/settings";

/**
 * Shopify Session with access token
 * Extends the base session type to include accessToken
 */
interface ShopifySessionWithToken {
  shop: string;
  accessToken: string;
  [key: string]: unknown;
}

/**
 * Extract store ID from authenticated session
 * Converts shop domain to store identifier
 */
export async function getStoreId(request: Request): Promise<string> {
  const { session } = await authenticate.admin(request);

  const shopDomain = session?.shop;
  if (!shopDomain) {
    throw new Error("Missing shop in session");
  }

  // 1) Try to find the store by its Shopify domain
  const existing = await prisma.store.findUnique({
    where: { shopifyDomain: shopDomain },
  });
  if (existing) return existing.id;

  // 2) If not found, fetch Shopify shop ID via Admin GraphQL and create the store record
  // We need a numeric shop ID (BigInt) for our schema
  let shopNumericId: bigint | null = null;
  try {
    const sessionWithToken = session as unknown as ShopifySessionWithToken;
    const resp = await fetch(`https://${shopDomain}/admin/api/${apiVersion}/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": sessionWithToken.accessToken,
      },
      body: JSON.stringify({ query: `query { shop { id } }` }),
    });

    if (resp.ok) {
      const body = await resp.json();
      const gid: string | undefined = body?.data?.shop?.id;
      if (gid) {
        const last = gid.split("/").pop();
        if (last && /^\d+$/.test(last)) {
          shopNumericId = BigInt(last);
        }
      }
    }
  } catch (e) {
    // ignore and handle below
  }

  if (shopNumericId == null) {
    throw new Error("Could not resolve Shopify shop id to provision Store record");
  }

  // Use upsert to handle race conditions where multiple requests
  // might try to create the store simultaneously
  const upserted = await prisma.store.upsert({
    where: { shopifyDomain: shopDomain },
    update: {
      // Only update access token if it's newer (store already exists)
      accessToken: (session as { accessToken?: string }).accessToken ?? "",
    },
    create: {
      shopifyDomain: shopDomain,
      shopifyShopId: shopNumericId,
      accessToken: (session as { accessToken?: string }).accessToken ?? "",
      isActive: true,
      settings: {
        // Popups: disabled by default, stricter limits when enabled
        frequencyCapping: {
          enabled: false,
          ...POPUP_FREQUENCY_BEST_PRACTICES,
        },
        // Social Proof: disabled by default, higher limits (less intrusive)
        socialProofFrequencyCapping: {
          enabled: false,
          ...SOCIAL_PROOF_FREQUENCY_BEST_PRACTICES,
        },
        // Banners: disabled by default, no limits (persistent by nature)
        bannerFrequencyCapping: {
          enabled: false,
          ...BANNER_FREQUENCY_BEST_PRACTICES,
        },
      },
    },
  });

  return upserted.id;
}

/**
 * Get store ID from shop parameter (for public/storefront endpoints)
 * This is used for public endpoints that don't require Shopify authentication
 *
 * @param shop - Shop domain (e.g., "store.myshopify.com")
 * @returns Database store ID (CUID)
 */
export async function getStoreIdFromShop(shop: string): Promise<string> {
  // Normalize shop domain
  const shopDomain = shop.includes(".myshopify.com") ? shop : `${shop}.myshopify.com`;

  // Look up store in database
  const store = await prisma.store.findUnique({
    where: { shopifyDomain: shopDomain },
    select: { id: true },
  });

  if (!store) {
    throw new Error(`Store not found for shop: ${shopDomain}`);
  }

  return store.id;
}

/**
 * Create an Admin API context from an access token
 * This is used for public endpoints that need to make Admin API calls
 *
 * @param shopDomain - Shop domain (e.g., "store.myshopify.com")
 * @param accessToken - Shopify access token
 * @returns AdminApiContext for making GraphQL calls
 */
export function createAdminApiContext(shopDomain: string, accessToken: string): AdminApiContext {
  return {
    graphql: async (query: string, options?: { variables?: Record<string, unknown> }) => {
      const response = await fetch(`https://${shopDomain}/admin/api/${apiVersion}/graphql.json`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": accessToken,
        },
        body: JSON.stringify({
          query,
          variables: options?.variables,
        }),
      });

      return response;
    },
  } as AdminApiContext;
}
