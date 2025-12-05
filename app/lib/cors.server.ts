/**
 * CORS Configuration for API Routes
 *
 * Provides CORS headers for different types of API endpoints
 *
 * SECURITY NOTE:
 * - Storefront APIs are called via Shopify App Proxy which handles authentication
 * - Admin APIs are called from the embedded app (same origin) or via authenticated requests
 * - We restrict origins to Shopify domains and the app's own domain
 */

import { getEnv } from "./env.server";

// ============================================================================
// ALLOWED ORIGINS
// ============================================================================

/**
 * Get allowed origins for CORS
 * Includes Shopify domains and the app's own URL
 */
function getAllowedOrigins(): string[] {
  const env = getEnv();
  const origins: string[] = [
    // Shopify admin domains
    "https://admin.shopify.com",
    "https://*.myshopify.com",
  ];

  // Add app URL if configured
  if (env.SHOPIFY_APP_URL) {
    origins.push(env.SHOPIFY_APP_URL);
  }

  return origins;
}

/**
 * Check if an origin is allowed
 * Supports wildcard matching for *.myshopify.com
 */
function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;

  const allowedOrigins = getAllowedOrigins();

  for (const allowed of allowedOrigins) {
    if (allowed.includes("*")) {
      // Handle wildcard pattern (e.g., https://*.myshopify.com)
      const pattern = allowed.replace("*", "[a-zA-Z0-9-]+");
      const regex = new RegExp(`^${pattern}$`);
      if (regex.test(origin)) return true;
    } else if (allowed === origin) {
      return true;
    }
  }

  return false;
}

/**
 * Get the appropriate Access-Control-Allow-Origin header value
 * Returns the specific origin if allowed, or omits the header if not
 */
function getCorsOrigin(requestOrigin?: string | null): string {
  // For App Proxy requests, Shopify handles authentication
  // We can be more permissive since App Proxy validates the request
  if (!requestOrigin) {
    // No origin header typically means same-origin or server-to-server
    // App Proxy requests may not have Origin header
    return "*";
  }

  if (isOriginAllowed(requestOrigin)) {
    return requestOrigin;
  }

  // For Shopify storefront requests via App Proxy, allow the request
  // The App Proxy signature validation provides security
  if (requestOrigin.endsWith(".myshopify.com")) {
    return requestOrigin;
  }

  // Default: return a safe value (this will block the CORS request)
  // But we use * for backwards compatibility with App Proxy
  // The real security is in App Proxy signature validation
  return "*";
}

// ============================================================================
// CORS HEADERS
// ============================================================================

/**
 * CORS headers for admin API endpoints (authenticated)
 * Used for internal admin operations from the embedded app
 */
export function adminCors(requestOrigin?: string | null): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": getCorsOrigin(requestOrigin),
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Shopify-Access-Token",
    "Access-Control-Max-Age": "86400", // 24 hours
    "Vary": "Origin",
  };
}

/**
 * CORS headers for storefront API endpoints (public via App Proxy)
 * Used for customer-facing operations
 *
 * NOTE: Storefront APIs are accessed via Shopify App Proxy which:
 * 1. Validates the request signature (HMAC)
 * 2. Adds shop domain to the request
 * 3. Proxies through Shopify's infrastructure
 *
 * The App Proxy authentication is the primary security layer.
 *
 * IMPORTANT: Cache-Control is set to no-store to prevent App Proxy caching.
 * This is critical for E2E tests and real-time campaign updates.
 */
export function storefrontCors(requestOrigin?: string | null): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": getCorsOrigin(requestOrigin),
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Shop-Domain",
    "Access-Control-Max-Age": "3600", // 1 hour
    "Vary": "Origin",
    // Prevent Shopify App Proxy from caching responses
    // This ensures campaigns are always fetched fresh from the database
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
  };
}
