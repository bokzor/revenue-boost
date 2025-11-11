/**
 * Social Proof Tracking API
 *
 * POST /api/social-proof/track
 * Tracks visitor activity for real-time social proof
 *
 * Events:
 * - page_view: Track visitor viewing a page/product
 * - add_to_cart: Track add-to-cart events
 * - product_view: Track product page views
 */

import type { ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import { VisitorTrackingService } from "~/domains/social-proof/services/visitor-tracking.server";
import { storefrontCors } from "~/lib/cors.server";
import { getStoreIdFromShop } from "~/lib/auth-helpers.server";
import { getOrCreateVisitorId } from "~/lib/visitor-id.server";

interface TrackEventBody {
  eventType: 'page_view' | 'product_view' | 'add_to_cart';
  productId?: string;
  pageUrl?: string;
  shop: string;
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return data(
      { success: false, error: "Method not allowed" },
      { status: 405, headers: storefrontCors() }
    );
  }

  try {
    const body: TrackEventBody = await request.json();
    const { eventType, productId, pageUrl, shop } = body;

    if (!shop) {
      return data(
        { success: false, error: "Shop parameter is required" },
        { status: 400, headers: storefrontCors() }
      );
    }

    // Get or create visitor ID
    const visitorId = await getOrCreateVisitorId(request);
    const storeId = getStoreIdFromShop(shop);

    // Track the event
    switch (eventType) {
      case 'page_view':
      case 'product_view':
        await VisitorTrackingService.trackVisitorView({
          storeId,
          productId,
          visitorId,
        });
        break;

      case 'add_to_cart':
        if (!productId) {
          return data(
            { success: false, error: "Product ID required for add_to_cart events" },
            { status: 400, headers: storefrontCors() }
          );
        }
        await VisitorTrackingService.trackCartActivity({
          storeId,
          productId,
          visitorId,
        });
        break;

      default:
        return data(
          { success: false, error: "Invalid event type" },
          { status: 400, headers: storefrontCors() }
        );
    }

    return data(
      { success: true },
      { headers: storefrontCors() }
    );
  } catch (error) {
    console.error("[Social Proof Track API] Error:", error);
    return data(
      { success: false, error: "Failed to track event" },
      { status: 500, headers: storefrontCors() }
    );
  }
}

