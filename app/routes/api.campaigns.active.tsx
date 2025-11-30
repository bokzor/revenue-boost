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

import { data, type LoaderFunctionArgs } from "react-router";
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
import prisma from "~/db.server";
import { validateCustomCss } from "~/lib/css-guards";
import type { StoreSettings } from "~/domains/store/types/settings";
import { PLAN_DEFINITIONS, type PlanTier } from "~/domains/billing/types/plan";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Response structure for active campaigns endpoint
 */
interface ActiveCampaignsResponse {
  campaigns: ApiCampaignData[];
  timestamp: string;
  globalCustomCSS?: string;
  /** Whether to show "Powered by Revenue Boost" branding (true for free tier) */
  showBranding?: boolean;
}

function extractGlobalCustomCss(settings: unknown): string | undefined {
  if (!settings || typeof settings !== "object") return undefined;

  try {
    return validateCustomCss(
      (settings as StoreSettings | undefined)?.globalCustomCSS,
      "globalCustomCSS"
    );
  } catch (error) {
    console.warn("[Active Campaigns API] Ignoring invalid globalCustomCSS", {
      error,
    });
    return undefined;
  }
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
      const store = await prisma.store.findUnique({
        where: { id: storeId },
        select: { settings: true, planTier: true },
      });
      const globalCustomCSS = extractGlobalCustomCss(store?.settings);

      // Determine if branding should be shown based on plan
      const planTier = (store?.planTier || "FREE") as PlanTier;
      const planDefinition = PLAN_DEFINITIONS[planTier];
      const showBranding = !planDefinition.features.removeBranding;

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
            globalCustomCSS,
          };
          return data(emptyResponse, { headers });
        }
        throw error;
      }

      // Build storefront context from request
      const context = buildStorefrontContext(url.searchParams, request.headers);

      // Add visitor ID to context (for frequency capping)
      context.visitorId = visitorId;

      // Preview mode: token-based preview sessions (covers saved and unsaved campaigns)
      const previewToken = url.searchParams.get("previewToken");

      console.log(`[Active Campaigns API] 🔍 Full URL:`, url.toString());
      console.log(
        `[Active Campaigns API] 🔍 All URL params:`,
        Object.fromEntries(url.searchParams.entries())
      );
      console.log(`[Active Campaigns API] Request params:`, {
        previewToken: previewToken || "none",
        storeId,
        visitorId,
      });

      // Handle preview token (preview session data from Redis)
      if (previewToken) {
        console.log(`[Active Campaigns API] 🎭 Preview mode enabled with token: ${previewToken}`);

        try {
          // Fetch preview data directly from Redis (no HTTP call, no loader call)
          console.log(
            `[Active Campaigns API] Fetching preview data from Redis for token: ${previewToken}`
          );

          const redis = getRedis();
          if (!redis) {
            console.error("[Active Campaigns API] Redis not available");
            const emptyResponse: ActiveCampaignsResponse = {
              campaigns: [],
              timestamp: new Date().toISOString(),
              globalCustomCSS,
            };
            return data(emptyResponse, { headers });
          }

          const PREVIEW_PREFIX = `${REDIS_PREFIXES.SESSION}:preview`;
          const redisKey = `${PREVIEW_PREFIX}:${previewToken}`;
          const sessionDataStr = await redis.get(redisKey);

          if (!sessionDataStr) {
            console.warn(
              `[Active Campaigns API] Preview token not found or expired: ${previewToken}`
            );
            const emptyResponse: ActiveCampaignsResponse = {
              campaigns: [],
              timestamp: new Date().toISOString(),
              globalCustomCSS,
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
            globalCustomCSS,
            showBranding,
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
            globalCustomCSS,
          };
          return data(emptyResponse, { headers });
        }
      }

      // Get all active campaigns
      const allCampaigns = await CampaignService.getActiveCampaigns(storeId);
      console.log(
        `[Active Campaigns API] Found ${allCampaigns.length} active campaigns for store ${storeId}`
      );

      // DIAGNOSTIC: Log ALL campaigns with their frequency capping config
      if (allCampaigns.length > 0) {
        console.log('[Active Campaigns API] 🔍 BEFORE FILTERING - All campaigns from database:');
        allCampaigns.forEach((c) => {
          const freqCap = c.targetRules?.enhancedTriggers?.frequency_capping;
          console.log(`  - ${c.name} (${c.id}):`, {
            priority: c.priority,
            hasFreqCap: !!freqCap,
            maxSession: freqCap?.max_triggers_per_session,
            maxDay: freqCap?.max_triggers_per_day,
            cooldown: freqCap?.cooldown_between_triggers,
          });
        });
      }

      // Filter campaigns based on context (server-side filtering with Redis)
      const filteredCampaigns = await CampaignFilterService.filterCampaigns(
        allCampaigns,
        context,
        storeId
      );
      console.log(`[Active Campaigns API] After filtering: ${filteredCampaigns.length} campaigns`, {
        pageType: context.pageType,
        deviceType: context.deviceType,
        visitorId: context.visitorId,
      });

      // DIAGNOSTIC: Log which campaigns were filtered OUT
      if (allCampaigns.length !== filteredCampaigns.length) {
        const filteredIds = new Set(filteredCampaigns.map(c => c.id));
        const excluded = allCampaigns.filter(c => !filteredIds.has(c.id));
        console.log(`[Active Campaigns API] ❌ ${excluded.length} campaigns FILTERED OUT:`);
        excluded.forEach(c => {
          console.log(`  - ${c.name} (${c.id})`);
        });
      }

      // Format campaigns for storefront consumption
      // Only send client-side triggers, not full targetRules
      const formattedCampaigns = filteredCampaigns.map((campaign) => ({
        id: campaign.id,
        name: campaign.name,
        templateType: campaign.templateType,
        priority: campaign.priority,
        contentConfig: campaign.contentConfig,
        designConfig: campaign.designConfig,
        customCSS: (campaign.designConfig as Record<string, unknown> | undefined)?.customCSS,
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
        globalCustomCSS,
        showBranding,
      };

      console.log(
        `[Active Campaigns API] ✅ Returning ${formattedCampaigns.length} campaigns to storefront`
      );
      if (formattedCampaigns.length > 0) {
        console.log(
          "[Active Campaigns API] Campaign details:",
          formattedCampaigns.map((c) => ({
            id: c.id,
            name: c.name,
            templateType: c.templateType,
            priority: c.priority,
          }))
        );
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- targetRules is dynamically typed from campaign config
function extractClientTriggers(targetRules: any) {
  if (!targetRules) return {};

  const { enhancedTriggers, audienceTargeting } = targetRules;

  return {
    enhancedTriggers: enhancedTriggers || {},
    sessionRules: audienceTargeting?.sessionRules,
  };
}
