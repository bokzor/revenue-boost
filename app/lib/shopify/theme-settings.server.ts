/**
 * Theme Settings Service
 *
 * Fetches and parses merchant's Shopify theme settings to extract
 * colors, fonts, and other design tokens for "Match Your Theme" feature.
 */



// =============================================================================
// TYPES
// =============================================================================

/**
 * Color scheme extracted from Shopify theme
 */
export interface ExtractedColorScheme {
  background: string;
  text: string;
  button: string;
  buttonLabel: string;
  secondaryButtonLabel?: string;
  shadow?: string;
}

/**
 * Typography settings extracted from Shopify theme
 */
export interface ExtractedTypography {
  headingFont?: string;
  headingFontStack?: string; // Full CSS font-family with fallbacks
  bodyFont?: string;
  bodyFontStack?: string;
  headingScale?: number; // 100-150 (percentage)
  bodyScale?: number; // 100-130
}

/**
 * Border radius settings extracted from Shopify theme
 */
export interface ExtractedBorderRadius {
  buttons: number; // 0-40px
  inputs: number;
  popup?: number; // popup_corner_radius (if available)
  cards?: number; // card_corner_radius
}

/**
 * Border settings extracted from Shopify theme
 */
export interface ExtractedBorders {
  buttonThickness: number; // 0-4px
  buttonOpacity: number; // 0-100
  inputThickness: number;
  inputOpacity: number;
}

/**
 * Shadow settings extracted from Shopify theme
 */
export interface ExtractedShadows {
  buttonHorizontalOffset?: number;
  buttonVerticalOffset?: number;
  buttonBlur?: number;
  buttonOpacity?: number;
  popupHorizontalOffset?: number;
  popupVerticalOffset?: number;
  popupBlur?: number;
  popupOpacity?: number;
}

/**
 * Extracted theme settings that can be applied to popups
 *
 * This interface captures ALL available design tokens from Shopify themes:
 * - Colors: From color_schemes (OS 2.0) or legacy color settings
 * - Typography: Heading/body fonts with proper CSS font stacks
 * - Border Radius: For buttons, inputs, popups, cards
 * - Borders: Thickness and opacity for buttons/inputs
 * - Shadows: For buttons and popups
 */
export interface ExtractedThemeSettings {
  /** Theme name */
  themeName: string;

  /** Primary color scheme (typically scheme-1 or the first available) */
  colors: ExtractedColorScheme;

  /** Typography settings from root level */
  typography: ExtractedTypography;

  /** Border radius settings from root level */
  borderRadius: ExtractedBorderRadius;

  /** Border settings from root level */
  borders: ExtractedBorders;

  /** Shadow settings from root level */
  shadows: ExtractedShadows;

  /** All available color schemes for reference */
  colorSchemes?: Record<string, ExtractedColorScheme>;

  /** Whether this is an OS 2.0 theme (has color_schemes) */
  isOS2Theme: boolean;

  /** Raw settings for debugging */
  _raw?: Record<string, unknown>;
}

/**
 * Result of fetching theme settings
 */
export interface ThemeSettingsResult {
  success: boolean;
  settings?: ExtractedThemeSettings;
  error?: string;
}

// =============================================================================
// SHOPIFY FONT MAPPING
// =============================================================================

/**
 * Common Shopify font names mapped to CSS font stacks with proper fallbacks
 * Based on Shopify's font library and common Google Fonts
 */
