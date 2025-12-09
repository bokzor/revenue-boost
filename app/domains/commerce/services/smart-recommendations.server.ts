/**
 * Smart Recommendations Service
 *
 * Enhanced AI/Smart product recommendations using multiple strategies:
 * 1. Shopify's Product Recommendations API (RELATED / COMPLEMENTARY intent)
 * 2. Cart-based complementary products
 * 3. Best-selling products (actual sales data)
 * 4. Newest products (fallback)
 *
 * Features:
 * - Cascading fallback strategy
 * - Redis caching (60-second TTL)
 * - Context-aware recommendations
 */

import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";
import type { Product } from "~/domains/storefront/popups-new/types";
import { getRedis, REDIS_PREFIXES } from "~/lib/redis.server";
import { apiVersion } from "~/shopify.server";
import { getEnv } from "~/lib/env.server";

// =============================================================================
// TYPES
// =============================================================================

export type RecommendationIntent = "RELATED" | "COMPLEMENTARY";

export interface RecommendationContext {
  /** Product ID the customer is viewing (e.g., on a product page) */
  currentProductId?: string;
  /** Product IDs in the customer's cart */
  cartProductIds?: string[];
  /** Collection handle the customer is browsing */
  collectionHandle?: string;
  /** What triggered the upsell (for strategy selection) */
  triggerType?: "product_view" | "cart" | "exit_intent" | "scroll" | "add_to_cart";
}

interface StorefrontAccessToken {
  accessToken: string;
  expiresAt?: number;
}

// Cache TTLs
const CACHE_TTL_SECONDS = 60; // 1 minute cache for recommendations
const STOREFRONT_TOKEN_CACHE_TTL = 86400; // 24 hours for storefront token

// =============================================================================
// STOREFRONT API CLIENT
// =============================================================================

/**
 * Get or create a Storefront Access Token for the shop
 * Caches the token in Redis for reuse
 */
async function getStorefrontAccessToken(
  admin: AdminApiContext,
  shopDomain: string
): Promise<string | null> {
  const redis = getRedis();
  const cacheKey = `${REDIS_PREFIXES.SESSION}:storefront_token:${shopDomain}`;

  // Check cache first
  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as StorefrontAccessToken;
        if (!parsed.expiresAt || parsed.expiresAt > Date.now()) {
          return parsed.accessToken;
        }
      }
    } catch (error) {
      console.warn("[Smart Recommendations] Failed to read token cache:", error);
    }
  }

  // Create new storefront access token via Admin API
  try {
    const CREATE_TOKEN_MUTATION = `#graphql
      mutation storefrontAccessTokenCreate($input: StorefrontAccessTokenInput!) {
        storefrontAccessTokenCreate(input: $input) {
          storefrontAccessToken {
            accessToken
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await admin.graphql(CREATE_TOKEN_MUTATION, {
      variables: {
        input: {
          title: "Revenue Boost Recommendations",
        },
      },
    });

    const body = await response.json();
    const token = body?.data?.storefrontAccessTokenCreate?.storefrontAccessToken?.accessToken;
    const errors = body?.data?.storefrontAccessTokenCreate?.userErrors;

    if (errors?.length) {
      console.error("[Smart Recommendations] Token creation errors:", errors);
      return null;
    }

    if (token && redis) {
      // Cache the token
      const tokenData: StorefrontAccessToken = {
        accessToken: token,
        expiresAt: Date.now() + STOREFRONT_TOKEN_CACHE_TTL * 1000,
      };
      await redis.setex(cacheKey, STOREFRONT_TOKEN_CACHE_TTL, JSON.stringify(tokenData));
    }

    return token || null;
  } catch (error) {
    console.error("[Smart Recommendations] Failed to create storefront token:", error);
    return null;
  }
}

/**
 * Make a Storefront API GraphQL request
 */
async function storefrontGraphQL<T>(
  shopDomain: string,
  storefrontToken: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<T | null> {
  try {
    const response = await fetch(
      `https://${shopDomain}/api/${apiVersion}/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Storefront-Access-Token": storefrontToken,
        },
        body: JSON.stringify({ query, variables }),
      }
    );

    if (!response.ok) {
      console.error("[Smart Recommendations] Storefront API error:", response.status);
      return null;
    }

    const body = await response.json();
    return body?.data as T;
  } catch (error) {
    console.error("[Smart Recommendations] Storefront API request failed:", error);
    return null;
  }
}

