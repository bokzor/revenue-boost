/**
 * API Route: Upsell Products
 *
 * Given a campaignId, returns a list of products to display in the
 * Product Upsell popup, based on the campaign's contentConfig.
 *
 * v1 behaviour:
 * - If productSelectionMethod === "manual": fetch those products by ID
 * - If productSelectionMethod === "collection": TODO (not implemented yet)
 * - Else ("ai" or missing): returns empty list (front-end can fall back)
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
  fetchPopularProducts,
} from "~/domains/commerce/services/upsell.server";

const QuerySchema = z.object({
  campaignId: z.string().min(1, "campaignId is required"),
  // Optional: Cart context for better AI recommendations
  cartProductIds: z.string().nullable().optional(), // Comma-separated product IDs in cart
});

interface UpsellProductsResponse {
  products: Product[];
}

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    const parsed = QuerySchema.safeParse({
      campaignId: searchParams.get("campaignId"),
      cartProductIds: searchParams.get("cartProductIds"),
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

    const contentConfig = (campaign as any).contentConfig || {};
    const method = contentConfig.productSelectionMethod || "ai";

    // Manual: expect selectedProducts to contain Shopify product IDs / GIDs
    if (method === "manual") {
      const selected: string[] = Array.isArray(contentConfig.selectedProducts)
        ? contentConfig.selectedProducts
        : [];

      if (!selected.length) {
        const empty: UpsellProductsResponse = { products: [] };
        return data(empty);
      }

      const products = await fetchProductsByIds(admin, selected);
      const payload: UpsellProductsResponse = { products };
      return data(payload);
    }

    // Collection mode: resolve products from the configured collection
    if (method === "collection") {
      const collectionKey: string | undefined = contentConfig.selectedCollection;

      if (!collectionKey) {
        return data({ products: [] } satisfies UpsellProductsResponse);
      }

      const maxProducts: number =
        typeof contentConfig.maxProducts === "number" ? contentConfig.maxProducts : 3;

      const products = await fetchProductsByCollection(admin, collectionKey, maxProducts);
      return data({ products } satisfies UpsellProductsResponse);
    }

    // AI / Smart Recommendations: Fetch popular/recent products as fallback
    // TODO: Implement proper AI-based recommendations using cart context, browsing history, etc.
    if (method === "ai") {
      console.log("[Upsell Products API] Using smart recommendations");

      const maxProducts: number =
        typeof contentConfig.maxProducts === "number" ? contentConfig.maxProducts : 4;

      // Parse cart product IDs if provided (for context-aware recommendations)
      const cartProductIds: string[] =
        parsed.data.cartProductIds && typeof parsed.data.cartProductIds === "string"
          ? parsed.data.cartProductIds.split(",").filter((id) => id.trim())
          : [];

      console.log("[Upsell Products API] Cart context:", {
        cartProductIds,
        count: cartProductIds.length,
      });

      const products = await fetchPopularProducts(admin, maxProducts, cartProductIds);

      // If no products found, return empty (hook will fail and popup won't show)
      if (!products || products.length === 0) {
        console.warn("[Upsell Products API] No products available for smart recommendations");
        return data({ products: [] } satisfies UpsellProductsResponse);
      }

      return data({ products } satisfies UpsellProductsResponse);
    }

    // Unknown method: return empty
    return data({ products: [] } satisfies UpsellProductsResponse);
  } catch (error) {
    console.error("[Upsell Products API] Error:", error);
    return data({ error: "Failed to resolve upsell products" }, { status: 500 });
  }
}
