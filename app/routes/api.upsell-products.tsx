/**
 * API Route: Upsell Products
 *
 * Given a campaignId, returns a list of products to display in the
 * Product Upsell popup, based on the campaign's contentConfig.
 *
 * Product Selection Methods:
 * - "manual": Fetch specific products by ID
 * - "collection": Fetch products from a specific collection
 * - "ai" (default): Smart recommendations using cascading strategy:
 *   1. Shopify's RELATED recommendations (if currentProductId provided)
 *   2. Shopify's COMPLEMENTARY recommendations
 *   3. Cart-based complementary products
 *   4. Best-selling products
 *   5. Newest products (final fallback)
 */

import { data, type LoaderFunctionArgs } from "react-router";
import { z } from "zod";
import { authenticate } from "~/shopify.server";
import { getStoreIdFromShop } from "~/lib/auth-helpers.server";
import { CampaignService } from "~/domains/campaigns/index.server";
import type { Product } from "~/domains/storefront/popups-new/types";
import {
  fetchProductsByIds,
  fetchProductsByCollection,
} from "~/domains/commerce/services/upsell.server";
import { logger } from "~/lib/logger.server";
import {
  fetchSmartRecommendations,
  type RecommendationContext,
} from "~/domains/commerce/services/smart-recommendations.server";

const QuerySchema = z.object({
  campaignId: z.string().min(1, "campaignId is required"),
  // Optional: Cart context for better AI recommendations
  cartProductIds: z.string().nullable().optional(), // Comma-separated product IDs in cart
  // Optional: Current product being viewed (for related recommendations)
  currentProductId: z.string().nullable().optional(), // Shopify product GID
  // Optional: Trigger type for strategy selection
  triggerType: z.enum(["product_view", "cart", "exit_intent", "scroll", "add_to_cart"]).nullable().optional(),
});

interface UpsellProductsResponse {
  products: Product[];
  /** Source of recommendations (for analytics/debugging) */
  source?: "manual" | "collection" | "shopify_related" | "shopify_complementary" | "cart_based" | "best_sellers" | "newest";
  /** Whether the result was served from cache */
  cached?: boolean;
}

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    const parsed = QuerySchema.safeParse({
      campaignId: searchParams.get("campaignId"),
      cartProductIds: searchParams.get("cartProductIds"),
      currentProductId: searchParams.get("currentProductId"),
      triggerType: searchParams.get("triggerType"),
    });

    if (!parsed.success) {
      return data({ error: "Invalid query", details: parsed.error.format() }, { status: 400 });
    }

    const { campaignId } = parsed.data;

    const shop = searchParams.get("shop");
    if (!shop) {
      return data({ error: "Missing shop parameter" }, { status: 400 });
    }

    // Authenticate via app proxy (public storefront)
    const { admin } = await authenticate.public.appProxy(request);
    if (!admin) {
      return data({ error: "Authentication failed" }, { status: 401 });
    }

    const storeId = await getStoreIdFromShop(shop);

    // Load campaign so we can read contentConfig
    const campaign = await CampaignService.getCampaignById(campaignId, storeId);
    if (!campaign) {
      return data({ error: "Campaign not found" }, { status: 404 });
    }

    const contentConfig = (campaign as { contentConfig?: Record<string, unknown> }).contentConfig || {};
    const method = contentConfig.productSelectionMethod || "ai";

    // Manual: expect selectedProducts to contain Shopify product IDs / GIDs
    if (method === "manual") {
      const selected: string[] = Array.isArray(contentConfig.selectedProducts)
        ? contentConfig.selectedProducts
        : [];

      if (!selected.length) {
        return data({ products: [], source: "manual" } satisfies UpsellProductsResponse);
      }

      const products = await fetchProductsByIds(admin, selected);
      return data({ products, source: "manual" } satisfies UpsellProductsResponse);
    }

    // Collection mode: resolve products from the configured collection
    if (method === "collection") {
      const collectionKey = contentConfig.selectedCollection as string | undefined;

      if (!collectionKey) {
        return data({ products: [], source: "collection" } satisfies UpsellProductsResponse);
      }

      const maxProducts: number =
        typeof contentConfig.maxProducts === "number" ? contentConfig.maxProducts : 3;

      const products = await fetchProductsByCollection(admin, collectionKey, maxProducts);
      return data({ products, source: "collection" } satisfies UpsellProductsResponse);
    }

    // AI / Smart Recommendations: Use cascading strategy
    if (method === "ai") {
      logger.debug("[Upsell Products API] Using smart recommendations");

      const maxProducts: number =
        typeof contentConfig.maxProducts === "number" ? contentConfig.maxProducts : 4;

      // Parse cart product IDs if provided (for context-aware recommendations)
      const cartProductIds: string[] =
        parsed.data.cartProductIds && typeof parsed.data.cartProductIds === "string"
          ? parsed.data.cartProductIds.split(",").filter((id) => id.trim())
          : [];

      // Build recommendation context
      const context: RecommendationContext = {
        currentProductId: parsed.data.currentProductId || undefined,
        cartProductIds: cartProductIds.length > 0 ? cartProductIds : undefined,
        triggerType: parsed.data.triggerType || undefined,
      };

      logger.debug({ context }, "[Upsell Products API] Recommendation context");

      // Use the new smart recommendations engine
      const result = await fetchSmartRecommendations(admin, shop, context, maxProducts);

      logger.debug({
        productCount: result.products.length,
        source: result.source,
        cached: result.cached,
      }, "[Upsell Products API] Smart recommendations result");

      // If no products found, return empty (hook will fail and popup won't show)
      if (!result.products || result.products.length === 0) {
        logger.warn("[Upsell Products API] No products available for smart recommendations");
        return data({ products: [], source: "newest" } satisfies UpsellProductsResponse);
      }

      return data({
        products: result.products,
        source: result.source,
        cached: result.cached,
      } satisfies UpsellProductsResponse);
    }

    // Unknown method: return empty
    return data({ products: [] } satisfies UpsellProductsResponse);
  } catch (error) {
    logger.error({ error }, "[Upsell Products API] Error");
    return data({ error: "Failed to resolve upsell products" }, { status: 500 });
  }
}