// =============================================================================
// SHOPIFY PRODUCT RECOMMENDATIONS (Storefront API)
// =============================================================================

const PRODUCT_RECOMMENDATIONS_QUERY = `#graphql
  query productRecommendations($productId: ID!, $intent: ProductRecommendationIntent!) {
    productRecommendations(productId: $productId, intent: $intent) {
      id
      title
      handle
      featuredImage {
        url
      }
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
      }
      compareAtPriceRange {
        minVariantPrice {
          amount
          currencyCode
        }
      }
      variants(first: 1) {
        nodes {
          id
        }
      }
    }
  }
`;

interface StorefrontRecommendationsResponse {
  productRecommendations: Array<{
    id: string;
    title: string;
    handle: string;
    featuredImage?: { url: string };
    priceRange: {
      minVariantPrice: { amount: string; currencyCode: string };
    };
    compareAtPriceRange: {
      minVariantPrice: { amount: string; currencyCode: string };
    };
    variants: {
      nodes: Array<{ id: string }>;
    };
  }> | null;
}

/**
 * Fetch product recommendations from Shopify's Storefront API
 * Uses Shopify's ML-powered recommendation engine
 */
export async function fetchShopifyRecommendations(
  admin: AdminApiContext,
  shopDomain: string,
  productId: string,
  intent: RecommendationIntent,
  limit: number,
  excludeProductIds: string[] = []
): Promise<Product[]> {
  const storefrontToken = await getStorefrontAccessToken(admin, shopDomain);
  if (!storefrontToken) {
    console.warn("[Smart Recommendations] No storefront token available");
    return [];
  }

  const cacheKey = `${REDIS_PREFIXES.RECOMMENDATIONS}:${shopDomain}:${productId}:${intent}`;
  const redis = getRedis();

  // Check cache
  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const products = JSON.parse(cached) as Product[];
        return products
          .filter((p) => !excludeProductIds.includes(p.id))
          .slice(0, limit);
      }
    } catch (error) {
      console.warn("[Smart Recommendations] Cache read error:", error);
    }
  }

  // Fetch from Storefront API
  const data = await storefrontGraphQL<StorefrontRecommendationsResponse>(
    shopDomain,
    storefrontToken,
    PRODUCT_RECOMMENDATIONS_QUERY,
    { productId, intent }
  );

  if (!data?.productRecommendations) {
    return [];
  }

  const products: Product[] = data.productRecommendations.map((p) => ({
    id: p.id,
    title: p.title,
    handle: p.handle,
    price: p.priceRange.minVariantPrice.amount,
    imageUrl: p.featuredImage?.url || "",
    compareAtPrice:
      parseFloat(p.compareAtPriceRange.minVariantPrice.amount) > 0
        ? p.compareAtPriceRange.minVariantPrice.amount
        : undefined,
    variantId: p.variants.nodes[0]?.id || "",
  }));

  // Cache results
  if (redis && products.length > 0) {
    try {
      await redis.setex(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(products));
    } catch (error) {
      console.warn("[Smart Recommendations] Cache write error:", error);
    }
  }

  return products
    .filter((p) => !excludeProductIds.includes(p.id))
    .slice(0, limit);
}


// =============================================================================
// BEST SELLERS (Admin API)
// =============================================================================

const BEST_SELLERS_QUERY = `#graphql
  query getBestSellers($first: Int!) {
    products(first: $first, sortKey: BEST_SELLING) {
      nodes {
        id
        title
        handle
        featuredImage {
          url
        }
        priceRangeV2 {
          minVariantPrice {
            amount
            currencyCode
          }
        }
        compareAtPriceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
        variants(first: 1) {
          nodes {
            id
          }
        }
      }
    }
  }
`;

