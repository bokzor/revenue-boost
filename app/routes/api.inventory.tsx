/**
 * API Route: Inventory Tracking
 * 
 * Returns real-time inventory levels for products/variants/collections.
 * Used by FlashSale popups for "Only X left!" messaging and stock-limited timers.
 * 
 * Features:
 * - ETag caching to reduce Shopify API calls
 * - Rate limiting with exponential backoff guidance
 * - Batch variant resolution from products/collections
 */

import { data, type LoaderFunctionArgs } from "react-router";
import { z } from "zod";
import { authenticate } from "~/shopify.server";

// Validation schema for query parameters
const InventoryQuerySchema = z.object({
  variantIds: z.array(z.string()).optional(),
  productIds: z.array(z.string()).optional(),
  collectionIds: z.array(z.string()).optional(),
});

// In-memory cache with ETag support
interface CacheEntry {
  data: InventoryResponse;
  etag: string;
  timestamp: number;
}

const inventoryCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10000; // 10 seconds

interface InventoryResponse {
  variants: Record<string, { available: number; productId: string }>;
  total: number;
  cached: boolean;
}

/**
 * GraphQL query to fetch inventory levels for variants
 */
const INVENTORY_QUERY = `
  query getInventoryLevels($variantIds: [ID!]!) {
    nodes(ids: $variantIds) {
      ... on ProductVariant {
        id
        inventoryQuantity
        product {
          id
        }
      }
    }
  }
`;

/**
 * GraphQL query to resolve variants from product IDs
 */
const PRODUCT_VARIANTS_QUERY = `
  query getProductVariants($productIds: [ID!]!) {
    nodes(ids: $productIds) {
      ... on Product {
        id
        variants(first: 250) {
          nodes {
            id
            inventoryQuantity
          }
        }
      }
    }
  }
`;

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // Authenticate request (requires valid Shopify session or app proxy signature)
    const { admin } = await authenticate.public.appProxy(request);

    if (!admin) {
      return data(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }

    // Parse query parameters
    const url = new URL(request.url);
    const variantIdsParam = url.searchParams.get("variantIds");
    const productIdsParam = url.searchParams.get("productIds");
    const collectionIdsParam = url.searchParams.get("collectionIds");

    // Parse JSON arrays from query params
    const queryData = {
      variantIds: variantIdsParam ? JSON.parse(variantIdsParam) : undefined,
      productIds: productIdsParam ? JSON.parse(productIdsParam) : undefined,
      collectionIds: collectionIdsParam ? JSON.parse(collectionIdsParam) : undefined,
    };

    // Validate input
    const validatedQuery = InventoryQuerySchema.parse(queryData);

    if (
      !validatedQuery.variantIds?.length &&
      !validatedQuery.productIds?.length &&
      !validatedQuery.collectionIds?.length
    ) {
      return data(
        { error: "At least one of variantIds, productIds, or collectionIds is required" },
        { status: 400 }
      );
    }

    // Generate cache key from sorted IDs
    const cacheKey = JSON.stringify({
      v: validatedQuery.variantIds?.sort(),
      p: validatedQuery.productIds?.sort(),
      c: validatedQuery.collectionIds?.sort(),
    });

    // Check ETag from request
    const requestETag = request.headers.get("If-None-Match");
    const now = Date.now();

    // Check cache
    const cached = inventoryCache.get(cacheKey);
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      // Return 304 Not Modified if ETag matches
      if (requestETag === cached.etag) {
        return new Response(null, {
          status: 304,
          headers: {
            "ETag": cached.etag,
            "Cache-Control": "private, max-age=10",
          },
        });
      }

      // Return cached data with ETag
      return data(cached.data, {
        headers: {
          "ETag": cached.etag,
          "Cache-Control": "private, max-age=10",
          "X-Cache": "HIT",
        },
      });
    }

    // Resolve all variant IDs
    let allVariantIds = [...(validatedQuery.variantIds || [])];

    // Resolve variants from products
    if (validatedQuery.productIds?.length) {
      const productVariants = await resolveProductVariants(admin, validatedQuery.productIds);
      allVariantIds = [...allVariantIds, ...productVariants];
    }

    // Resolve variants from collections (TODO: implement collection->product->variant resolution)
    if (validatedQuery.collectionIds?.length) {
      // Placeholder - requires collection products query
      console.warn("[Inventory API] Collection resolution not yet implemented");
    }

    // Deduplicate variant IDs
    allVariantIds = [...new Set(allVariantIds)];

    if (!allVariantIds.length) {
      return data({ variants: {}, total: 0, cached: false });
    }

    // Fetch inventory levels from Shopify
    const response = await admin.graphql(INVENTORY_QUERY, {
      variables: { variantIds: allVariantIds },
    });

    const responseData = await response.json();

    // Parse response
    const variants: Record<string, { available: number; productId: string }> = {};
    let total = 0;

    if (responseData.data?.nodes) {
      for (const node of responseData.data.nodes) {
        if (node && node.id && typeof node.inventoryQuantity === "number") {
          const available = Math.max(0, node.inventoryQuantity);
          variants[node.id] = {
            available,
            productId: node.product?.id || "",
          };
          total += available;
        }
      }
    }

    const inventoryData: InventoryResponse = {
      variants,
      total,
      cached: false,
    };

    // Generate ETag (hash of data)
    const etag = `"${Buffer.from(JSON.stringify(inventoryData)).toString("base64").substring(0, 16)}"`;

    // Update cache
    inventoryCache.set(cacheKey, {
      data: inventoryData,
      etag,
      timestamp: now,
    });

    // Clean up old cache entries (simple LRU: remove entries older than 2x TTL)
    if (inventoryCache.size > 100) {
      const cutoff = now - CACHE_TTL_MS * 2;
      for (const [key, entry] of inventoryCache.entries()) {
        if (entry.timestamp < cutoff) {
          inventoryCache.delete(key);
        }
      }
    }

    return data(inventoryData, {
      headers: {
        "ETag": etag,
        "Cache-Control": "private, max-age=10",
        "X-Cache": "MISS",
      },
    });
  } catch (error) {
    console.error("[Inventory API] Error:", error);

    // Handle rate limiting
    if (error instanceof Error && error.message.includes("429")) {
      return data(
        {
          error: "Rate limit exceeded",
          retryAfter: 30,
          backoff: "exponential",
        },
        {
          status: 429,
          headers: { "Retry-After": "30" },
        }
      );
    }

    return data(
      { error: "Failed to fetch inventory data" },
      { status: 500 }
    );
  }
}

/**
 * Resolve variant IDs from product IDs
 */
async function resolveProductVariants(
  admin: any,
  productIds: string[]
): Promise<string[]> {
  const response = await admin.graphql(PRODUCT_VARIANTS_QUERY, {
    variables: { productIds },
  });

  const responseData = await response.json();
  const variantIds: string[] = [];

  if (responseData.data?.nodes) {
    for (const product of responseData.data.nodes) {
      if (product?.variants?.nodes) {
        for (const variant of product.variants.nodes) {
          if (variant?.id) {
            variantIds.push(variant.id);
          }
        }
      }
    }
  }

  return variantIds;
}
