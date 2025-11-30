/**
 * API Route: Server Time Synchronization
 *
 * Returns current server time and shop timezone for accurate countdown timers.
 * Used by FlashSale popups to correct client-side clock drift.
 *
 * Public endpoint (no auth required for storefront use).
 */

import type { LoaderFunctionArgs } from "react-router";
import { ShopService } from "~/domains/shops/services/shop.server";

// Cache server time response for 5 seconds to reduce load
interface TimeResponseData {
  serverTimeISO: string;
  serverTimeUnix: number;
  shopTimezone: string;
}
let cachedResponse: { data: TimeResponseData; timestamp: number; shopDomain: string } | null = null;
const CACHE_TTL_MS = 5000;

export async function loader({ request }: LoaderFunctionArgs) {
  const now = Date.now();

  // Extract shop domain from request (for storefront requests)
  const url = new URL(request.url);
  const shopDomain = url.searchParams.get("shop") || url.searchParams.get("shopDomain");

  // Return cached response if still fresh and for the same shop
  if (
    cachedResponse &&
    cachedResponse.shopDomain === shopDomain &&
    now - cachedResponse.timestamp < CACHE_TTL_MS
  ) {
    return new Response(JSON.stringify(cachedResponse.data), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=5",
        "Access-Control-Allow-Origin": "*", // Allow storefront cross-origin requests
      },
    });
  }

  // Get shop timezone (from cached DB value, not from Shopify API)
  // This endpoint is public so we can't use authenticate.admin()
  let shopTimezone = "UTC";

  if (shopDomain) {
    shopTimezone = await ShopService.getTimezoneByShopDomain(shopDomain);
  } else {
    console.warn("[api.time] No shop domain provided, defaulting to UTC");
  }

  const data = {
    serverTimeISO: new Date().toISOString(),
    serverTimeUnix: now,
    shopTimezone,
  };

  // Update cache
  cachedResponse = { data, timestamp: now, shopDomain: shopDomain || "" };

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