interface AdminProductsResponse {
  products: {
    nodes: Array<{
      id: string;
      title: string;
      handle: string;
      featuredImage?: { url: string };
      priceRangeV2: {
        minVariantPrice: { amount: string; currencyCode: string };
      };
      compareAtPriceRange: {
        minVariantPrice: { amount: string; currencyCode: string };
      };
      variants: {
        nodes: Array<{ id: string }>;
      };
    }>;
  };
}

/**
 * Fetch best-selling products using Admin API
 * Uses actual sales data for popularity ranking
 */
export async function fetchBestSellers(
  admin: AdminApiContext,
  limit: number,
  excludeProductIds: string[] = []
): Promise<Product[]> {
  const fetchLimit = limit + excludeProductIds.length + 5; // Fetch extra to account for exclusions

  try {
    const response = await admin.graphql(BEST_SELLERS_QUERY, {
      variables: { first: fetchLimit },
    });

    const body = await response.json();
    const products = body?.data?.products?.nodes || [];

    return products
      .filter((p: { id: string }) => !excludeProductIds.includes(p.id))
      .slice(0, limit)
      .map((p: AdminProductsResponse["products"]["nodes"][0]) => ({
        id: p.id,
        title: p.title,
        handle: p.handle,
        price: p.priceRangeV2.minVariantPrice.amount,
        imageUrl: p.featuredImage?.url || "",
        compareAtPrice:
          parseFloat(p.compareAtPriceRange.minVariantPrice.amount) > 0
            ? p.compareAtPriceRange.minVariantPrice.amount
            : undefined,
        variantId: p.variants.nodes[0]?.id || "",
      }));
  } catch (error) {
    console.error("[Smart Recommendations] Best sellers fetch failed:", error);
    return [];
  }
}

// =============================================================================
// NEWEST PRODUCTS (Admin API) - Final Fallback
// =============================================================================

const NEWEST_PRODUCTS_QUERY = `#graphql
  query getNewestProducts($first: Int!) {
    products(first: $first, sortKey: CREATED_AT, reverse: true) {
      nodes {
        id
        title
        handle
        featuredImage {
          url
        }
        priceRangeV2 {
          minVariantPrice {
            amount
            currencyCode
          }
        }
        compareAtPriceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
        variants(first: 1) {
          nodes {
            id
          }
        }
      }
    }
  }
`;

/**
 * Fetch newest products as final fallback
 */
export async function fetchNewestProducts(
  admin: AdminApiContext,
  limit: number,
  excludeProductIds: string[] = []
): Promise<Product[]> {
  const fetchLimit = limit + excludeProductIds.length + 5;

  try {
    const response = await admin.graphql(NEWEST_PRODUCTS_QUERY, {
      variables: { first: fetchLimit },
    });

    const body = await response.json();
    const products = body?.data?.products?.nodes || [];

    return products
      .filter((p: { id: string }) => !excludeProductIds.includes(p.id))
      .slice(0, limit)
      .map((p: AdminProductsResponse["products"]["nodes"][0]) => ({
        id: p.id,
        title: p.title,
        handle: p.handle,
        price: p.priceRangeV2.minVariantPrice.amount,
        imageUrl: p.featuredImage?.url || "",
        compareAtPrice:
          parseFloat(p.compareAtPriceRange.minVariantPrice.amount) > 0
            ? p.compareAtPriceRange.minVariantPrice.amount
            : undefined,
        variantId: p.variants.nodes[0]?.id || "",
      }));
  } catch (error) {
    console.error("[Smart Recommendations] Newest products fetch failed:", error);
    return [];
  }
}


// =============================================================================
// SMART RECOMMENDATIONS ENGINE (Main Entry Point)
// =============================================================================

