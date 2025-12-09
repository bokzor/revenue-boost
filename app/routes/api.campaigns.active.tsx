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
import { parseContentConfig, parseDesignConfig } from "~/domains/campaigns/utils/json-helpers";
import type { TemplateType } from "~/domains/campaigns/types/campaign";
import {
  resolveDesignTokens,
  tokensToCSSString,
  CampaignDesignSchema,
  type DesignTokens,
} from "~/domains/campaigns/types/design-tokens";

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

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Merge resolved design tokens into designConfig as direct properties.
 * This is necessary because popup components use direct properties like
 * backgroundColor, textColor, etc. - not CSS variables.
 *
 * This mirrors the logic in TemplatePreview.tsx (lines 161-175) for admin preview.
 */
function mergeTokensIntoDesignConfig(
  designConfig: Record<string, unknown>,
  tokens: DesignTokens,
  themeMode: string | undefined
): Record<string, unknown> {
  // Only apply token values for "default" or "shopify" theme modes
  // where the designConfig doesn't have explicit color values
  const shouldApplyTokens = !themeMode || themeMode === "default" || themeMode === "shopify";

  if (!shouldApplyTokens) {
    return designConfig;
  }

  // Map design tokens to popup config properties
  // Only set values if they're not already explicitly set in designConfig
  const tokenColors: Record<string, unknown> = {
    backgroundColor: designConfig.backgroundColor || tokens.background,
    textColor: designConfig.textColor || tokens.foreground,
    descriptionColor: designConfig.descriptionColor || tokens.muted,
    buttonColor: designConfig.buttonColor || tokens.primary,
    buttonTextColor: designConfig.buttonTextColor || tokens.primaryForeground,
    accentColor: designConfig.accentColor || tokens.primary,
    successColor: designConfig.successColor || tokens.success,
    fontFamily: designConfig.fontFamily || tokens.fontFamily,
    borderRadius: designConfig.borderRadius ?? tokens.borderRadius,
    inputBackgroundColor: designConfig.inputBackgroundColor || tokens.surface,
    inputBorderColor: designConfig.inputBorderColor || tokens.border,
  };

  return {
    ...designConfig,
    ...tokenColors,
  };
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
        select: { settings: true, planTier: true, accessToken: true },
      });
      const globalCustomCSS = extractGlobalCustomCss(store?.settings);

      // Determine if branding should be shown based on plan
      const planTier = (store?.planTier || "FREE") as PlanTier;
      const planDefinition = PLAN_DEFINITIONS[planTier];
      const showBranding = !planDefinition.features.removeBranding;

      // Get the store's default theme preset for "default"/"shopify" theme mode campaigns
      // This is done once per request and reused for all campaigns
      let defaultTokens: Partial<DesignTokens> | undefined;
      try {
        const { getDefaultPreset, presetToDesignTokens } = await import(
          "~/domains/store/types/theme-preset"
        );
        const storeSettings = store?.settings as StoreSettings | undefined;
        const customPresets = storeSettings?.customThemePresets || [];
        const defaultPreset = getDefaultPreset(customPresets);

        if (defaultPreset) {
          defaultTokens = presetToDesignTokens(defaultPreset);
          console.log(`[Active Campaigns API] Using default theme preset: ${defaultPreset.name}`);
        } else {
          // Fallback: fetch from Shopify theme if no default preset exists
          const { fetchThemeSettings, themeSettingsToDesignTokens } = await import(
            "~/lib/shopify/theme-settings.server"
          );
          if (store?.accessToken) {
            const themeResult = await fetchThemeSettings(shop, store.accessToken);
            if (themeResult.success && themeResult.settings) {
              defaultTokens = themeSettingsToDesignTokens(themeResult.settings);
              console.log(`[Active Campaigns API] Fallback: using Shopify theme settings`);
            }
          }
        }
      } catch (themeError) {
        console.warn("[Active Campaigns API] Failed to get theme settings:", themeError);
        // Continue without theme settings - campaigns will use defaults
      }

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

      // Use client-provided visitorId (from localStorage) if available, otherwise fall back to cookie-based
      // This ensures frequency capping uses the same ID as the recordFrequency endpoint
      const clientVisitorId = url.searchParams.get("visitorId");
      context.visitorId = clientVisitorId || visitorId;

      if (clientVisitorId) {
        console.log(`[Active Campaigns API] Using client visitorId: ${clientVisitorId}`);
      }

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
          // Parse contentConfig through Zod schema to apply defaults
          const parsedContentConfig = parseContentConfig(
            campaignData.contentConfig || {},
            campaignData.templateType as TemplateType
          );
          const parsedDesignConfig = parseDesignConfig(campaignData.designConfig || {});

          // Resolve design tokens for preview and merge into designConfig
          let designTokensCSS: string | undefined;
          let mergedDesignConfig = parsedDesignConfig as Record<string, unknown>;
          try {
            const designParsed = CampaignDesignSchema.safeParse(parsedDesignConfig);
            if (designParsed.success) {
              const resolvedTokens = resolveDesignTokens(designParsed.data, defaultTokens);
              designTokensCSS = tokensToCSSString(resolvedTokens);

              // Merge resolved tokens into designConfig so popups receive direct color values
              // This ensures "Preview on Store" shows the same colors as the admin preview
              mergedDesignConfig = mergeTokensIntoDesignConfig(
                parsedDesignConfig,
                resolvedTokens,
                designParsed.data.themeMode
              );
            }
          } catch (tokenError) {
            console.warn(`[Active Campaigns API] Failed to resolve tokens for preview:`, tokenError);
          }

          const formattedPreview: ApiCampaignData = {
            id: `preview-${previewToken}`,
            name: campaignData.name || "Preview Campaign",
            templateType: campaignData.templateType,
            priority: campaignData.priority || 0,
            contentConfig: parsedContentConfig,
            designConfig: mergedDesignConfig,
            designTokensCSS,
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
      // Parse contentConfig through Zod schema to apply defaults (showCountdown, countdownDuration, etc.)
      // Only send client-side triggers, not full targetRules
      const formattedCampaigns = filteredCampaigns.map((campaign) => {
        // Parse contentConfig through Zod schema to apply template-specific defaults
        const parsedContentConfig = parseContentConfig(
          campaign.contentConfig,
          campaign.templateType as TemplateType
        );
        const parsedDesignConfig = parseDesignConfig(campaign.designConfig);

        // Resolve design tokens based on themeMode
        // This enables "default"/"shopify" mode to automatically inherit store theme colors
        let designTokensCSS: string | undefined;
        let mergedDesignConfig = parsedDesignConfig as Record<string, unknown>;
        try {
          const designParsed = CampaignDesignSchema.safeParse(parsedDesignConfig);
          if (designParsed.success) {
            const resolvedTokens = resolveDesignTokens(designParsed.data, defaultTokens);
            designTokensCSS = tokensToCSSString(resolvedTokens);

            // Merge resolved tokens into designConfig so popups receive direct color values
            // This ensures storefront popups show the correct theme colors
            mergedDesignConfig = mergeTokensIntoDesignConfig(
              parsedDesignConfig,
              resolvedTokens,
              designParsed.data.themeMode
            );
          }
        } catch (tokenError) {
          console.warn(`[Active Campaigns API] Failed to resolve tokens for campaign ${campaign.id}:`, tokenError);
        }

        return {
          id: campaign.id,
          name: campaign.name,
          templateType: campaign.templateType,
          priority: campaign.priority,
          contentConfig: parsedContentConfig,
          designConfig: mergedDesignConfig,
          customCSS: parsedDesignConfig.customCSS,
          // CSS custom properties for design tokens (--rb-background, --rb-primary, etc.)
          designTokensCSS,
          // Extract only client-side triggers
          clientTriggers: extractClientTriggers(campaign.targetRules),
          targetRules: {} as Record<string, unknown>,
          discountConfig: campaign.discountConfig,
          // Include experimentId for proper frequency capping tracking
          experimentId: campaign.experimentId,
          variantKey: campaign.variantKey,
        };
      });

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
