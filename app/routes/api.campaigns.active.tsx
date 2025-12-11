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
import { StoreSettingsSchema, type StoreSettings } from "~/domains/store/types/settings";
import { PLAN_DEFINITIONS, type PlanTier } from "~/domains/billing/types/plan";
import { parseContentConfig, parseDesignConfig } from "~/domains/campaigns/utils/json-helpers";
import type { TemplateType } from "~/domains/campaigns/types/campaign";
import {
  resolveDesignTokens,
  tokensToCSSString,
  type DesignTokens,
} from "~/domains/campaigns/types/design-tokens";
import { logger } from "~/lib/logger.server";

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
 * Theme handling (simplified model):
 * - If designConfig has explicit color values, use them (theme was copied into fields)
 * - If designConfig doesn't have colors, apply store default tokens
 * - themeMode is DEPRECATED but still supported for backward compatibility
 *
 * This mirrors the logic in TemplatePreview.tsx for admin preview.
 */
function mergeTokensIntoDesignConfig(
  designConfig: Record<string, unknown>,
  tokens: DesignTokens
): Record<string, unknown> {
  // SIMPLIFIED MODEL: Always apply store default tokens as the base.
  // Campaign's explicit colors override them.
  // No themeMode switching - themeMode is deprecated.

  // Map design tokens to popup config properties (used as defaults/fallbacks)
  const defaultTokenColors: Record<string, unknown> = {
    backgroundColor: tokens.background,
    textColor: tokens.foreground,
    descriptionColor: tokens.muted,
    buttonColor: tokens.primary,
    buttonTextColor: tokens.primaryForeground,
    accentColor: tokens.primary,
    successColor: tokens.success,
    fontFamily: tokens.fontFamily,
    borderRadius: tokens.borderRadius,
    inputBackgroundColor: tokens.surface,
    inputBorderColor: tokens.border,
  };

  // Filter out undefined/null values from designConfig so they don't override token defaults
  // This is important because spreading { backgroundColor: undefined } would override the token value
  const definedDesignConfig: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(designConfig)) {
    if (value !== undefined && value !== null) {
      definedDesignConfig[key] = value;
    }
  }

  // Merge: tokens as defaults FIRST, then defined designConfig values override
  // This ensures: store theme colors + campaign explicit colors = final result
  return {
    ...defaultTokenColors,
    ...definedDesignConfig,
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
    logger.warn({ error }, "[Active Campaigns API] Ignoring invalid globalCustomCSS");
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
        // Parse settings through schema to ensure correct structure (matches admin behavior)
        const parsedSettings = StoreSettingsSchema.safeParse(store?.settings);
        const storeSettings = parsedSettings.success ? parsedSettings.data : undefined;
        const customPresets = storeSettings?.customThemePresets || [];
        logger.debug({
          hasStore: !!store,
          rawSettingsType: typeof store?.settings,
          parseSuccess: parsedSettings.success,
          parseError: !parsedSettings.success ? parsedSettings.error?.message : undefined,
          presetsCount: customPresets.length,
          presetNames: customPresets.map(p => ({ name: p.name, isDefault: p.isDefault, brandColor: p.brandColor })),
        }, "[Active Campaigns API] Store settings debug");
        const defaultPreset = getDefaultPreset(customPresets);

        if (defaultPreset) {
          defaultTokens = presetToDesignTokens(defaultPreset);
          logger.debug({
            presetName: defaultPreset.name,
            primary: defaultTokens.primary,
            background: defaultTokens.background,
          }, "[Active Campaigns API] Using default theme preset");
        } else {
          // Fallback: fetch from Shopify theme if no default preset exists
          const { fetchThemeSettings, themeSettingsToDesignTokens } = await import(
            "~/lib/shopify/theme-settings.server"
          );
          if (store?.accessToken) {
            const themeResult = await fetchThemeSettings(shop, store.accessToken);
            if (themeResult.success && themeResult.settings) {
              defaultTokens = themeSettingsToDesignTokens(themeResult.settings);
              logger.debug("[Active Campaigns API] Fallback: using Shopify theme settings");
            }
          }
        }
      } catch (themeError) {
        logger.warn({ error: themeError }, "[Active Campaigns API] Failed to get theme settings");
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
        logger.debug({ clientVisitorId }, "[Active Campaigns API] Using client visitorId");
      }

      // Preview mode: token-based preview sessions (covers saved and unsaved campaigns)
      const previewToken = url.searchParams.get("previewToken");

      logger.debug({ fullUrl: url.toString() }, "[Active Campaigns API] Full URL");
      logger.debug({ urlParams: Object.fromEntries(url.searchParams.entries()) }, "[Active Campaigns API] All URL params");
      logger.debug({
        previewToken: previewToken || "none",
        storeId,
        visitorId,
      }, "[Active Campaigns API] Request params");

      // Handle preview token (preview session data from Redis)
      if (previewToken) {
        logger.debug({ previewToken }, "[Active Campaigns API] Preview mode enabled");

        try {
          // Fetch preview data directly from Redis (no HTTP call, no loader call)
          logger.debug({ previewToken }, "[Active Campaigns API] Fetching preview data from Redis");

          const redis = getRedis();
          if (!redis) {
            logger.error("[Active Campaigns API] Redis not available");
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
            logger.warn({ previewToken }, "[Active Campaigns API] Preview token not found or expired");
            const emptyResponse: ActiveCampaignsResponse = {
              campaigns: [],
              timestamp: new Date().toISOString(),
              globalCustomCSS,
            };
            return data(emptyResponse, { headers });
          }

          const sessionData = JSON.parse(sessionDataStr);
          const campaignData = sessionData.data;

          logger.debug({
            name: campaignData.name,
            templateType: campaignData.templateType,
            hasContentConfig: !!campaignData.contentConfig,
            hasDesignConfig: !!campaignData.designConfig,
          }, "[Active Campaigns API] Preview data retrieved from Redis");

          // Format preview campaign data
          // Parse contentConfig through Zod schema to apply defaults
          const parsedContentConfig = parseContentConfig(
            campaignData.contentConfig || {},
            campaignData.templateType as TemplateType
          );
          const parsedDesignConfig = parseDesignConfig(campaignData.designConfig || {});

          // Resolve design tokens for preview and merge into designConfig
          // Note: parsedDesignConfig comes from DesignConfigSchema, not CampaignDesignSchema
          // We extract themeMode directly instead of re-parsing with a different schema
          let designTokensCSS: string | undefined;
          let mergedDesignConfig = parsedDesignConfig as Record<string, unknown>;
          try {
            const themeMode = (parsedDesignConfig as { themeMode?: string }).themeMode;

            // Build a minimal design input for token resolution
            const designForTokens = {
              themeMode: themeMode as "default" | "shopify" | "preset" | "custom" | undefined,
              presetId: (parsedDesignConfig as { presetId?: string }).presetId,
              tokens: (parsedDesignConfig as { tokens?: Record<string, unknown> }).tokens as Partial<DesignTokens> | undefined,
            };

            const resolvedTokens = resolveDesignTokens(designForTokens, defaultTokens);
            designTokensCSS = tokensToCSSString(resolvedTokens);

            // Merge resolved tokens into designConfig so popups receive direct color values
            // This ensures "Preview on Store" shows the same colors as the admin preview
            mergedDesignConfig = mergeTokensIntoDesignConfig(
              parsedDesignConfig,
              resolvedTokens
            );
          } catch (tokenError) {
            logger.warn({ error: tokenError }, "[Active Campaigns API] Failed to resolve tokens for preview");
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

          logger.debug({
            id: formattedPreview.id,
            name: formattedPreview.name,
            templateType: formattedPreview.templateType,
          }, "[Active Campaigns API] Returning preview campaign from token");
          return data(response, { headers });
        } catch (error) {
          logger.error({ error }, "[Active Campaigns API] Error fetching preview data");
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
      logger.debug({ count: allCampaigns.length, storeId }, "[Active Campaigns API] Found active campaigns");

      // DIAGNOSTIC: Log ALL campaigns with their frequency capping config
      if (allCampaigns.length > 0) {
        logger.debug("[Active Campaigns API] BEFORE FILTERING - All campaigns from database");
        allCampaigns.forEach((c) => {
          const freqCap = c.targetRules?.enhancedTriggers?.frequency_capping;
          logger.debug({
            name: c.name,
            id: c.id,
            priority: c.priority,
            hasFreqCap: !!freqCap,
            maxSession: freqCap?.max_triggers_per_session,
            maxDay: freqCap?.max_triggers_per_day,
            cooldown: freqCap?.cooldown_between_triggers,
          }, "[Active Campaigns API] Campaign details");
        });
      }

      // Filter campaigns based on context (server-side filtering with Redis)
      const filteredCampaigns = await CampaignFilterService.filterCampaigns(
        allCampaigns,
        context,
        storeId
      );
      logger.debug({
        count: filteredCampaigns.length,
        pageType: context.pageType,
        deviceType: context.deviceType,
        visitorId: context.visitorId,
      }, "[Active Campaigns API] After filtering");

      // DIAGNOSTIC: Log which campaigns were filtered OUT
      if (allCampaigns.length !== filteredCampaigns.length) {
        const filteredIds = new Set(filteredCampaigns.map(c => c.id));
        const excluded = allCampaigns.filter(c => !filteredIds.has(c.id));
        logger.debug({ excludedCount: excluded.length }, "[Active Campaigns API] Campaigns FILTERED OUT");
        excluded.forEach(c => {
          logger.debug({ name: c.name, id: c.id }, "[Active Campaigns API] Excluded campaign");
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
        // Note: parsedDesignConfig comes from DesignConfigSchema, not CampaignDesignSchema
        // We extract themeMode directly instead of re-parsing with a different schema
        let designTokensCSS: string | undefined;
        let mergedDesignConfig = parsedDesignConfig as Record<string, unknown>;
        try {
          const themeMode = (parsedDesignConfig as { themeMode?: string }).themeMode;

          // Build a minimal design input for token resolution
          const designForTokens = {
            themeMode: themeMode as "default" | "shopify" | "preset" | "custom" | undefined,
            presetId: (parsedDesignConfig as { presetId?: string }).presetId,
            tokens: (parsedDesignConfig as { tokens?: Record<string, unknown> }).tokens as Partial<DesignTokens> | undefined,
          };

          const resolvedTokens = resolveDesignTokens(designForTokens, defaultTokens);
          designTokensCSS = tokensToCSSString(resolvedTokens);

          // Log original designConfig colors BEFORE merging
          logger.debug({
            campaignId: campaign.id,
            originalButtonColor: (parsedDesignConfig as Record<string, unknown>).buttonColor,
            originalAccentColor: (parsedDesignConfig as Record<string, unknown>).accentColor,
            originalBgColor: (parsedDesignConfig as Record<string, unknown>).backgroundColor,
          }, "[Active Campaigns API] Campaign BEFORE merge");

          // Merge resolved tokens into designConfig so popups receive direct color values
          // SIMPLIFIED: Always apply store tokens as base, campaign colors override
          mergedDesignConfig = mergeTokensIntoDesignConfig(
            parsedDesignConfig,
            resolvedTokens
          );
          logger.debug({
            campaignId: campaign.id,
            resolvedPrimary: resolvedTokens.primary,
            mergedAccentColor: (mergedDesignConfig as Record<string, unknown>).accentColor,
            mergedButtonColor: (mergedDesignConfig as Record<string, unknown>).buttonColor,
          }, "[Active Campaigns API] Campaign AFTER merge");
        } catch (tokenError) {
          logger.warn({ campaignId: campaign.id, error: tokenError }, "[Active Campaigns API] Failed to resolve tokens for campaign");
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

      logger.debug({ count: formattedCampaigns.length }, "[Active Campaigns API] Returning campaigns to storefront");
      if (formattedCampaigns.length > 0) {
        logger.debug({
          campaigns: formattedCampaigns.map((c) => ({
            id: c.id,
            name: c.name,
            templateType: c.templateType,
            priority: c.priority,
          })),
        }, "[Active Campaigns API] Campaign details");
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