export interface SmartRecommendationsResult {
  products: Product[];
  source: "shopify_related" | "shopify_complementary" | "cart_based" | "best_sellers" | "newest";
  cached: boolean;
}

/**
 * Determine primary recommendation intent based on trigger type
 *
 * The strategy is:
 * - `product_view`, `exit_intent`, `scroll`: RELATED first (show similar products)
 * - `add_to_cart`, `cart`: COMPLEMENTARY first (cross-sell, "complete the look")
 *
 * This ensures the recommendation strategy matches user intent:
 * - Browsing/leaving → show alternatives they might like
 * - Adding to cart → show products that go well together
 */
function getPrimaryIntentForTrigger(
  triggerType?: RecommendationContext["triggerType"]
): RecommendationIntent {
  switch (triggerType) {
    case "add_to_cart":
    case "cart":
      // User is in buying mode - show complementary products
      return "COMPLEMENTARY";
    case "product_view":
    case "exit_intent":
    case "scroll":
    default:
      // User is browsing - show related/similar products
      return "RELATED";
  }
}

/**
 * Fetch smart product recommendations using a context-aware cascading strategy:
 *
 * The intent (RELATED vs COMPLEMENTARY) is selected based on triggerType:
 * - `product_view`, `exit_intent`, `scroll` → RELATED first (similar products)
 * - `add_to_cart`, `cart` → COMPLEMENTARY first (cross-sell)
 *
 * Cascading fallback order:
 * 1. Primary intent recommendations (if currentProductId provided)
 * 2. Secondary intent recommendations (if currentProductId provided)
 * 3. Cart-based COMPLEMENTARY recommendations (if cart has items)
 * 4. Best-selling products
 * 5. Newest products (final fallback)
 *
 * All results are cached in Redis for 60 seconds.
 */