const FONT_STACK_MAP: Record<string, string> = {
  // Sans-serif fonts
  assistant: "Assistant, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  montserrat: "Montserrat, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  poppins: "Poppins, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  "open sans": "Open Sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  lato: "Lato, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  roboto: "Roboto, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  inter: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  nunito: "Nunito, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  "nunito sans": "Nunito Sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  raleway: "Raleway, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  oswald: "Oswald, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  "source sans pro": "Source Sans Pro, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  "dm sans": "DM Sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  jost: "Jost, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  manrope: "Manrope, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  "work sans": "Work Sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  karla: "Karla, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  mulish: "Mulish, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  rubik: "Rubik, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  quicksand: "Quicksand, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  barlow: "Barlow, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",

  // Serif fonts
  "playfair display": "Playfair Display, Georgia, 'Times New Roman', Times, serif",
  merriweather: "Merriweather, Georgia, 'Times New Roman', Times, serif",
  "eb garamond": "EB Garamond, Garamond, Georgia, 'Times New Roman', serif",
  cormorant: "Cormorant, Garamond, Georgia, 'Times New Roman', serif",
  "cormorant garamond": "Cormorant Garamond, Garamond, Georgia, 'Times New Roman', serif",
  lora: "Lora, Georgia, 'Times New Roman', Times, serif",
  "source serif pro": "Source Serif Pro, Georgia, 'Times New Roman', Times, serif",
  "dm serif display": "DM Serif Display, Georgia, 'Times New Roman', Times, serif",
  "libre baskerville": "Libre Baskerville, Baskerville, Georgia, serif",
  "crimson text": "Crimson Text, Crimson, Georgia, 'Times New Roman', serif",
  bitter: "Bitter, Georgia, 'Times New Roman', Times, serif",

  // Display/decorative fonts
  bebas: "Bebas Neue, Impact, sans-serif",
  "bebas neue": "Bebas Neue, Impact, sans-serif",
  abril: "Abril Fatface, Georgia, serif",
  "abril fatface": "Abril Fatface, Georgia, serif",
  anton: "Anton, Impact, sans-serif",
  righteous: "Righteous, cursive",

  // Monospace fonts
  "roboto mono": "Roboto Mono, 'Courier New', Courier, monospace",
  "source code pro": "Source Code Pro, 'Courier New', Courier, monospace",
  "fira code": "Fira Code, 'Courier New', Courier, monospace",
  "jetbrains mono": "JetBrains Mono, 'Courier New', Courier, monospace",

  // System fonts
  system: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  helvetica: "Helvetica Neue, Helvetica, Arial, sans-serif",
  arial: "Arial, Helvetica, sans-serif",
  georgia: "Georgia, 'Times New Roman', Times, serif",
  times: "'Times New Roman', Times, Georgia, serif",
};

/**
 * Parse Shopify font picker value and return font name + full CSS stack
 * Format: "font_family_n_weight" e.g., "assistant_n4" = Assistant normal 400
 *
 * @returns Object with fontName (display name) and fontStack (CSS font-family)
 */
