/**
 * API Route: Theme Settings
 *
 * Fetches the merchant's Shopify theme settings (colors, fonts, border radius)
 * for the "Match Your Theme" feature.
 *
 * GET /api/theme-settings
 *
 * Returns:
 * - tokens: Simplified design tokens (12 properties) for popup styling
 * - preset: Legacy preset format (deprecated, for backward compatibility)
 * - rawSettings: Full extracted theme settings for debugging/advanced use
 */

import { data, type LoaderFunctionArgs } from "react-router";
import { authenticate } from "~/shopify.server";
import {
  fetchThemeSettings,
  themeSettingsToPreset,
  themeSettingsToDesignTokens,
  type ExtractedThemeSettings,
  type DesignTokens,
} from "~/lib/shopify/theme-settings.server";

// =============================================================================
// TYPES
// =============================================================================

interface ThemeSettingsResponse {
  success: boolean;
  /** Simplified design tokens (new system) */
  tokens?: DesignTokens;
  /** Legacy preset format (deprecated) */
  preset?: {
    id: string;
    name: string;
    description?: string;
    brandColor: string;
    backgroundColor: string;
    textColor: string;
    surfaceColor?: string;
    successColor?: string;
    fontFamily?: string;
  };
  /** Full extracted theme settings */
  rawSettings?: ExtractedThemeSettings;
  error?: string;
}

// =============================================================================
// LOADER
// =============================================================================

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);

  if (!session?.shop || !session?.accessToken) {
    return data(
      { success: false, error: "Authentication required" } as ThemeSettingsResponse,
      { status: 401 }
    );
  }

  const result = await fetchThemeSettings(session.shop, session.accessToken);

  if (!result.success || !result.settings) {
    return data(
      { success: false, error: result.error || "Failed to fetch theme settings" } as ThemeSettingsResponse,
      { status: 500 }
    );
  }

  // Convert to new simplified design tokens
  const tokens = themeSettingsToDesignTokens(result.settings);

  // Also convert to legacy preset format for backward compatibility
  const preset = themeSettingsToPreset(result.settings, "shopify-theme");

  return data({
    success: true,
    tokens,
    preset,
    rawSettings: result.settings,
  } as ThemeSettingsResponse);
}

