/**
 * Active Campaigns API Route (Storefront)
 *
 * Public API endpoint for storefront to fetch active campaigns
 * This is used by the popup system to determine which campaigns to show
 *
 * GET /api/campaigns/active?shop=store.myshopify.com
 */

import {
  data,
  type LoaderFunctionArgs,
} from "react-router";
import { storefrontCors } from "~/lib/cors.server";
import {
  CampaignService,
  CampaignFilterService,
  buildStorefrontContext,
} from "~/domains/campaigns/index.server";
import type { ApiCampaignData } from "~/lib/api-types";
import { createApiResponse } from "~/lib/api-types";
import { handleApiError } from "~/lib/api-error-handler.server";
import { getStoreIdFromShop } from "~/lib/auth-helpers.server";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Response structure for active campaigns endpoint
 */
interface ActiveCampaignsResponse {
  campaigns: ApiCampaignData[];
  timestamp: string;
}

// ============================================================================
// LOADER (GET /api/campaigns/active)
// ============================================================================

export async function loader({ request }: LoaderFunctionArgs) {
  const headers = storefrontCors();

  try {
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");

    if (!shop) {
      return data(
        createApiResponse(false, undefined, "Shop parameter is required"),
        { status: 400, headers }
      );
    }

    const storeId = getStoreIdFromShop(shop);

    // Build storefront context from request
    const context = buildStorefrontContext(url.searchParams, request.headers);

    // Get all active campaigns
    const allCampaigns = await CampaignService.getActiveCampaigns(storeId);

    // Filter campaigns based on context (server-side filtering)
    const filteredCampaigns = CampaignFilterService.filterCampaigns(
      allCampaigns,
      context
    );

    // Format campaigns for storefront consumption
    // Only send client-side triggers, not full targetRules
    const formattedCampaigns = filteredCampaigns.map(campaign => ({
      id: campaign.id,
      name: campaign.name,
      templateType: campaign.templateType,
      priority: campaign.priority,
      contentConfig: campaign.contentConfig,
      designConfig: campaign.designConfig,
      // Extract only client-side triggers
      clientTriggers: extractClientTriggers(campaign.targetRules),
      targetRules: {} as Record<string, unknown>,
      discountConfig: campaign.discountConfig,
    }));

    const response: ActiveCampaignsResponse = {
      campaigns: formattedCampaigns,
      timestamp: new Date().toISOString(),
    };

    return data(response, { headers });
  } catch (error) {
    return handleApiError(error, "GET /api/campaigns/active");
  }
}

/**
 * Extract client-side triggers from targetRules
 * Server-side rules (audience, page targeting) are already filtered
 */
function extractClientTriggers(targetRules: any) {
  if (!targetRules) return {};

  const { enhancedTriggers } = targetRules;

  return {
    enhancedTriggers: enhancedTriggers || {},
  };
}

