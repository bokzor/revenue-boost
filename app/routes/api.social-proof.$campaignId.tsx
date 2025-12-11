/**
 * Social Proof API Endpoint
 *
 * GET /api/social-proof/:campaignId
 * Returns real-time social proof notifications for a campaign
 *
 * Features:
 * - Real purchase notifications from Shopify orders
 * - Live visitor counts from Redis
 * - Sales statistics (24-hour window)
 * - Smart caching (30 seconds)
 * - Privacy-compliant (anonymized data)
 */

import type { LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { SocialProofService } from "~/domains/social-proof/services/social-proof.server";
import { storefrontCors } from "~/lib/cors.server";
import { getStoreIdFromShop } from "~/lib/auth-helpers.server";
import { logger } from "~/lib/logger.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { campaignId } = params;

  if (!campaignId) {
    return data(
      { success: false, error: "Campaign ID is required" },
      { status: 400, headers: storefrontCors() }
    );
  }

  try {
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");
    const productId = url.searchParams.get("productId");
    const pageUrl = url.searchParams.get("pageUrl");

    if (!shop) {
      return data(
        { success: false, error: "Shop parameter is required" },
        { status: 400, headers: storefrontCors() }
      );
    }

    const storeId = await getStoreIdFromShop(shop);

    // Fetch social proof notifications
    const notifications = await SocialProofService.getNotifications({
      campaignId,
      storeId,
      productId: productId || undefined,
      pageUrl: pageUrl || undefined,
    });

    return data(
      {
        success: true,
        notifications,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          ...storefrontCors(),
          "Cache-Control": "public, max-age=30", // Cache for 30 seconds
        },
      }
    );
  } catch (error) {
    logger.error({ error }, "[Social Proof API] Error");
    return data(
      {
        success: false,
        error: "Failed to fetch social proof notifications",
        notifications: [],
      },
      { status: 500, headers: storefrontCors() }
    );
  }
}
