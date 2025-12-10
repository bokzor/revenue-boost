/**
 * App Setup Service
 *
 * Handles automatic setup on app installation:
 * - Creates or finds the store record
 * - Enables theme extension automatically
 * - Sets app URL metafield for storefront
 * - Creates welcome campaign
 * - Fetches and caches shop timezone
 * - Creates "My Store Theme" preset from Shopify theme colors
 * - Tracks setup completion
 */

import { logger } from "~/lib/logger.server";
import { getEnv } from "~/lib/env.server";
import prisma from "~/db.server";
import { CampaignService } from "~/domains/campaigns/services/campaign.server";
import { ShopService } from "~/domains/shops/services/shop.server";
import { fetchThemeSettings, themeSettingsToPreset } from "~/lib/shopify/theme-settings.server";
import type { StoreSettings } from "~/domains/store/types/settings";
import {
  POPUP_FREQUENCY_BEST_PRACTICES,
  SOCIAL_PROOF_FREQUENCY_BEST_PRACTICES,
  BANNER_FREQUENCY_BEST_PRACTICES,
} from "~/domains/store/types/settings";

/**
 * Build a deep link to the Shopify theme editor to activate our app embed
 *
 * Format from Shopify docs:
 * https://<myshopifyDomain>/admin/themes/current/editor?context=apps&template=${template}&activateAppId={api_key}/{handle}
 *
 * - api_key: The client_id from shopify.app.toml (SHOPIFY_API_KEY env var)
 * - handle: The filename of the block's Liquid file (without .liquid extension)
 *
 * @param shopDomain - The shop's myshopify.com domain
 * @returns URL to open the theme editor with app embed activation
 */
export function buildThemeEditorDeepLink(shopDomain: string): string {
  // Get API key from environment (same as client_id in shopify.app.toml)
  const apiKey = getEnv().SHOPIFY_API_KEY;
  // The block handle is the filename without .liquid extension
  // Our block is at: extensions/storefront-popup/blocks/popup-embed.liquid
  const blockHandle = "popup-embed";

  // Use the activateAppId parameter to auto-activate the app embed
  return `https://${shopDomain}/admin/themes/current/editor?context=apps&activateAppId=${apiKey}/${blockHandle}`;
}

/**
 * Setup app on installation
 * Auto-enables theme extension and creates welcome campaign
 * Zero-configuration setup for merchants
 *
 * This function ensures the store record exists before running setup steps.
 *
 * @param admin - Shopify Admin API context
 * @param shopDomain - Shop domain (e.g., "store.myshopify.com")
 * @param accessToken - Optional access token from session (used for theme settings fetch
 *                      when store record doesn't have the token yet)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- admin type varies by context
export async function setupAppOnInstall(admin: any, shopDomain: string, accessToken?: string) {
  try {
    logger.debug("[App Setup] Setting up app for ${shopDomain}");

    // Try to find existing store first
    let store = await prisma.store.findUnique({
      where: { shopifyDomain: shopDomain },
    });

    // If store doesn't exist, create it now
    if (!store) {
      logger.debug("[App Setup] Store not found for ${shopDomain} - creating it now");
      store = await createStoreRecord(admin, shopDomain, accessToken);
      if (!store) {
        logger.error("[App Setup] Failed to create store record for ${shopDomain}");
        // Continue with what we can do (metafield setup)
      }
    }

    // Check if setup already completed
    if (store) {
      const setupCompleted = await checkSetupCompleted(store.id);
      if (setupCompleted) {
        logger.debug("[App Setup] Setup already completed for ${shopDomain}");
        return;
      }
    }

    // 1. Set app URL metafield for storefront to use
    await setAppUrlMetafield(admin, shopDomain);

    // 2. Note: Theme extension must be manually enabled by merchant in theme editor
    // We cannot enable it programmatically via GraphQL
    logger.debug("[AppSetup] Theme extension available - merchant needs to enable it in theme editor");

    // 3. Fetch and cache shop timezone - only if store exists
    if (store) {
      try {
        await ShopService.getShopTimezone(admin, store.id);
        logger.debug("[App Setup] ✅ Fetched and cached shop timezone");
      } catch (error) {
        logger.error({ error }, "[App Setup] Error fetching shop timezone:");
        // Don't fail setup if timezone fetch fails
      }
    }

    // 4. Create "My Store Theme" preset from Shopify theme - only if store exists
    // Use accessToken from session if available (more reliable than store.accessToken
    // which may be empty for newly created stores)
    if (store) {
      const tokenForTheme = accessToken || store.accessToken;
      await createThemePresetFromShopifyTheme(store.id, shopDomain, tokenForTheme);
    }

    // 5. Create welcome campaign (ACTIVE by default) - only if store exists
    if (store) {
      await createWelcomeCampaign(store.id);

      // 6. Mark setup as completed
      await markSetupCompleted(store.id);
    }

    logger.debug("[App Setup] ✅ Successfully set up app for ${shopDomain}");
  } catch (error) {
    logger.error({ error }, "[App Setup] Error during app setup:");
    // Don't throw - we want the auth flow to continue even if setup fails
  }
}

/**
 * Check if setup was already completed
 * We check if a welcome campaign already exists as a proxy for setup completion
 */