export async function fetchSmartRecommendations(
  admin: AdminApiContext,
  shopDomain: string,
  context: RecommendationContext,
  limit: number
): Promise<SmartRecommendationsResult> {
  const excludeProductIds = [
    ...(context.currentProductId ? [context.currentProductId] : []),
    ...(context.cartProductIds || []),
  ];

  // Build cache key from context
  const contextKey = [
    context.currentProductId || "no-product",
    context.cartProductIds?.join("-") || "no-cart",
    context.triggerType || "unknown",
  ].join(":");
  const cacheKey = `${REDIS_PREFIXES.RECOMMENDATIONS}:smart:${shopDomain}:${contextKey}:${limit}`;

  const redis = getRedis();

  // Check cache first
  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const result = JSON.parse(cached) as SmartRecommendationsResult;
        console.log(
          `[Smart Recommendations] Cache HIT for ${context.triggerType || "unknown"} trigger, source: ${result.source}`
        );
        return { ...result, cached: true };
      }
    } catch (error) {
      console.warn("[Smart Recommendations] Cache read error:", error);
    }
  }

  let products: Product[] = [];
  let source: SmartRecommendationsResult["source"] = "newest";

  // Determine intent order based on trigger type
  const primaryIntent = getPrimaryIntentForTrigger(context.triggerType);
  const secondaryIntent: RecommendationIntent = primaryIntent === "RELATED" ? "COMPLEMENTARY" : "RELATED";

  console.log(
    `[Smart Recommendations] Trigger: ${context.triggerType || "unknown"} → Primary intent: ${primaryIntent}, Secondary: ${secondaryIntent}`
  );

  // Strategy 1: Primary intent recommendations (if viewing a product)
  if (context.currentProductId && products.length < limit) {
    console.log(`[Smart Recommendations] Trying Shopify ${primaryIntent} for:`, context.currentProductId);
    const primaryResults = await fetchShopifyRecommendations(
      admin,
      shopDomain,
      context.currentProductId,
      primaryIntent,
      limit,
      excludeProductIds
    );
    if (primaryResults.length > 0) {
      products = primaryResults;
      source = primaryIntent === "RELATED" ? "shopify_related" : "shopify_complementary";
    }
  }

  // Strategy 2: Secondary intent recommendations (if viewing a product)
  if (context.currentProductId && products.length < limit) {
    console.log(`[Smart Recommendations] Trying Shopify ${secondaryIntent} for:`, context.currentProductId);
    const secondaryResults = await fetchShopifyRecommendations(
      admin,
      shopDomain,
      context.currentProductId,
      secondaryIntent,
      limit - products.length,
      [...excludeProductIds, ...products.map((p) => p.id)]
    );
    if (secondaryResults.length > 0) {
      if (products.length === 0) {
        products = secondaryResults;
        source = secondaryIntent === "RELATED" ? "shopify_related" : "shopify_complementary";
      } else {
        // Merge with existing products
        products = [...products, ...secondaryResults].slice(0, limit);
      }
    }
  }

  // Strategy 3: Cart-based COMPLEMENTARY recommendations
  if (context.cartProductIds?.length && products.length < limit) {
    console.log("[Smart Recommendations] Trying cart-based recommendations");
    // Get recommendations for the first cart item (most recently added)
    const cartProductId = context.cartProductIds[0];
    const cartBased = await fetchShopifyRecommendations(
      admin,
      shopDomain,
      cartProductId,
      "COMPLEMENTARY",
      limit - products.length,
      [...excludeProductIds, ...products.map((p) => p.id)]
    );
    if (cartBased.length > 0) {
      if (products.length === 0) {
        products = cartBased;
        source = "cart_based";
      } else {
        products = [...products, ...cartBased].slice(0, limit);
      }
    }
  }

  // Strategy 4: Best-selling products fallback
  if (products.length < limit) {
    console.log("[Smart Recommendations] Falling back to best sellers");
    const bestSellers = await fetchBestSellers(
      admin,
      limit - products.length,
      [...excludeProductIds, ...products.map((p) => p.id)]
    );
    if (bestSellers.length > 0) {
      if (products.length === 0) {
        products = bestSellers;
        source = "best_sellers";
      } else {
        products = [...products, ...bestSellers].slice(0, limit);
      }
    }
  }

  // Strategy 5: Newest products (final fallback)
  if (products.length < limit) {
    console.log("[Smart Recommendations] Final fallback to newest products");
    const newest = await fetchNewestProducts(
      admin,
      limit - products.length,
      [...excludeProductIds, ...products.map((p) => p.id)]
    );
    if (newest.length > 0) {
      if (products.length === 0) {
        products = newest;
        source = "newest";
      } else {
        products = [...products, ...newest].slice(0, limit);
      }
    }
  }

  const result: SmartRecommendationsResult = {
    products,
    source,
    cached: false,
  };

  // Cache the result
  if (redis && products.length > 0) {
    try {
      await redis.setex(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(result));
    } catch (error) {
      console.warn("[Smart Recommendations] Cache write error:", error);
    }
  }

  console.log(
    `[Smart Recommendations] Returning ${products.length} products from source: ${source} (trigger: ${context.triggerType || "unknown"})`
  );

  // Track analytics (fire-and-forget, don't block response)
  trackRecommendationSource(shopDomain, source, context.triggerType).catch(() => {
    // Ignore tracking errors
  });

  return result;
}

// =============================================================================
// ANALYTICS TRACKING
// =============================================================================

/**
 * Track recommendation source usage for analytics
 *
 * Uses Redis sorted sets to track:
 * - Source usage counts (which sources are being used)
 * - Trigger type distribution (what triggers lead to which sources)
 *
 * Data is stored with hourly granularity for time-series analysis.
 */
