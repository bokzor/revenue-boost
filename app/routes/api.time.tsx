/**
 * API Route: Server Time Synchronization
 * 
 * Returns current server time and shop timezone for accurate countdown timers.
 * Used by FlashSale popups to correct client-side clock drift.
 * 
 * Public endpoint (no auth required for storefront use).
 */

import type { LoaderFunctionArgs } from "react-router";

// Cache server time response for 5 seconds to reduce load
let cachedResponse: { data: any; timestamp: number } | null = null;
const CACHE_TTL_MS = 5000;

export async function loader({ request }: LoaderFunctionArgs) {
  const now = Date.now();

  // Return cached response if still fresh
  if (cachedResponse && (now - cachedResponse.timestamp) < CACHE_TTL_MS) {
    return new Response(JSON.stringify(cachedResponse.data), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=5",
        "Access-Control-Allow-Origin": "*", // Allow storefront cross-origin requests
      },
    });
  }

  // Get shop timezone (default to UTC if not available)
  // TODO: Fetch actual shop timezone from Shopify store settings when authenticated
  const shopTimezone = "UTC"; // Placeholder - will be shop-specific in production

  const data = {
    serverTimeISO: new Date().toISOString(),
    serverTimeUnix: now,
    shopTimezone,
  };

  // Update cache
  cachedResponse = { data, timestamp: now };

  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=5",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

// Handle OPTIONS preflight for CORS
export async function options() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
