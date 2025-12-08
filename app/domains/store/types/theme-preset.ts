/**
 * Theme Preset Types and Utilities
 *
 * Simplified theme presets that merchants can create and apply to campaigns.
 * Merchants pick 4-5 semantic colors, and the system derives the full DesignConfig.
 */

import { z } from "zod";
import type { DesignConfig } from "~/domains/campaigns/types/campaign";
import { getContrastingTextColor, hexToRgb } from "~/shared/utils/color-utilities";

// ============================================================================
// THEME PRESET SCHEMA (Simplified merchant input)
// ============================================================================

/**
 * Theme preset input schema with all 12 design tokens
 * Maps directly to the DesignTokens system (--rb-* CSS variables)
 */
export const ThemePresetInputSchema = z.object({
  /** Unique identifier for the preset (UUID or custom ID format) */
  id: z.string().min(1),

  /** Human-readable name for the preset */
  name: z.string().min(1).max(50),

  /** Optional description */
  description: z.string().max(200).optional(),

  /** Whether this is the store's default theme */
  isDefault: z.boolean().optional().default(false),

  // ============================================================================
  // COLORS (7 tokens) - Maps to DesignTokens
  // ============================================================================

  /** Background color - popup background (solid hex or CSS gradient) */
  backgroundColor: z.string().min(1),

  /** Text color - primary text and headings (foreground) */
  textColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/, "Must be a valid hex color"),

  /** Muted color - secondary/description text (optional, derived from textColor) */
  mutedColor: z.string().optional(),

  /** Primary/Brand color - buttons, CTAs, accents */
  brandColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/, "Must be a valid hex color"),

  /** Primary foreground - text color on primary/brand buttons */
  primaryForegroundColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/, "Must be a valid hex color").optional(),

  /** Surface color - input fields, cards background */
  surfaceColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/, "Must be a valid hex color").optional(),

  /** Border color - input borders, dividers */
  borderColor: z.string().optional(),

  /** Success color - success states */
  successColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/, "Must be a valid hex color").optional(),

  // ============================================================================
  // TYPOGRAPHY (2 tokens)
  // ============================================================================

  /** Body text font family */
  fontFamily: z.string().optional(),

  /** Heading font family (optional, defaults to fontFamily) */
  headingFontFamily: z.string().optional(),

  // ============================================================================
  // BORDER RADIUS (2 tokens)
  // ============================================================================

  /** Border radius for buttons and inputs (in pixels) */
  borderRadius: z.number().min(0).max(50).optional(),

  /** Border radius for the popup container (in pixels) */
  popupBorderRadius: z.number().min(0).max(50).optional(),

  // ============================================================================
  // METADATA
  // ============================================================================

  /** Creation timestamp */
  createdAt: z.string().datetime().optional(),

  /** Last update timestamp */
  updatedAt: z.string().datetime().optional(),
});

export type ThemePresetInput = z.infer<typeof ThemePresetInputSchema>;

// ============================================================================
// THEME PRESET ARRAY SCHEMA (For store settings)
// ============================================================================

export const ThemePresetsArraySchema = z.array(ThemePresetInputSchema);
export type ThemePresetsArray = z.infer<typeof ThemePresetsArraySchema>;

// ============================================================================
// COLOR DERIVATION UTILITIES
// ============================================================================

/**
 * Lighten a hex color by a percentage
 */
function lightenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    console.warn(`Invalid hex color provided to lightenColor: ${hex}`);
    return "#FFFFFF"; // Return a safe fallback
  }

  const factor = percent / 100;
  const r = Math.min(255, Math.round(rgb.r + (255 - rgb.r) * factor));
  const g = Math.min(255, Math.round(rgb.g + (255 - rgb.g) * factor));
  const b = Math.min(255, Math.round(rgb.b + (255 - rgb.b) * factor));

  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

/**
 * Darken a hex color by a percentage
 */
function darkenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    console.warn(`Invalid hex color provided to darkenColor: ${hex}`);
    return "#000000"; // Return a safe fallback
  }

  const factor = 1 - percent / 100;
  const r = Math.max(0, Math.round(rgb.r * factor));
  const g = Math.max(0, Math.round(rgb.g * factor));
  const b = Math.max(0, Math.round(rgb.b * factor));

  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

/**
 * Convert hex to rgba string
 */
