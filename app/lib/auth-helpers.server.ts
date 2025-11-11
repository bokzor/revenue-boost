/**
 * Authentication Helper Functions
 *
 * Shared utilities for authentication and session management
 */

import prisma from "~/db.server";
import { authenticate, apiVersion } from "~/shopify.server";

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
  const existing = await prisma.store.findUnique({ where: { shopifyDomain: shopDomain } });
  if (existing) return existing.id;

  // 2) If not found, fetch Shopify shop ID via Admin GraphQL and create the store record
  // We need a numeric shop ID (BigInt) for our schema
  let shopNumericId: bigint | null = null;
  try {
    const resp = await fetch(`https://${shopDomain}/admin/api/${apiVersion}/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': (session as any).accessToken,
      },
      body: JSON.stringify({ query: `query { shop { id } }` }),
    });

    if (resp.ok) {
      const body = await resp.json();
      const gid: string | undefined = body?.data?.shop?.id;
      if (gid) {
        const last = gid.split('/').pop();
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

  const created = await prisma.store.create({
    data: {
      shopifyDomain: shopDomain,
      shopifyShopId: shopNumericId,
      accessToken: (session as any).accessToken,
      isActive: true,
    },
  });

  return created.id;
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
  const shopDomain = shop.includes('.myshopify.com') ? shop : `${shop}.myshopify.com`;

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

