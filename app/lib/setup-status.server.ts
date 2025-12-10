/**
 * Setup Status Utilities
 *
 * Shared utilities for checking app setup status across routes.
 * Includes in-memory caching to avoid expensive API calls on every request.
 */

import * as fs from "fs";
import * as path from "path";
import { logger } from "~/lib/logger.server";
import type { SetupStatusData } from "~/domains/setup/components/SetupStatus";

interface CheckThemeExtensionParams {
  shop: string;
  accessToken: string;
}

// ============================================================================
// SETUP STATUS CACHING
// ============================================================================

interface CachedSetupStatus {
  status: SetupStatusData;
  setupComplete: boolean;
  timestamp: number;
}

const setupStatusCache = new Map<string, CachedSetupStatus>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached setup status if still valid
 */
function getCachedStatus(shop: string): CachedSetupStatus | null {
  const cached = setupStatusCache.get(shop);
  if (!cached) return null;

  const isExpired = Date.now() - cached.timestamp > CACHE_TTL_MS;
  if (isExpired) {
    setupStatusCache.delete(shop);
    logger.debug("[Setup Cache] EXPIRED for shop: ${shop}");
    return null;
  }

  logger.debug("[Setup Cache] HIT for shop: ${shop}");
  return cached;
}

/**
 * Cache setup status for a shop
 */
function setCachedStatus(shop: string, status: SetupStatusData, setupComplete: boolean): void {
  setupStatusCache.set(shop, {
    status,
    setupComplete,
    timestamp: Date.now(),
  });
  logger.debug("[Setup Cache] SET for shop: ${shop} (setupComplete: ${setupComplete})");
}

/**
 * Invalidate cached setup status for a shop
 * Call this when user explicitly refreshes or when settings change
 */
export function invalidateSetupStatusCache(shop: string): void {
  setupStatusCache.delete(shop);
  logger.debug("[Setup Cache] INVALIDATED for shop: ${shop}");
}

/**
 * Clear all cached setup statuses
 */
export function clearSetupStatusCache(): void {
  setupStatusCache.clear();
  logger.debug("[Setup Cache] All entries cleared");
}

// ============================================================================
// SETUP STATUS CHECKS
// ============================================================================

// Block handle from blocks/popup-embed.liquid filename
// This is consistent across all environments (dev, staging, production)
const BLOCK_HANDLE = "popup-embed";

// Read extension UID from shopify.extension.toml at startup
// This file is deployed with the app and contains the correct UID for each environment
function getExtensionUid(): string {
  // First check env var (useful for testing or override)
  if (process.env.THEME_EXTENSION_UID) {
    return process.env.THEME_EXTENSION_UID;
  }

  try {
    // Read from the extension's toml file
    const tomlPath = path.join(
      process.cwd(),
      "extensions",
      "storefront-popup",
      "shopify.extension.toml"
    );
    const tomlContent = fs.readFileSync(tomlPath, "utf-8");

    // Parse the uid from the TOML file (simple regex since it's a basic format)
    const uidMatch = tomlContent.match(/^uid\s*=\s*"([^"]+)"/m);
    if (uidMatch && uidMatch[1]) {
      logger.debug({ uid: uidMatch[1] }, "[Setup] Loaded extension UID from shopify.extension.toml");
      return uidMatch[1];
    }
  } catch (error) {
    logger.debug({ error }, "[Setup] Could not read shopify.extension.toml, falling back to block handle matching");
  }

  return "";
}

// Cache the extension UID (read once at module load)
const EXTENSION_UID = getExtensionUid();