async function checkSetupCompleted(storeId: string): Promise<boolean> {
  const existingCampaign = await prisma.campaign.findFirst({
    where: {
      storeId,
      name: "Welcome Popup",
    },
  });

  return existingCampaign !== null;
}

/**
 * Mark setup as completed
 * This is implicit - the welcome campaign existing means setup is complete
 */
async function markSetupCompleted(storeId: string) {
  // No-op - setup completion is tracked by the existence of the welcome campaign
  logger.debug("[App Setup] Setup marked as completed for store ${storeId}");
}

/**
 * Set app URL metafield so storefront knows where to fetch campaigns
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- admin type varies by context
async function setAppUrlMetafield(admin: any, shop: string) {
  try {
    const appUrl = process.env.SHOPIFY_APP_URL;

    if (!appUrl) {
      logger.warn("[App Setup] SHOPIFY_APP_URL not set, skipping metafield creation");
      return;
    }

    logger.debug("[App Setup] Setting app URL metafield to: ${appUrl}");

    const mutation = `
      mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields {
            id
            namespace
            key
            value
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    // Get shop ID first
    const shopQuery = `query { shop { id } }`;
    const shopResponse = await admin.graphql(shopQuery);
    const shopData = await shopResponse.json();
    const shopId = shopData.data?.shop?.id;

    if (!shopId) {
      logger.error("[App Setup] Could not get shop ID");
      return;
    }

    const response = await admin.graphql(mutation, {
      variables: {
        metafields: [
          {
            namespace: "revenue_boost",
            key: "api_url",
            value: appUrl,
            type: "single_line_text_field",
            ownerId: shopId,
          },
        ],
      },
    });

    const data = await response.json();

    if (data.data?.metafieldsSet?.userErrors?.length > 0) {
      logger.error({ userErrors: data.data.metafieldsSet.userErrors }, "[AppSetup] Failed to set app URL metafield");
    } else {
      logger.debug({ shop }, "[AppSetup] Successfully set app URL metafield");
    }
  } catch (error) {
    logger.error({ error }, "[App Setup] Error setting app URL metafield:");
    // Don't throw - we want setup to continue even if this fails
  }
}

/**
 * Create default welcome campaign (ACTIVE status)
 */
async function createWelcomeCampaign(storeId: string) {
  try {
    // Check if welcome campaign already exists
    const existingCampaign = await prisma.campaign.findFirst({
      where: {
        storeId,
        name: "Welcome Popup",
      },
    });

    if (existingCampaign) {
      logger.debug("[App Setup] Welcome campaign already exists");
      return;
    }

    // Create welcome campaign with ACTIVE status
    const campaign = await CampaignService.createCampaign(storeId, {
      name: "Welcome Popup",
      description: "Your first popup - customize it in the app!",
      templateType: "NEWSLETTER",
      templateId: undefined,
      goal: "NEWSLETTER_SIGNUP",
      status: "ACTIVE", // ← Auto-activate for zero-config experience
      priority: 1,
      experimentId: undefined,
      startDate: undefined,
      endDate: undefined,
      contentConfig: {
        title: "Welcome! 🎉",
        subtitle: "Get 10% off your first order",
        description: "Join our newsletter and receive exclusive offers and updates.",
        buttonText: "Get My Discount",
        emailPlaceholder: "Enter your email",
        successMessage: "Thanks! Check your email for your discount code.",
        showPrivacyNote: true,
        privacyNote: "We respect your privacy. Unsubscribe anytime.",
      },
      designConfig: {
        themeMode: "default", // Use store's default theme preset
        // Note: theme is NOT set - uses store defaults when themeMode is "default"
        position: "center",
        size: "medium",
        borderRadius: 8,
        animation: "fade",
        overlayOpacity: 0.6,
        backgroundImageMode: "none",
        leadCaptureLayout: {
          desktop: "split-left",
          mobile: "content-only",
          visualSizeDesktop: "50%",
        },
      },
      targetRules: {
        enhancedTriggers: {
          enabled: true,
          page_load: {
            enabled: true,
            delay: 3000,
          },
        },
        audienceTargeting: {
          enabled: false,
          shopifySegmentIds: [],
        },
        pageTargeting: {
          enabled: false,
          pages: [],
          customPatterns: [],
          excludePages: [],
          productTags: [],
          collections: [],
        },
      },
      discountConfig: {
        enabled: false,
        showInPreview: true,
        strategy: "simple",
        behavior: "SHOW_CODE_AND_AUTO_APPLY",
      },
    });

    logger.debug("[App Setup] ✅ Created welcome campaign: ${campaign.id}");
  } catch (error) {
    logger.error({ error }, "[App Setup] Error creating welcome campaign:");
    // Don't throw - we want setup to continue even if this fails
  }
}


