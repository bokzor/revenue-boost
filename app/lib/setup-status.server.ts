/**
 * Setup Status Utilities
 * 
 * Shared utilities for checking app setup status across routes
 */

import type { SetupStatusData } from "~/domains/setup/components/SetupStatus";

interface CheckThemeExtensionParams {
  shop: string;
  accessToken: string;
}

/**
 * Check if theme extension is enabled using REST API
 * This is more reliable than the GraphQL appEmbed query
 */
export async function checkThemeExtensionEnabled({
  shop,
  accessToken,
}: CheckThemeExtensionParams): Promise<boolean> {
  try {
    // Get the published theme ID using REST API
    const themesUrl = `https://${shop}/admin/api/2024-10/themes.json`;
    const themesResponse = await fetch(themesUrl, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
      },
    });

    if (!themesResponse.ok) {
      console.error('[Setup] Failed to fetch themes:', themesResponse.status, themesResponse.statusText);
      return false;
    }

    const themesData = await themesResponse.json();
    const publishedTheme = themesData.themes?.find((t: any) => t.role === 'main');

    if (!publishedTheme) {
      console.error('[Setup] No published theme found');
      return false;
    }

    // Fetch settings_data.json to check app embed status
    const settingsUrl = `https://${shop}/admin/api/2024-10/themes/${publishedTheme.id}/assets.json?asset[key]=config/settings_data.json`;
    const settingsResponse = await fetch(settingsUrl, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
      },
    });

    if (!settingsResponse.ok) {
      console.error('[Setup] Failed to fetch settings_data.json:', settingsResponse.status, settingsResponse.statusText);
      return false;
    }

    const settingsData = await settingsResponse.json();
    const settingsValue = settingsData.asset?.value;

    if (!settingsValue) {
      console.error('[Setup] No settings_data.json value found');
      return false;
    }

    const settings = JSON.parse(settingsValue);
    const blocks = settings.current?.blocks || {};

    // Check if our app embed is enabled
    const appEmbedEnabled = Object.values(blocks).some((block: any) => {
      const isOurApp = block.type?.includes('revenue-boost') ||
                      block.type?.includes('storefront-popup') ||
                      block.type?.includes('revenue_boost');
      const isAppsBlock = block.type?.startsWith('shopify://apps/');
      const notDisabled = block.disabled !== true;

      return (isOurApp || isAppsBlock) && notDisabled;
    });

    console.log('[Setup] App embed enabled:', appEmbedEnabled);
    return appEmbedEnabled;
  } catch (error) {
    console.error('[Setup] Error checking theme extension:', error);
    return false;
  }
}

/**
 * Check if merchant has overridden the API URL via metafield
 */
export async function checkCustomProxyUrl(
  admin: any
): Promise<string | null> {
  try {
    const metafieldQuery = `
      query {
        shop {
          metafield(namespace: "revenue_boost", key: "api_url") {
            value
          }
        }
      }
    `;

    const metafieldResponse = await admin.graphql(metafieldQuery);
    const metafieldData = await metafieldResponse.json();
    const metafieldValue = metafieldData.data?.shop?.metafield?.value;

    // Only return if it's actually overridden (not empty and different from default)
    if (metafieldValue && metafieldValue !== process.env.SHOPIFY_APP_URL) {
      return metafieldValue;
    }

    return null;
  } catch (error) {
    console.error('[Setup] Error checking metafield:', error);
    return null;
  }
}

/**
 * Get complete setup status
 */
export async function getSetupStatus(
  shop: string,
  accessToken: string,
  admin: any
): Promise<{ status: SetupStatusData; setupComplete: boolean }> {
  const themeExtensionEnabled = await checkThemeExtensionEnabled({ shop, accessToken });
  const customProxyUrl = await checkCustomProxyUrl(admin);

  const status: SetupStatusData = {
    themeExtensionEnabled,
    appProxyOk: false, // This can be checked separately if needed
    customProxyUrl,
  };

  const setupComplete = themeExtensionEnabled;

  return { status, setupComplete };
}

