/**
 * Active Campaigns API Route (Storefront)
 *
 * Public API endpoint for storefront to fetch active campaigns
 * This is used by the popup system to determine which campaigns to show
 *
 * GET /api/campaigns/active?shop=store.myshopify.com
 *
 * PROTECTED: Rate limited to 60 requests/minute per IP (public endpoint)
 */

import {
  data,
  type LoaderFunctionArgs,
} from "react-router";
import { storefrontCors } from "~/lib/cors.server";
import { withPublicRateLimit } from "~/lib/rate-limit-middleware.server";
import {
  CampaignService,
  CampaignFilterService,
  buildStorefrontContext,
} from "~/domains/campaigns/index.server";
import type { ApiCampaignData } from "~/lib/api-types";
import { handleApiError } from "~/lib/api-error-handler.server";
import { getStoreIdFromShop } from "~/lib/auth-helpers.server";
import { PlanLimitError } from "~/domains/billing/errors";
import { getOrCreateVisitorId, createVisitorIdHeaders } from "~/lib/visitor-id.server";
import { getRedis, REDIS_PREFIXES } from "~/lib/redis.server";

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

export async function loader(args: LoaderFunctionArgs) {
  return withPublicRateLimit(args, async ({ request }) => {
    // Get or create visitor ID from cookie
    const visitorId = await getOrCreateVisitorId(request);

    // Create headers with visitor ID cookie
    const headers = await createVisitorIdHeaders(visitorId, storefrontCors());

    try {
      const url = new URL(request.url);
      const shop = url.searchParams.get("shop");

      if (!shop) {
        const errorResponse: ActiveCampaignsResponse = {
          campaigns: [],
          timestamp: new Date().toISOString(),
        };
        return data(errorResponse, { status: 400, headers });
      }

	      const storeId = await getStoreIdFromShop(shop);

	      // If the store has exceeded its monthly impression cap, gracefully
	      // return no campaigns instead of an error so storefronts fail soft.
	      try {
	        const { PlanGuardService } = await import("~/domains/billing/services/plan-guard.server");
	        await PlanGuardService.assertWithinMonthlyImpressionCap(storeId);
	      } catch (error) {
	        if (error instanceof PlanLimitError) {
	          const emptyResponse: ActiveCampaignsResponse = {
	            campaigns: [],
	            timestamp: new Date().toISOString(),
	          };
	          return data(emptyResponse, { headers });
	        }
	        throw error;
	      }

	      // Build storefront context from request
      const context = buildStorefrontContext(url.searchParams, request.headers);

      // Add visitor ID to context (for frequency capping)
      context.visitorId = visitorId;

      // Preview mode: check for preview token (unsaved campaign) or previewId (saved campaign)
      const previewToken = url.searchParams.get("previewToken");
      const previewId = url.searchParams.get("previewId");

      console.log(`[Active Campaigns API] 🔍 Full URL:`, url.toString());
      console.log(`[Active Campaigns API] 🔍 All URL params:`, Object.fromEntries(url.searchParams.entries()));
      console.log(`[Active Campaigns API] Request params:`, {
        previewToken: previewToken || "none",
        previewId: previewId || "none",
        storeId,
        visitorId,
      });

      // Handle preview token (unsaved campaign data from session)
      if (previewToken) {
        console.log(`[Active Campaigns API] 🎭 Preview mode enabled with token: ${previewToken}`);

        try {
          // Fetch preview data directly from Redis (no HTTP call, no loader call)
          console.log(`[Active Campaigns API] Fetching preview data from Redis for token: ${previewToken}`);

          const redis = getRedis();
          if (!redis) {
            console.error("[Active Campaigns API] Redis not available");
            const emptyResponse: ActiveCampaignsResponse = {
              campaigns: [],
              timestamp: new Date().toISOString(),
            };
            return data(emptyResponse, { headers });
          }

          const PREVIEW_PREFIX = `${REDIS_PREFIXES.SESSION}:preview`;
          const redisKey = `${PREVIEW_PREFIX}:${previewToken}`;
          const sessionDataStr = await redis.get(redisKey);

          if (!sessionDataStr) {
            console.warn(`[Active Campaigns API] Preview token not found or expired: ${previewToken}`);
            const emptyResponse: ActiveCampaignsResponse = {
              campaigns: [],
              timestamp: new Date().toISOString(),
            };
            return data(emptyResponse, { headers });
          }

          const sessionData = JSON.parse(sessionDataStr);
          const campaignData = sessionData.data;

          console.log(`[Active Campaigns API] ✅ Preview data retrieved from Redis:`, {
            name: campaignData.name,
            templateType: campaignData.templateType,
            hasContentConfig: !!campaignData.contentConfig,
            hasDesignConfig: !!campaignData.designConfig,
          });

          // Format preview campaign data
          const formattedPreview: ApiCampaignData = {
            id: `preview-${previewToken}`,
            name: campaignData.name || "Preview Campaign",
            templateType: campaignData.templateType,
            priority: campaignData.priority || 0,
            contentConfig: campaignData.contentConfig || {},
            designConfig: campaignData.designConfig || {},
            targetRules: campaignData.targetRules || {},
            discountConfig: campaignData.discountConfig || {},
            experimentId: null,
            variantKey: null,
          };

          const response: ActiveCampaignsResponse = {
            campaigns: [formattedPreview],
            timestamp: new Date().toISOString(),
          };

          console.log(`[Active Campaigns API] ✅ Returning preview campaign from token:`, {
            id: formattedPreview.id,
            name: formattedPreview.name,
            templateType: formattedPreview.templateType,
          });
          return data(response, { headers });
        } catch (error) {
          console.error(`[Active Campaigns API] ❌ Error fetching preview data:`, error);
          const emptyResponse: ActiveCampaignsResponse = {
            campaigns: [],
            timestamp: new Date().toISOString(),
          };
          return data(emptyResponse, { headers });
        }
      }

      // Handle preview ID (saved campaign)
      if (previewId) {
        console.log(`[Active Campaigns API] Preview mode enabled for campaign ${previewId}`);
        const previewCampaign = await CampaignService.getCampaignById(previewId, storeId);

        if (!previewCampaign) {
          console.warn(`[Active Campaigns API] Preview campaign not found: ${previewId} for store ${storeId}`);
          const emptyResponse: ActiveCampaignsResponse = {
            campaigns: [],
            timestamp: new Date().toISOString(),
          };
          return data(emptyResponse, { headers });
        }

        const formattedPreview: ApiCampaignData = {
          id: previewCampaign.id,
          name: previewCampaign.name,
          templateType: previewCampaign.templateType,
          priority: previewCampaign.priority,
          contentConfig: previewCampaign.contentConfig,
          designConfig: previewCampaign.designConfig,
          targetRules: {} as Record<string, unknown>,
          discountConfig: previewCampaign.discountConfig,
          experimentId: previewCampaign.experimentId,
          variantKey: previewCampaign.variantKey,
        };

        const previewResponse: ActiveCampaignsResponse = {
          campaigns: [formattedPreview],
          timestamp: new Date().toISOString(),
        };

        console.log(`[Active Campaigns API] ✅ Returning preview campaign ${previewCampaign.id} to storefront`);
        return data(previewResponse, { headers });
      }

      // Get all active campaigns
      const allCampaigns = await CampaignService.getActiveCampaigns(storeId);
      console.log(`[Active Campaigns API] Found ${allCampaigns.length} active campaigns for store ${storeId}`);

      // Filter campaigns based on context (server-side filtering with Redis)
      const filteredCampaigns = await CampaignFilterService.filterCampaigns(
        allCampaigns,
        context,
        storeId,
      );
      console.log(`[Active Campaigns API] After filtering: ${filteredCampaigns.length} campaigns`, {
        pageType: context.pageType,
        deviceType: context.deviceType,
        visitorId: context.visitorId,
      });

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
        // Include experimentId for proper frequency capping tracking
        experimentId: campaign.experimentId,
        variantKey: campaign.variantKey,
      }));

      const response: ActiveCampaignsResponse = {
        campaigns: formattedCampaigns,
        timestamp: new Date().toISOString(),
      };

      console.log(`[Active Campaigns API] ✅ Returning ${formattedCampaigns.length} campaigns to storefront`);
      if (formattedCampaigns.length > 0) {
        console.log('[Active Campaigns API] Campaign details:', formattedCampaigns.map(c => ({
          id: c.id,
          name: c.name,
          templateType: c.templateType,
          priority: c.priority,
        })));
      }

      return data(response, { headers });
    } catch (error) {
      return handleApiError(error, "GET /api/campaigns/active");
    }
  });
}

/**
 * Extract client-side triggers from targetRules
 * Server-side rules (audience, page targeting) are already filtered
 */
function extractClientTriggers(targetRules: any) {
  if (!targetRules) return {};

  const { enhancedTriggers, audienceTargeting } = targetRules;

  return {
    enhancedTriggers: enhancedTriggers || {},
    sessionRules: audienceTargeting?.sessionRules,
  };
}