function hexToRgba(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return `rgba(0, 0, 0, ${alpha})`;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

/**
 * Check if a color string is a gradient
 */
function isGradient(color: string): boolean {
  return color.includes("gradient");
}

/**
 * Extract the first solid color from a gradient or return the color itself
 */
function extractSolidColor(color: string): string {
  if (!isGradient(color)) return color;

  // Try to extract first hex color from gradient
  const hexMatch = color.match(/#([A-Fa-f0-9]{6})/);
  if (hexMatch) return hexMatch[0];

  // Fallback
  return "#FFFFFF";
}

/**
 * Determine if background is dark (for auto-contrast calculations)
 */
function isBackgroundDark(backgroundColor: string): boolean {
  const solidColor = extractSolidColor(backgroundColor);
  const contrastColor = getContrastingTextColor(solidColor);
  return contrastColor === "#FFFFFF";
}

// ============================================================================
// EXPAND THEME PRESET → FULL DESIGN CONFIG
// ============================================================================

/**
 * Expand a theme preset into a full DesignConfig
 *
 * This function takes the 12 design tokens that merchants configure and derives
 * all 15+ design config properties using color theory and accessibility rules.
 *
 * Derivation rules:
 * - brandColor → buttonColor, accentColor
 * - backgroundColor → backgroundColor, overlayColor
 * - textColor → textColor, inputTextColor
 * - surfaceColor → inputBackgroundColor, imageBgColor
 * - Auto-computed: buttonTextColor, descriptionColor, inputBorderColor, etc.
 */
export function expandThemePreset(preset: ThemePresetInput): Partial<DesignConfig> {
  const {
    brandColor,
    backgroundColor,
    textColor,
    mutedColor,
    primaryForegroundColor,
    surfaceColor,
    borderColor,
    successColor,
    fontFamily,
    headingFontFamily,
    borderRadius,
    popupBorderRadius,
  } = preset;

  const isDark = isBackgroundDark(backgroundColor);

  // Compute surface color if not provided
  const computedSurfaceColor =
    surfaceColor || (isDark ? lightenColor(extractSolidColor(backgroundColor), 10) : "#F3F4F6");

  // Compute description/muted color if not provided
  const descriptionColor = mutedColor || (isDark
    ? hexToRgba(textColor, 0.8)
    : lightenColor(textColor, 40));

  // Compute input border color if not provided
  const inputBorderColor = borderColor || (isDark
    ? hexToRgba(textColor, 0.3)
    : darkenColor(computedSurfaceColor, 15));

  // Use provided button text color or auto-contrast
  const buttonTextColor = primaryForegroundColor || getContrastingTextColor(brandColor);

  return {
    // Main colors
    backgroundColor,
    textColor,
    descriptionColor,
    accentColor: brandColor,

    // Button colors
    buttonColor: brandColor,
    buttonTextColor,

    // Input field colors
    inputBackgroundColor: isDark ? hexToRgba("#FFFFFF", 0.1) : computedSurfaceColor,
    inputTextColor: textColor,
    inputBorderColor,

    // Image colors
    imageBgColor: computedSurfaceColor,

    // State colors
    successColor: successColor || "#10B981",

    // Overlay (derived from background)
    overlayColor: isDark ? "#000000" : "#000000",
    overlayOpacity: isDark ? 0.7 : 0.5,

    // Typography
    fontFamily: fontFamily || "inherit",
    headlineFontFamily: headingFontFamily || fontFamily || "inherit",

    // Border radius
    borderRadius: borderRadius ?? 8,
    buttonBorderRadius: borderRadius ?? 8,
    inputBorderRadius: borderRadius ?? 8,
  };
}

/**
 * Generate a UUID, with fallback for environments without crypto.randomUUID
 */
function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback for older browsers or non-secure contexts
  return `preset-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Create a new theme preset with defaults
 */
export function createEmptyThemePreset(overrides?: Partial<ThemePresetInput>): ThemePresetInput {
  return {
    id: generateUUID(),
    name: "",
    isDefault: false,
    // Colors
    backgroundColor: "#FFFFFF",
    textColor: "#111827",
    mutedColor: undefined,
    brandColor: "#3B82F6",
    primaryForegroundColor: "#FFFFFF",
    surfaceColor: "#F3F4F6",
    borderColor: undefined,
    successColor: "#10B981",
    // Typography
    fontFamily: "inherit",
    headingFontFamily: undefined,
    // Border radius
    borderRadius: 8,
    popupBorderRadius: 16,
    // Metadata
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Validate and parse a theme preset
 */
export function parseThemePreset(data: unknown): ThemePresetInput | null {
  const result = ThemePresetInputSchema.safeParse(data);
  return result.success ? result.data : null;
}

/**
 * Validate and parse an array of theme presets
 */
export function parseThemePresets(data: unknown): ThemePresetsArray {
  const result = ThemePresetsArraySchema.safeParse(data);
  return result.success ? result.data : [];
}

/**
 * Get the default theme preset from a list of presets
 * Returns the preset marked as default, or the first preset if none is marked
 */
export function getDefaultPreset(presets: ThemePresetsArray): ThemePresetInput | null {
  if (presets.length === 0) return null;
  const defaultPreset = presets.find((p) => p.isDefault);
  return defaultPreset || presets[0];
}

/**
 * Convert a ThemePresetInput to DesignTokens format
 * This is used by the storefront API to generate CSS variables
 */
export function presetToDesignTokens(preset: ThemePresetInput): {
  background: string;
  foreground: string;
  muted?: string;
  primary: string;
  primaryForeground: string;
  surface?: string;
  border?: string;
  success: string;
  fontFamily: string;
  headingFontFamily?: string;
  borderRadius: number;
  popupBorderRadius: number;
} {
  const isDark = isBackgroundDark(preset.backgroundColor);

  return {
    background: preset.backgroundColor,
    foreground: preset.textColor,
    muted: preset.mutedColor,
    primary: preset.brandColor,
    primaryForeground: preset.primaryForegroundColor || getContrastingTextColor(preset.brandColor),
    surface: preset.surfaceColor,
    border: preset.borderColor,
    success: preset.successColor || "#10B981",
    fontFamily: preset.fontFamily || "system-ui, -apple-system, sans-serif",
    headingFontFamily: preset.headingFontFamily,
    borderRadius: preset.borderRadius ?? 8,
    popupBorderRadius: preset.popupBorderRadius ?? 16,
  };
}

/**
 * Create a theme preset from Shopify theme settings
 * Used during app installation to create the default theme
 */
export function createPresetFromShopifyTheme(
  shopifyTheme: {
    background?: string;
    foreground?: string;
    primary?: string;
    primaryForeground?: string;
    fontFamily?: string;
    headingFontFamily?: string;
    borderRadius?: number;
  },
  options?: { name?: string; isDefault?: boolean }
): ThemePresetInput {
  return {
    id: `store-theme-${Date.now()}`,
    name: options?.name || "Store Theme",
    isDefault: options?.isDefault ?? true,
    // Colors from Shopify theme
    backgroundColor: shopifyTheme.background || "#FFFFFF",
    textColor: shopifyTheme.foreground || "#111827",
    brandColor: shopifyTheme.primary || "#3B82F6",
    primaryForegroundColor: shopifyTheme.primaryForeground || "#FFFFFF",
    // Derived colors (will be computed if not set)
    mutedColor: undefined,
    surfaceColor: undefined,
    borderColor: undefined,
    successColor: "#10B981",
    // Typography from Shopify theme
    fontFamily: shopifyTheme.fontFamily || "inherit",
    headingFontFamily: shopifyTheme.headingFontFamily,
    // Border radius from Shopify theme
    borderRadius: shopifyTheme.borderRadius ?? 8,
    popupBorderRadius: (shopifyTheme.borderRadius ?? 8) * 2,
    // Metadata
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Generate wheel segment colors derived from the theme preset
 * Creates a harmonious color palette based on the brand color
 */
export function getWheelColorsFromPreset(preset: ThemePresetInput, segmentCount: number): string[] {
  const { brandColor, backgroundColor } = preset;

  // Parse brand color to HSL for color manipulation
  const brandRgb = hexToRgb(brandColor);
  if (!brandRgb) {
    // Fallback to basic alternating colors
    return Array.from({ length: segmentCount }, (_, i) =>
      i % 2 === 0 ? brandColor : backgroundColor
    );
  }

  // Convert to HSL for easier manipulation
  const { h, s, l } = rgbToHsl(brandRgb.r, brandRgb.g, brandRgb.b);

  // Generate colors by varying hue and lightness
  const colors: string[] = [];
  for (let i = 0; i < segmentCount; i++) {
    // Alternate between brand-based colors and complementary colors
    if (i % 2 === 0) {
      // Use variations of the brand color (shift hue slightly)
      const hueShift = (i * 15) % 60; // Shift hue by 15 degrees, wrap at 60
      const newHue = (h + hueShift) % 360;
      colors.push(hslToHex(newHue, Math.min(s + 10, 100), l));
    } else {
      // Use lighter/darker version of brand color
      const lightnessShift = i % 4 === 1 ? 15 : -10;
      const newLightness = Math.max(20, Math.min(80, l + lightnessShift));
      colors.push(hslToHex(h, s, newLightness));
    }
  }

  return colors;
}

// ============================================================================
// HSL COLOR UTILITIES
// ============================================================================

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h: number, s: number, l: number): string {
  h = h % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;

  let r = 0, g = 0, b = 0;

  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

