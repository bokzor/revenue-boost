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
 * Check if app proxy is reachable by testing the health endpoint
 * Since we're running on the server, we test our own health endpoint directly
 * The app proxy configuration in Shopify will route storefront requests to us
 */
export async function checkAppProxyReachable(
  shop: string,
  customProxyUrl: string | null
): Promise<boolean> {
  try {
    // Determine which URL to test
    const baseUrl = customProxyUrl || process.env.SHOPIFY_APP_URL;

    if (!baseUrl) {
      console.error('[Setup] No app URL configured');
      return false;
    }

    // Test our own health endpoint directly
    // We can't test the proxy URL from the server side because it requires
    // going through Shopify's proxy, which only works from the storefront
    const healthUrl = `${baseUrl}/api/health`;

    console.log('[Setup] Testing app health endpoint:', healthUrl);

    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // Short timeout to avoid hanging
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      console.error('[Setup] App health check failed:', response.status, response.statusText);
      return false;
    }

    const data = await response.json();
    const isHealthy = data.status === 'ok';

    console.log('[Setup] App health check result:', isHealthy ? 'OK' : 'ERROR', data);
    return isHealthy;
  } catch (error) {
    console.error('[Setup] Error checking app health:', error);
    return false;
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
  // Run checks in parallel for better performance
  const [themeExtensionEnabled, customProxyUrl] = await Promise.all([
    checkThemeExtensionEnabled({ shop, accessToken }),
    checkCustomProxyUrl(admin),
  ]);

  // Check app proxy after getting custom URL (if any)
  const appProxyOk = await checkAppProxyReachable(shop, customProxyUrl);

  const status: SetupStatusData = {
    themeExtensionEnabled,
    appProxyOk,
    customProxyUrl,
  };

  // Setup is complete when both theme extension is enabled AND app proxy is reachable
  const setupComplete = themeExtensionEnabled && appProxyOk;

  return { status, setupComplete };
}