/**
 * Create "My Store Theme" preset from the merchant's Shopify theme
 * This gives merchants a ready-to-use preset matching their store's branding
 */
async function createThemePresetFromShopifyTheme(
  storeId: string,
  shopDomain: string,
  accessToken: string
) {
  try {
    logger.debug("[App Setup] Fetching Shopify theme settings for ${shopDomain}");

    // Fetch theme settings from Shopify
    const result = await fetchThemeSettings(shopDomain, accessToken);

    if (!result.success || !result.settings) {
      logger.warn({ error: result.error }, "[AppSetup] Could not fetch theme settings");
      return;
    }

    // Convert to a preset and mark it as the default theme
    const preset = themeSettingsToPreset(result.settings, "shopify-theme-auto", { isDefault: true });
    preset.name = "My Store Theme";

    // Get current store settings
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { settings: true },
    });

    const currentSettings = (store?.settings as StoreSettings) || {};
    const existingPresets = currentSettings.customThemePresets || [];

    // Check if we already have a "My Store Theme" preset (avoid duplicates)
    const hasStoreTheme = existingPresets.some(
      (p) => p.id === "shopify-theme-auto" || p.name === "My Store Theme"
    );

    if (hasStoreTheme) {
      logger.debug("[App Setup] Store theme preset already exists, skipping");
      return;
    }

    // Clear any existing default flags and add the new preset as default
    const existingPresetsWithoutDefault = existingPresets.map((p) => ({ ...p, isDefault: false }));
    const updatedPresets = [preset, ...existingPresetsWithoutDefault];

    // Update store settings
    await prisma.store.update({
      where: { id: storeId },
      data: {
        settings: {
          ...currentSettings,
          customThemePresets: updatedPresets,
        },
      },
    });

    logger.info({ themeName: result.settings.themeName }, "[AppSetup] Created 'My Store Theme' preset");
  } catch (error) {
    logger.error({ error }, "[App Setup] Error creating theme preset:");
    // Don't throw - we want setup to continue even if this fails
  }
}

/**
 * Create store record using Admin API to fetch shop ID
 * Uses upsert to handle race conditions
 *
 * @param admin - Shopify Admin API context
 * @param shopDomain - Shop domain
 * @param accessToken - Optional access token from session to store
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- admin type varies by context
async function createStoreRecord(admin: any, shopDomain: string, accessToken?: string) {
  try {
    // Fetch the shop ID via GraphQL
    const response = await admin.graphql(`query { shop { id } }`);
    const data = await response.json();
    const shopGid: string | undefined = data?.data?.shop?.id;

    if (!shopGid) {
      logger.error("[App Setup] Could not fetch shop ID from Shopify");
      return null;
    }

    // Extract numeric ID from GID (e.g., "gid://shopify/Shop/12345" -> 12345)
    const last = shopGid.split("/").pop();
    if (!last || !/^\d+$/.test(last)) {
      logger.error({ shopGid }, "[AppSetup] Invalid shop GID format");
      return null;
    }
    const shopNumericId = BigInt(last);

    // Use upsert to handle race conditions
    const store = await prisma.store.upsert({
      where: { shopifyDomain: shopDomain },
      update: {
        // Store already exists, just ensure it's active
        isActive: true,
        // Update access token if provided (ensures we have the latest)
        ...(accessToken ? { accessToken } : {}),
      },
      create: {
        shopifyDomain: shopDomain,
        shopifyShopId: shopNumericId,
        accessToken: accessToken || "", // Use provided token or empty (will be updated by session management)
        isActive: true,
        settings: {
          // Popups: disabled by default, stricter limits when enabled
          frequencyCapping: {
            enabled: false,
            ...POPUP_FREQUENCY_BEST_PRACTICES,
          },
          // Social Proof: disabled by default, higher limits (less intrusive)
          socialProofFrequencyCapping: {
            enabled: false,
            ...SOCIAL_PROOF_FREQUENCY_BEST_PRACTICES,
          },
          // Banners: disabled by default, no limits (persistent by nature)
          bannerFrequencyCapping: {
            enabled: false,
            ...BANNER_FREQUENCY_BEST_PRACTICES,
          },
        },
      },
    });

    logger.debug("[App Setup] ✅ Store record created/verified for ${shopDomain}");
    return store;
  } catch (error) {
    logger.error({ error }, "[App Setup] Error creating store record:");
    return null;
  }
}