/**
 * Check if theme extension is enabled using REST API
 *
 * According to Shopify documentation, app embed blocks appear in settings_data.json
 * under current.blocks with the format:
 * "type": "shopify://apps/{app_name}/blocks/{block_handle}/{extension_uid}"
 *
 * The extension_uid is the most reliable identifier since app names can vary
 * across environments (dev, staging, production).
 *
 * When disabled is true, the embed is disabled.
 * When disabled is false or undefined, it's enabled.
 *
 * Note: An app embed block is added to settings_data.json only AFTER it's enabled
 * for the first time. If it's never been enabled, it won't appear at all.
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
        "X-Shopify-Access-Token": accessToken,
      },
    });

    if (!themesResponse.ok) {
      logger.error({ status: themesResponse.status, statusText: themesResponse.statusText }, "[Setup] Failed to fetch themes");
      return false;
    }

    const themesData = await themesResponse.json() as { themes?: { id: string; role: string }[] };
    const publishedTheme = themesData.themes?.find((t) => t.role === "main");

    if (!publishedTheme) {
      logger.error("[Setup] No published theme found");
      return false;
    }

    // Fetch settings_data.json to check app embed status
    const settingsUrl = `https://${shop}/admin/api/2024-10/themes/${publishedTheme.id}/assets.json?asset[key]=config/settings_data.json`;
    const settingsResponse = await fetch(settingsUrl, {
      headers: {
        "X-Shopify-Access-Token": accessToken,
      },
    });

    if (!settingsResponse.ok) {
      logger.error({ status: settingsResponse.status, statusText: settingsResponse.statusText }, "[Setup] Failed to fetch settings_data.json");
      return false;
    }

    const settingsData = await settingsResponse.json();
    const settingsValue = settingsData.asset?.value;

    if (!settingsValue) {
      logger.error("[Setup] No settings_data.json value found");
      return false;
    }

    const settings = JSON.parse(settingsValue);
    const blocks = settings.current?.blocks || {};

    // Log all blocks for debugging
    const blockEntries = Object.entries(blocks);
    logger.info({
      shop,
      themeId: publishedTheme.id,
      blockCount: blockEntries.length,
      allBlocks: blockEntries.map(([key, b]) => ({
        key,
        type: (b as { type?: string }).type,
        disabled: (b as { disabled?: boolean }).disabled
      }))
    }, "[Setup] Theme blocks found in settings_data.json");

    // Check if our app embed is enabled
    // We match using multiple strategies for reliability:
    // 1. Primary: Match by extension_uid (most reliable, unique per extension)
    // 2. Secondary: Match by block_handle when combined with apps path
    // 3. Fallback: Match by app name variations
    const appEmbedEnabled = Object.values(blocks).some((block: unknown) => {
      const b = block as { type?: string; disabled?: boolean };
      const blockType = b.type || "";

      // Skip non-app blocks
      if (!blockType.includes("shopify://apps/")) {
        return false;
      }

      // Strategy 1: Match by extension UID (most reliable, but only if configured)
      // Format: shopify://apps/{app_name}/blocks/{block_handle}/{extension_uid}
      // Example: shopify://apps/revenue-boost/blocks/popup-embed/725cd6d8-2f2b-91cb-b1be-3983c340fe6376935e80

      // Strategy 1: Match by extension UID (most reliable - unique per app deployment)
      // EXTENSION_UID varies per environment (dev/staging/prod)
      const matchesByUid = EXTENSION_UID ? blockType.includes(EXTENSION_UID) : false;

      // Strategy 2: Match by app name variations
      // This is the primary fallback when UID is not available
      const matchesByAppName =
        blockType.includes("revenue-boost") ||
        blockType.includes("revenue_boost") ||
        blockType.includes("Revenue Boost") ||
        blockType.includes("split-pop") || // Alternative app name
        blockType.includes("splitpop");

      // NOTE: We intentionally do NOT match by block handle alone!
      // Block handle (popup-embed) is NOT unique - other apps could use the same handle.
      // This was causing false positives where other apps' blocks were being detected as ours.
      // We only match by UID (unique per deployment) or app name (unique per app).
      const hasCorrectBlockHandle = blockType.includes(`/blocks/${BLOCK_HANDLE}/`);

      // Final determination: must match by UID or app name
      // Block handle is logged for debugging but not used for matching
      const isOurApp = matchesByUid || matchesByAppName;

      // An app embed is enabled when disabled is NOT true
      // Per Shopify docs: "disabled" is only set to true when merchant disables it.
      // It can be false, undefined, or missing when enabled.
      const isEnabled = b.disabled !== true;

      logger.info({
        blockType,
        disabled: b.disabled,
        matchesByUid,
        matchesByAppName,
        hasCorrectBlockHandle,
        isOurApp,
        isEnabled
      }, "[Setup] Checking app embed block");

      return isOurApp && isEnabled;
    });

    logger.info({
      shop,
      appEmbedEnabled,
      extensionUid: EXTENSION_UID,
      blockHandle: BLOCK_HANDLE
    }, "[Setup] App embed status result");

    return appEmbedEnabled;
  } catch (error) {
    logger.error({ error, shop }, "[Setup] Error checking theme extension");
    return false;
  }
}

/**
 * Check if merchant has overridden the API URL via metafield
 */
export async function checkCustomProxyUrl(admin: { graphql: (query: string) => Promise<Response> }): Promise<string | null> {
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
    logger.error({ error }, "[Setup] Error checking metafield:");
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
      logger.error("[Setup] No app URL configured");
      return false;
    }

    // Test our own health endpoint directly
    // We can't test the proxy URL from the server side because it requires
    // going through Shopify's proxy, which only works from the storefront
    const healthUrl = `${baseUrl}/api/health`;

    logger.debug({ healthUrl }, "[Setup] Testing app health endpoint");

    const response = await fetch(healthUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      // Short timeout to avoid hanging
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      logger.error({ status: response.status, statusText: response.statusText }, "[Setup] App health check failed");
      return false;
    }

    const data = await response.json();
    // Accept both "ok" and "degraded" as reachable - degraded means backend works but some non-critical services (like Redis) may be down
    const isReachable = data.status === "ok" || data.status === "degraded";

    logger.debug({ isReachable, data }, "[Setup] App health check result");
    return isReachable;
  } catch (error) {
    logger.error({ error }, "[Setup] Error checking app health:");
    return false;
  }
}

/**
 * Get complete setup status (with caching)
 *
 * Returns cached result if available and not expired (5 min TTL).
 * Use `forceRefresh: true` to bypass cache (e.g., when user clicks refresh).
 */
export async function getSetupStatus(
  shop: string,
  accessToken: string,
  admin: { graphql: (query: string) => Promise<Response> },
  options?: { forceRefresh?: boolean }
): Promise<{ status: SetupStatusData; setupComplete: boolean }> {
  // Check cache first (unless force refresh)
  if (!options?.forceRefresh) {
    const cached = getCachedStatus(shop);
    if (cached) {
      return { status: cached.status, setupComplete: cached.setupComplete };
    }
  } else {
    // Invalidate cache on force refresh
    invalidateSetupStatusCache(shop);
  }

  logger.debug("[Setup Cache] MISS for shop: ${shop} - fetching from APIs");

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

  // Cache the result
  setCachedStatus(shop, status, setupComplete);

  return { status, setupComplete };
}
