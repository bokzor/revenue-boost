/**
 * Authentication Helper Functions
 *
 * Shared utilities for authentication and session management
 */

import { authenticate } from "~/shopify.server";

/**
 * Extract store ID from authenticated session
 * Converts shop domain to store identifier
 */
export async function getStoreId(request: Request): Promise<string> {
  const { session } = await authenticate.admin(request);
  return session.shop.replace('.myshopify.com', '');
}



/**
 * Get store ID from shop parameter (for public/storefront endpoints)
 * This is used for public endpoints that don't require Shopify authentication
 *
 * @param shop - Shop domain (e.g., "store.myshopify.com" or "store")
 * @returns Store identifier without .myshopify.com suffix
 */
export function getStoreIdFromShop(shop: string): string {
  // Remove .myshopify.com suffix if present
  return shop.replace('.myshopify.com', '');
}

