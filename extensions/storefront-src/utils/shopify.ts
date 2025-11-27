/**
 * Shopify Utilities for Storefront
 *
 * Core Shopify-specific utilities that only work on the storefront.
 */

/**
 * Get Shopify root path (handles multi-language/region stores)
 */
export function getShopifyRoot(): string {
  if (typeof window === "undefined") return "/";
  try {
    const w = window as unknown as {
      Shopify?: { routes?: { root?: string } };
    };
    return w?.Shopify?.routes?.root || "/";
  } catch {
    return "/";
  }
}

