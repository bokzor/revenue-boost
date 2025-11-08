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
import { CampaignService } from "~/domains/campaigns/index.server";
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
    const campaigns = await CampaignService.getActiveCampaigns(storeId);

    // Format campaigns for storefront consumption
    const formattedCampaigns = campaigns.map(campaign => ({
      id: campaign.id,
      name: campaign.name,
      templateType: campaign.templateType,
      priority: campaign.priority,
      contentConfig: campaign.contentConfig,
      designConfig: campaign.designConfig,
      targetRules: campaign.targetRules,
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

