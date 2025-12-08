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
 * - presets: Array of theme presets (one per color scheme)
 * - preset: Legacy single preset format (deprecated, for backward compatibility)
 * - rawSettings: Full extracted theme settings for debugging/advanced use
 */

import { data, type LoaderFunctionArgs } from "react-router";
import { authenticate } from "~/shopify.server";
import {
  fetchThemeSettings,
  themeSettingsToPreset,
  themeSettingsToPresets,
  themeSettingsToDesignTokens,
  type ExtractedThemeSettings,
  type DesignTokens,
} from "~/lib/shopify/theme-settings.server";
import type { ThemePresetInput } from "~/domains/store/types/settings";

// =============================================================================
// TYPES
// =============================================================================

interface ThemeSettingsResponse {
  success: boolean;
  /** Simplified design tokens (new system) */
  tokens?: DesignTokens;
  /** All color scheme presets (new multi-scheme system) */
  presets?: ThemePresetInput[];
  /** Legacy single preset format (deprecated) */
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

  // Convert all color schemes to presets (new system)
  const presets = themeSettingsToPresets(result.settings);

  // Also convert to legacy single preset format for backward compatibility
  const preset = themeSettingsToPreset(result.settings, "shopify-theme");

  return data({
    success: true,
    tokens,
    presets,
    preset,
    rawSettings: result.settings,
  } as ThemeSettingsResponse);
}

