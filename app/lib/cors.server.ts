/**
 * CORS Configuration for API Routes
 *
 * Provides CORS headers for different types of API endpoints
 */

// ============================================================================
// CORS HEADERS
// ============================================================================

/**
 * CORS headers for admin API endpoints (authenticated)
 * Used for internal admin operations
 */
export function adminCors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Shopify-Access-Token",
    "Access-Control-Max-Age": "86400", // 24 hours
  };
}

/**
 * CORS headers for storefront API endpoints (public)
 * Used for customer-facing operations
 */
export function storefrontCors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Shop-Domain",
    "Access-Control-Max-Age": "3600", // 1 hour
  };
}
