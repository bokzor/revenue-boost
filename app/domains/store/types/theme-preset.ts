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
 * Simplified theme preset input schema
 * Merchants only need to configure 4-5 colors + font
 */
export const ThemePresetInputSchema = z.object({
  /** Unique identifier for the preset */
  id: z.string().uuid(),

  /** Human-readable name for the preset */
  name: z.string().min(1).max(50),

  /** Optional description */
  description: z.string().max(200).optional(),

  // ============================================================================
  // CORE COLORS (Required)
  // ============================================================================

  /** Brand/Primary color - used for buttons, CTAs, accents, highlights */
  brandColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/, "Must be a valid hex color"),

  /** Background color - popup background (solid color or CSS gradient) */
  backgroundColor: z.string().min(1),

  /** Text color - headings and primary text */
  textColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/, "Must be a valid hex color"),

  // ============================================================================
  // OPTIONAL COLORS (With smart defaults)
  // ============================================================================

  /** Surface color - input fields, cards (default: derived from background) */
  surfaceColor: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6})$/, "Must be a valid hex color")
    .optional(),

  /** Success color - success states (default: #10B981) */
  successColor: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6})$/, "Must be a valid hex color")
    .optional(),

  // ============================================================================
  // TYPOGRAPHY
  // ============================================================================

  /** Font family (default: "inherit") */
  fontFamily: z.string().optional(),

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
  if (!rgb) return hex;

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
  if (!rgb) return hex;

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
 * Expand a simplified theme preset into a full DesignConfig
 *
 * This function takes the 4-5 colors that merchants configure and derives
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
    surfaceColor,
    successColor,
    fontFamily,
  } = preset;

  const isDark = isBackgroundDark(backgroundColor);

  // Compute surface color if not provided
  const computedSurfaceColor =
    surfaceColor || (isDark ? lightenColor(extractSolidColor(backgroundColor), 10) : "#F3F4F6");

  // Compute description color (muted version of text)
  const descriptionColor = isDark
    ? hexToRgba(textColor, 0.8)
    : darkenColor(lightenColor(textColor, 40), 0);

  // Compute input border color
  const inputBorderColor = isDark
    ? hexToRgba(textColor, 0.3)
    : darkenColor(computedSurfaceColor, 15);

  // Auto-contrast for button text
  const buttonTextColor = getContrastingTextColor(brandColor);

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
  };
}

/**
 * Create a new theme preset with defaults
 */
export function createEmptyThemePreset(overrides?: Partial<ThemePresetInput>): ThemePresetInput {
  return {
    id: crypto.randomUUID(),
    name: "",
    brandColor: "#3B82F6",
    backgroundColor: "#FFFFFF",
    textColor: "#111827",
    surfaceColor: "#F3F4F6",
    successColor: "#10B981",
    fontFamily: "inherit",
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
 * Generate wheel segment colors derived from the theme preset
 * Creates a harmonious color palette based on the brand color
 */
export function getWheelColorsFromPreset(preset: ThemePresetInput, segmentCount: number): string[] {
  const { brandColor, backgroundColor, textColor } = preset;

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