export async function trackRecommendationSource(
  shopDomain: string,
  source: SmartRecommendationsResult["source"],
  triggerType?: RecommendationContext["triggerType"]
): Promise<void> {
  // Check if analytics tracking is enabled
  const env = getEnv();
  if (!env.ENABLE_RECOMMENDATION_ANALYTICS) return;

  const redis = getRedis();
  if (!redis) return;

  try {
    const now = new Date();
    const hourKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}-${String(now.getUTCHours()).padStart(2, "0")}`;
    const dayKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;

    // Track source usage (hourly)
    const sourceKey = `${REDIS_PREFIXES.RECOMMENDATIONS}:analytics:source:${shopDomain}:${hourKey}`;
    await redis.hincrby(sourceKey, source, 1);
    await redis.expire(sourceKey, 86400 * 7); // Keep for 7 days

    // Track source usage (daily totals)
    const dailySourceKey = `${REDIS_PREFIXES.RECOMMENDATIONS}:analytics:source:${shopDomain}:daily:${dayKey}`;
    await redis.hincrby(dailySourceKey, source, 1);
    await redis.expire(dailySourceKey, 86400 * 30); // Keep for 30 days

    // Track trigger type → source mapping (for understanding which triggers use which sources)
    if (triggerType) {
      const triggerKey = `${REDIS_PREFIXES.RECOMMENDATIONS}:analytics:trigger:${shopDomain}:${dayKey}`;
      await redis.hincrby(triggerKey, `${triggerType}:${source}`, 1);
      await redis.expire(triggerKey, 86400 * 30); // Keep for 30 days
    }

    // Track global totals (all-time)
    const globalKey = `${REDIS_PREFIXES.RECOMMENDATIONS}:analytics:global:${shopDomain}`;
    await redis.hincrby(globalKey, source, 1);
    await redis.hincrby(globalKey, "total", 1);
  } catch (error) {
    // Don't throw - analytics should never break the main flow
    console.warn("[Smart Recommendations] Analytics tracking error:", error);
  }
}

/**
 * Get recommendation analytics for a shop
 *
 * Returns source usage statistics for the specified time period.
 */
export interface RecommendationAnalytics {
  /** Total recommendations served */
  total: number;
  /** Breakdown by source */
  bySource: Record<SmartRecommendationsResult["source"], number>;
  /** Breakdown by trigger type → source */
  byTrigger: Record<string, Record<string, number>>;
  /** Cache hit rate (if available) */
  cacheHitRate?: number;
}

export async function getRecommendationAnalytics(
  shopDomain: string,
  days: number = 7
): Promise<RecommendationAnalytics | null> {
  // Check if analytics tracking is enabled
  const env = getEnv();
  if (!env.ENABLE_RECOMMENDATION_ANALYTICS) return null;

  const redis = getRedis();
  if (!redis) return null;

  try {
    const now = new Date();
    const bySource: Record<string, number> = {
      shopify_related: 0,
      shopify_complementary: 0,
      cart_based: 0,
      best_sellers: 0,
      newest: 0,
    };
    const byTrigger: Record<string, Record<string, number>> = {};

    // Aggregate daily data for the specified period
    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;

      // Get source data
      const dailySourceKey = `${REDIS_PREFIXES.RECOMMENDATIONS}:analytics:source:${shopDomain}:daily:${dayKey}`;
      const sourceData = await redis.hgetall(dailySourceKey);
      for (const [source, count] of Object.entries(sourceData)) {
        bySource[source] = (bySource[source] || 0) + parseInt(count, 10);
      }

      // Get trigger data
      const triggerKey = `${REDIS_PREFIXES.RECOMMENDATIONS}:analytics:trigger:${shopDomain}:${dayKey}`;
      const triggerData = await redis.hgetall(triggerKey);
      for (const [key, count] of Object.entries(triggerData)) {
        const [trigger, source] = key.split(":");
        if (!byTrigger[trigger]) {
          byTrigger[trigger] = {};
        }
        byTrigger[trigger][source] = (byTrigger[trigger][source] || 0) + parseInt(count, 10);
      }
    }

    const total = Object.values(bySource).reduce((sum, count) => sum + count, 0);

    return {
      total,
      bySource: bySource as RecommendationAnalytics["bySource"],
      byTrigger,
    };
  } catch (error) {
    console.error("[Smart Recommendations] Failed to get analytics:", error);
    return null;
  }
}