function parseShopifyFont(fontValue: string | undefined): {
  fontName: string | undefined;
  fontStack: string | undefined;
} {
  if (!fontValue) return { fontName: undefined, fontStack: undefined };

  // Extract font family name from Shopify format
  // Examples: "assistant_n4", "montserrat_n7", "playfair_display_n4"
  const parts = fontValue.split("_");
  if (parts.length < 2) return { fontName: undefined, fontStack: undefined };

  // Remove the weight suffix (last part like "n4", "n7", "i4")
  parts.pop();

  // Join to get the raw font identifier
  const fontKey = parts.join(" ").toLowerCase();

  // Convert to title case for display
  const fontName = parts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  // Look up the font stack, or create a generic one
  const fontStack = FONT_STACK_MAP[fontKey]
    || `'${fontName}', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;

  return { fontName, fontStack };
}

/**
 * Map Shopify font picker values to CSS font-family strings
 * @deprecated Use parseShopifyFont() instead for full font stack
 */
// =============================================================================
// THEME SETTINGS PARSING
// =============================================================================

/**
 * Helper to safely parse a number from theme settings
 */
function parseNumber(value: unknown, defaultValue: number): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
}

/**
 * Parse settings_data.json to extract ALL design tokens
 * Supports both OS 2.0 themes (Dawn, Sense, Craft) and legacy themes (Debut, Brooklyn)
 *
 * @internal Exported for testing purposes
 */
export function parseThemeSettings(
  themeName: string,
  settingsJson: Record<string, unknown>
): ExtractedThemeSettings {
  const current = (settingsJson.current || {}) as Record<string, unknown>;

  // =========================================================================
  // TYPOGRAPHY (root-level settings)
  // =========================================================================
  const headingFontParsed = parseShopifyFont(current.type_header_font as string);
  const bodyFontParsed = parseShopifyFont(current.type_body_font as string);

  const typography: ExtractedTypography = {
    headingFont: headingFontParsed.fontName,
    headingFontStack: headingFontParsed.fontStack,
    bodyFont: bodyFontParsed.fontName,
    bodyFontStack: bodyFontParsed.fontStack,
    headingScale: parseNumber(current.heading_scale, 100),
    bodyScale: parseNumber(current.body_scale, 100),
  };

  // =========================================================================
  // BORDER RADIUS (root-level settings)
  // =========================================================================
  const borderRadius: ExtractedBorderRadius = {
    buttons: parseNumber(current.buttons_radius, 0),
    inputs: parseNumber(current.inputs_radius, 0),
    popup: parseNumber(current.popup_corner_radius, 0),
    cards: parseNumber(current.card_corner_radius, 0),
  };

  // =========================================================================
  // BORDERS (root-level settings)
  // =========================================================================
  const borders: ExtractedBorders = {
    buttonThickness: parseNumber(current.buttons_border_thickness, 1),
    buttonOpacity: parseNumber(current.buttons_border_opacity, 100),
    inputThickness: parseNumber(current.inputs_border_thickness, 1),
    inputOpacity: parseNumber(current.inputs_border_opacity, 100),
  };

  // =========================================================================
  // SHADOWS (root-level settings)
  // =========================================================================
  const shadows: ExtractedShadows = {
    buttonHorizontalOffset: parseNumber(current.buttons_shadow_horizontal_offset, 0),
    buttonVerticalOffset: parseNumber(current.buttons_shadow_vertical_offset, 4),
    buttonBlur: parseNumber(current.buttons_shadow_blur, 5),
    buttonOpacity: parseNumber(current.buttons_shadow_opacity, 0),
    popupHorizontalOffset: parseNumber(current.popup_shadow_horizontal_offset, 0),
    popupVerticalOffset: parseNumber(current.popup_shadow_vertical_offset, 4),
    popupBlur: parseNumber(current.popup_shadow_blur, 5),
    popupOpacity: parseNumber(current.popup_shadow_opacity, 0),
  };

  // =========================================================================
  // COLOR SCHEMES (OS 2.0 structure: current.color_schemes)
  // =========================================================================
  const colorSchemesRaw = current.color_schemes as Record<string, { settings?: Record<string, string> }> | undefined;
  const isOS2Theme = !!colorSchemesRaw;

  // Default colors
  const defaultColors: ExtractedColorScheme = {
    background: "#FFFFFF",
    text: "#121212",
    button: "#121212",
    buttonLabel: "#FFFFFF",
  };

  let primaryColors: ExtractedColorScheme = { ...defaultColors };

  // Try to extract from color schemes (modern OS 2.0 themes)
  if (colorSchemesRaw) {
    // Get the first/default scheme (usually "scheme-1" or "scheme_1")
    const schemeKeys = Object.keys(colorSchemesRaw).sort();
    const defaultSchemeKey = schemeKeys.find(k => k.includes("1")) || schemeKeys[0];
    const defaultScheme = colorSchemesRaw[defaultSchemeKey];

    if (defaultScheme?.settings) {
      const s = defaultScheme.settings;
      primaryColors = {
        background: s.background || defaultColors.background,
        text: s.text || defaultColors.text,
        button: s.button || defaultColors.button,
        buttonLabel: s.button_label || defaultColors.buttonLabel,
        secondaryButtonLabel: s.secondary_button_label,
        shadow: s.shadow,
      };
    }
  }

  // Fallback to legacy color settings (older themes like Debut, Brooklyn)
  if (!colorSchemesRaw) {
    const legacyBackground = current.colors_background as string;
    const legacyText = current.colors_text as string;
    const legacyPrimary = current.colors_primary as string;
    const legacyAccent = current.colors_accent as string;

    primaryColors = {
      background: legacyBackground || defaultColors.background,
      text: legacyText || defaultColors.text,
      button: legacyPrimary || legacyAccent || defaultColors.button,
      buttonLabel: "#FFFFFF", // Legacy themes don't have explicit button label color
    };
  }

  // =========================================================================
  // BUILD ALL COLOR SCHEMES FOR REFERENCE
  // =========================================================================
  const parsedSchemes: Record<string, ExtractedColorScheme> = {};
  if (colorSchemesRaw) {
    for (const [key, scheme] of Object.entries(colorSchemesRaw)) {
      if (scheme?.settings) {
        const s = scheme.settings;
        parsedSchemes[key] = {
          background: s.background || defaultColors.background,
          text: s.text || defaultColors.text,
          button: s.button || defaultColors.button,
          buttonLabel: s.button_label || defaultColors.buttonLabel,
          secondaryButtonLabel: s.secondary_button_label,
          shadow: s.shadow,
        };
      }
    }
  }

  return {
    themeName,
    colors: primaryColors,
    typography,
    borderRadius,
    borders,
    shadows,
    colorSchemes: Object.keys(parsedSchemes).length > 0 ? parsedSchemes : undefined,
    isOS2Theme,
  };
}

// =============================================================================
// MAIN FETCH FUNCTION
// =============================================================================

/**
 * Fetch theme settings from the merchant's active Shopify theme
 *
 * @param shop - Shop domain (e.g., "mystore.myshopify.com")
 * @param accessToken - Shopify Admin API access token
 * @returns Extracted theme settings or error
 */
export async function fetchThemeSettings(
  shop: string,
  accessToken: string
): Promise<ThemeSettingsResult> {
  try {
    // 1. Get the published (main) theme
    const themesUrl = `https://${shop}/admin/api/2024-10/themes.json`;
    const themesResponse = await fetch(themesUrl, {
      headers: {
        "X-Shopify-Access-Token": accessToken,
      },
    });

    if (!themesResponse.ok) {
      logger.error({ status: themesResponse.status, statusText: themesResponse.statusText }, "[ThemeSettings] Failed to fetch themes");
      return {
        success: false,
        error: `Failed to fetch themes: ${themesResponse.status}`,
      };
    }

    const themesData = (await themesResponse.json()) as {
      themes?: { id: number; name: string; role: string }[];
    };
    const publishedTheme = themesData.themes?.find((t) => t.role === "main");

    if (!publishedTheme) {
      return {
        success: false,
        error: "No published theme found",
      };
    }

    // 2. Fetch settings_data.json from the theme
    const settingsUrl = `https://${shop}/admin/api/2024-10/themes/${publishedTheme.id}/assets.json?asset[key]=config/settings_data.json`;
    const settingsResponse = await fetch(settingsUrl, {
      headers: {
        "X-Shopify-Access-Token": accessToken,
      },
    });

    if (!settingsResponse.ok) {
      logger.error({ status: settingsResponse.status, statusText: settingsResponse.statusText }, "[ThemeSettings] Failed to fetch settings_data.json");
      return {
        success: false,
        error: `Failed to fetch theme settings: ${settingsResponse.status}`,
      };
    }

    const settingsData = (await settingsResponse.json()) as {
      asset?: { value?: string };
    };
    const settingsValue = settingsData.asset?.value;

    if (!settingsValue) {
      return {
        success: false,
        error: "Theme settings file is empty",
      };
    }

    // 3. Parse the JSON settings
    const settingsJson = JSON.parse(settingsValue) as Record<string, unknown>;
    const extractedSettings = parseThemeSettings(publishedTheme.name, settingsJson);

    logger.debug({
      themeName: publishedTheme.name,
      isOS2Theme: extractedSettings.isOS2Theme,
      colors: extractedSettings.colors,
      typography: {
        headingFont: extractedSettings.typography.headingFont,
        bodyFont: extractedSettings.typography.bodyFont,
        headingScale: extractedSettings.typography.headingScale,
        bodyScale: extractedSettings.typography.bodyScale,
      },
      borderRadius: extractedSettings.borderRadius,
      borders: extractedSettings.borders,
      shadows: extractedSettings.shadows,
      schemeCount: Object.keys(extractedSettings.colorSchemes || {}).length,
    }, "[ThemeSettings] Successfully extracted settings");

    return {
      success: true,
      settings: extractedSettings,
    };
  } catch (error) {
    logger.error({ error }, "[Theme Settings] Error fetching theme settings:");
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// =============================================================================
// CONVERT TO THEME PRESET
// =============================================================================

import { logger } from "~/lib/logger.server";
import type { ThemePresetInput } from "~/domains/store/types/theme-preset";

/**
 * Convert extracted theme settings to a ThemePresetInput that can be applied to popups
 *
 * @deprecated This function maps to the old ThemePresetInput format.
 * Use themeSettingsToDesignTokens() for the new simplified token system.
 */
/**
 * Calculate relative luminance of a color for WCAG contrast calculations
 */
function getLuminance(hexColor: string): number {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;

  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * Calculate WCAG contrast ratio between two colors
 * Returns a value between 1 (no contrast) and 21 (max contrast)
 */
function getContrastRatio(color1: string, color2: string): number {
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Detect if a color scheme is "light" (light background) or "dark" (dark background)
 */
function isLightScheme(scheme: ExtractedColorScheme): boolean {
  return getLuminance(scheme.background) > 0.5;
}

/**
 * Generate a descriptive name for a color scheme based on its properties
 */
function generateSchemeName(
  themeName: string,
  schemeKey: string,
  scheme: ExtractedColorScheme,
  index: number,
  totalSchemes: number
): string {
  const isLight = isLightScheme(scheme);
  const luminance = getLuminance(scheme.background);

  // Try to detect accent/brand schemes (colored backgrounds)
  const bgLuminance = getLuminance(scheme.background);
  const isNeutral = bgLuminance > 0.9 || bgLuminance < 0.1; // Very light or very dark = neutral

  let suffix: string;
  if (totalSchemes === 1) {
    suffix = "";
  } else if (!isNeutral && luminance > 0.2 && luminance < 0.8) {
    suffix = " - Accent";
  } else if (isLight) {
    suffix = " - Light";
  } else {
    suffix = " - Dark";
  }

  // If there are multiple schemes of the same type, add a number
  return `${themeName}${suffix}`;
}

/**
 * Check if a color scheme has valid contrast (text readable on background)
 * WCAG AA requires 4.5:1 for normal text
 */
function hasValidContrast(scheme: ExtractedColorScheme): boolean {
  const contrast = getContrastRatio(scheme.background, scheme.text);
  return contrast >= 3; // Slightly lower threshold to be more permissive
}

/**
 * Convert a single color scheme to a ThemePresetInput
 */
function colorSchemeToPreset(
  themeName: string,
  schemeKey: string,
  scheme: ExtractedColorScheme,
  typography: ExtractedTypography,
  borderRadius: ExtractedBorderRadius,
  index: number,
  totalSchemes: number,
  options?: { isDefault?: boolean }
): ThemePresetInput {
  const timestamp = Date.now();
  const name = generateSchemeName(themeName, schemeKey, scheme, index, totalSchemes);

  return {
    id: `theme-${schemeKey}-${timestamp}`,
    name,
    description: `Imported from ${themeName} theme (${schemeKey})`,
    isDefault: options?.isDefault ?? false,
    // Colors from this scheme
    backgroundColor: scheme.background,
    textColor: scheme.text,
    brandColor: scheme.button,
    primaryForegroundColor: scheme.buttonLabel || undefined,
    surfaceColor: undefined, // Will be derived
    mutedColor: undefined, // Will be derived
    borderColor: undefined, // Will be derived
    successColor: "#10B981",
    // Typography (shared across all schemes)
    fontFamily: typography.bodyFontStack || typography.headingFontStack || undefined,
    headingFontFamily: typography.headingFontStack || undefined,
    // Border radius (shared)
    borderRadius: borderRadius?.buttons || 8,
    popupBorderRadius: (borderRadius?.buttons || 8) * 2,
    // Metadata
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Convert extracted theme settings to multiple ThemePresetInputs (one per color scheme)
 *
 * This is the recommended function for importing theme colors.
 * It creates a preset for each valid color scheme, allowing merchants to choose
 * which scheme best matches their popup context.
 *
 * @returns Array of presets, with the "best" one marked as default
 */
export function themeSettingsToPresets(settings: ExtractedThemeSettings): ThemePresetInput[] {
  const { themeName, colorSchemes, typography, borderRadius, colors } = settings;
  const presets: ThemePresetInput[] = [];

  // If we have multiple color schemes (OS 2.0 theme)
  if (colorSchemes && Object.keys(colorSchemes).length > 0) {
    const schemeEntries = Object.entries(colorSchemes);
    let bestSchemeIndex = 0;
    let bestContrast = 0;

    // Find the scheme with the best contrast for the default
    schemeEntries.forEach(([, scheme], index) => {
      const contrast = getContrastRatio(scheme.background, scheme.text);
      if (contrast > bestContrast) {
        bestContrast = contrast;
        bestSchemeIndex = index;
      }
    });

    // Create presets for all schemes with valid contrast
    schemeEntries.forEach(([schemeKey, scheme], index) => {
      // Skip schemes with poor contrast
      if (!hasValidContrast(scheme)) {
        logger.debug("[Theme Settings] Skipping ${schemeKey}: poor contrast (${getContrastRatio(scheme.background, scheme.text).toFixed(2)}:1)");
        return;
      }

      const preset = colorSchemeToPreset(
        themeName,
        schemeKey,
        scheme,
        typography,
        borderRadius,
        index,
        schemeEntries.length,
        { isDefault: index === bestSchemeIndex }
      );
      presets.push(preset);
    });

    logger.debug("[Theme Settings] Generated ${presets.length} presets from ${schemeEntries.length} color schemes");
  }

  // Fallback: if no valid schemes found, create one from the primary colors
  if (presets.length === 0) {
    presets.push({
      id: `theme-${Date.now()}`,
      name: `${themeName} Theme`,
      description: "Imported from your Shopify theme",
      isDefault: true,
      backgroundColor: colors.background,
      textColor: colors.text,
      brandColor: colors.button,
      primaryForegroundColor: colors.buttonLabel || undefined,
      fontFamily: typography.bodyFontStack || typography.headingFontStack || undefined,
      headingFontFamily: typography.headingFontStack || undefined,
      borderRadius: borderRadius?.buttons || 8,
      popupBorderRadius: (borderRadius?.buttons || 8) * 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  return presets;
}

export function themeSettingsToPreset(
  settings: ExtractedThemeSettings,
  presetId?: string,
  options?: { isDefault?: boolean }
): ThemePresetInput {
  const id = presetId || `theme-${Date.now()}`;

  return {
    id,
    name: `${settings.themeName} Theme`,
    description: "Colors imported from your Shopify theme",
    isDefault: options?.isDefault ?? false,
    // Colors
    backgroundColor: settings.colors.background,
    textColor: settings.colors.text,
    brandColor: settings.colors.button,
    primaryForegroundColor: settings.colors.buttonLabel || undefined,
    surfaceColor: undefined, // Will be derived from background
    mutedColor: undefined, // Will be derived from text
    borderColor: undefined, // Will be derived
    successColor: "#10B981", // Default success color
    // Typography
    fontFamily: settings.typography.bodyFontStack || settings.typography.headingFontStack || undefined,
    headingFontFamily: settings.typography.headingFontStack || undefined,
    // Border radius
    borderRadius: settings.borderRadius?.buttons || 8,
    popupBorderRadius: (settings.borderRadius?.buttons || 8) * 2,
    // Metadata
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// =============================================================================
// CONVERT TO DESIGN TOKENS (NEW SIMPLIFIED SYSTEM)
// =============================================================================

// Re-export DesignTokens from design-tokens.ts for consistency
// This ensures we have a single source of truth for the type
export type { DesignTokens } from "~/domains/campaigns/types/design-tokens";
import type { DesignTokens } from "~/domains/campaigns/types/design-tokens";

/**
 * Derive muted color from foreground (reduced opacity)
 */
function deriveMutedColor(foreground: string): string {
  // For hex colors, we can reduce lightness or add transparency
  // Simple approach: return the same color with reduced opacity notation
  if (foreground.startsWith("#")) {
    // Convert to rgba with 60% opacity
    const hex = foreground.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, 0.6)`;
  }
  return foreground;
}

/**
 * Derive surface color from background (slightly darker/lighter)
 */
function deriveSurfaceColor(background: string): string {
  if (background.startsWith("#")) {
    const hex = background.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);

    // Determine if background is light or dark
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // For light backgrounds, darken slightly; for dark backgrounds, lighten
    const factor = luminance > 0.5 ? 0.95 : 1.05;
    const clamp = (v: number) => Math.min(255, Math.max(0, Math.round(v * factor)));

    return `#${clamp(r).toString(16).padStart(2, "0")}${clamp(g).toString(16).padStart(2, "0")}${clamp(b).toString(16).padStart(2, "0")}`;
  }
  return background;
}

/**
 * Derive border color from foreground (low opacity)
 */
function deriveBorderColor(foreground: string): string {
  if (foreground.startsWith("#")) {
    const hex = foreground.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, 0.2)`;
  }
  return foreground;
}

/**
 * Convert extracted Shopify theme settings to simplified design tokens
 *
 * This is the primary conversion function for the new theme system.
 * It maps Shopify's theme settings to our semantic design tokens.
 */
export function themeSettingsToDesignTokens(settings: ExtractedThemeSettings): DesignTokens {
  const colors = settings.colors;
  const typography = settings.typography;
  const borderRadius = settings.borderRadius;

  return {
    // Core colors from Shopify theme
    background: colors.background,
    foreground: colors.text,
    primary: colors.button,
    primaryForeground: colors.buttonLabel,

    // Derived colors
    muted: deriveMutedColor(colors.text),
    surface: deriveSurfaceColor(colors.background),
    border: deriveBorderColor(colors.text),
    success: "#10B981", // Default success color

    // Typography
    fontFamily: typography.bodyFontStack
      || typography.headingFontStack
      || "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    headingFontFamily: typography.headingFontStack,

    // Border radius from Shopify theme
    borderRadius: borderRadius.buttons || borderRadius.inputs || 0,
    popupBorderRadius: borderRadius.popup || borderRadius.cards || 8,
  };
}

/**
 * Convert design tokens to CSS custom properties
 *
 * @returns Object mapping CSS variable names to values
 */
export function designTokensToCSSVariables(tokens: DesignTokens): Record<string, string> {
  return {
    "--rb-background": tokens.background,
    "--rb-foreground": tokens.foreground,
    "--rb-muted": tokens.muted || deriveMutedColor(tokens.foreground),
    "--rb-primary": tokens.primary,
    "--rb-primary-foreground": tokens.primaryForeground,
    "--rb-surface": tokens.surface || deriveSurfaceColor(tokens.background),
    "--rb-border": tokens.border || deriveBorderColor(tokens.foreground),
    "--rb-success": tokens.success || "#10B981",
    "--rb-font-family": tokens.fontFamily,
    "--rb-heading-font-family": tokens.headingFontFamily || tokens.fontFamily,
    "--rb-radius": `${tokens.borderRadius}px`,
    "--rb-popup-radius": `${tokens.popupBorderRadius}px`,
  };
}
