/**
 * Theme Configuration System
 *
 * Provides template-specific theme configurations.
 * Each theme (e.g., "bold", "modern") can have different settings per template type.
 *
 * Architecture:
 * - ThemeColors: Base color palette shared across templates
 * - TemplateThemeOverrides: Template-specific design settings (images, positions, etc.)
 * - ThemeConfig: Complete theme definition with base + overrides
 * - getThemeConfigForTemplate(): Factory function that merges base + template overrides
 */

import { z } from "zod";
import type { TemplateType } from "~/domains/campaigns/types/campaign";

// ============================================================================
// BASE THEME COLORS SCHEMA
// ============================================================================

/**
 * Core color palette that every theme must define.
 * These colors are shared across all template types.
 */
export const ThemeColorsSchema = z.object({
  // Core colors (required)
  background: z.string(),
  text: z.string(),
  primary: z.string(),
  secondary: z.string(),
  accent: z.string(),
  border: z.string(),
  success: z.string(),
  warning: z.string(),

  // Extended colors (optional)
  imageBg: z.string().optional(),
  descColor: z.string().optional(),

  // Typography (optional)
  fontFamily: z.string().optional(),
  titleFontSize: z.string().optional(),
  titleFontWeight: z.string().optional(),
  titleTextShadow: z.string().optional(),
  descriptionFontSize: z.string().optional(),
  descriptionFontWeight: z.string().optional(),

  // Input styling (optional)
  inputTextColor: z.string().optional(),
  inputBackdropFilter: z.string().optional(),
  inputBoxShadow: z.string().optional(),
  inputBorder: z.string().optional(),

  // CTA/Timer styling (optional)
  timerBg: z.string().optional(),
  timerText: z.string().optional(),
  ctaBg: z.string().optional(),
  ctaText: z.string().optional(),

  // Effects (optional)
  blur: z.boolean().optional(),
});

export type ThemeColors = z.infer<typeof ThemeColorsSchema>;

// ============================================================================
// TEMPLATE-SPECIFIC OVERRIDE SCHEMAS
// ============================================================================

/**
 * Base override schema - fields that can be customized per template.
 * All fields are optional; unspecified fields inherit from defaults.
 */
export const BaseTemplateOverrideSchema = z.object({
  // Background image settings
  backgroundImageMode: z.enum(["none", "preset", "file"]).optional(),
  backgroundImagePresetKey: z.string().optional(),
  backgroundImageUrl: z.string().optional(),
  backgroundOverlayOpacity: z.number().min(0).max(1).optional(),

  // Image position (where the image sits in the popup)
  imagePosition: z.enum(["left", "right", "top", "bottom", "full", "none"]).optional(),

  // Color overrides (can tweak specific colors per template)
  accentColorOverride: z.string().optional(),
  buttonColorOverride: z.string().optional(),
});

/**
 * Newsletter-specific overrides.
 * Newsletters typically use background images.
 */
export const NewsletterOverrideSchema = BaseTemplateOverrideSchema.extend({
  // Newsletter often uses background images
});

/**
 * Flash Sale-specific overrides.
 * Flash sales may not use background images, focus on urgency.
 */
export const FlashSaleOverrideSchema = BaseTemplateOverrideSchema.extend({
  // Flash sale specific settings
  urgencyColorOverride: z.string().optional(),
});

/**
 * Spin-to-Win-specific overrides.
 * May have different image needs and wheel-specific colors.
 */
export const SpinToWinOverrideSchema = BaseTemplateOverrideSchema.extend({
  // Wheel styling
  wheelBorderColor: z.string().optional(),
  wheelBorderWidth: z.number().optional(),
});

export type BaseTemplateOverride = z.infer<typeof BaseTemplateOverrideSchema>;
export type NewsletterOverride = z.infer<typeof NewsletterOverrideSchema>;
export type FlashSaleOverride = z.infer<typeof FlashSaleOverrideSchema>;
export type SpinToWinOverride = z.infer<typeof SpinToWinOverrideSchema>;

// ============================================================================
// TEMPLATE OVERRIDES MAP SCHEMA
// ============================================================================

/**
 * Map of template types to their specific overrides.
 * Only templates that need custom behavior need entries here.
 */
export const TemplateOverridesSchema = z.object({
  NEWSLETTER: NewsletterOverrideSchema.optional(),
  FLASH_SALE: FlashSaleOverrideSchema.optional(),
  SPIN_TO_WIN: SpinToWinOverrideSchema.optional(),
  EXIT_INTENT: BaseTemplateOverrideSchema.optional(),
  CART_ABANDONMENT: BaseTemplateOverrideSchema.optional(),
  PRODUCT_UPSELL: BaseTemplateOverrideSchema.optional(),
  SOCIAL_PROOF: BaseTemplateOverrideSchema.optional(),
  COUNTDOWN_TIMER: BaseTemplateOverrideSchema.optional(),
  FREE_SHIPPING: BaseTemplateOverrideSchema.optional(),
  SCRATCH_CARD: BaseTemplateOverrideSchema.optional(),
  ANNOUNCEMENT: BaseTemplateOverrideSchema.optional(),
});

export type TemplateOverrides = z.infer<typeof TemplateOverridesSchema>;

// ============================================================================
// COMPLETE THEME CONFIG SCHEMA
// ============================================================================

/**
 * Complete theme configuration.
 * Includes base colors and optional per-template overrides.
 */
export const ThemeConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),

  // Base color palette (used as default for all templates)
  baseColors: ThemeColorsSchema,

  // Template-specific overrides
  templateOverrides: TemplateOverridesSchema.optional(),
});

export type ThemeConfig = z.infer<typeof ThemeConfigSchema>;

// ============================================================================
// THEME KEY TYPE
// ============================================================================

/**
 * Available theme keys.
 * Must match the keys in THEME_REGISTRY.
 */
export type ThemeKey =
  | "modern"
  | "minimal"
  | "elegant"
  | "bold"
  | "glass"
  | "dark"
  | "gradient"
  | "luxury"
  | "neon"
  | "ocean"
  | "summer-sale";

// ============================================================================
// RESOLVED THEME CONFIG
// ============================================================================

/**
 * The result of resolving a theme for a specific template.
 * Contains the base colors merged with template-specific overrides.
 */
export interface ResolvedThemeConfig {
  themeKey: ThemeKey;
  themeName: string;

  // Base colors
  colors: ThemeColors;

  // Template-specific settings (merged from overrides)
  backgroundImageMode: "none" | "preset" | "file";
  backgroundImagePresetKey?: string;
  backgroundImageUrl?: string;
  backgroundOverlayOpacity?: number;
  imagePosition: "left" | "right" | "top" | "bottom" | "full" | "none";

  // Optional color overrides
  accentColorOverride?: string;
  buttonColorOverride?: string;

  // Template-specific extras (for SpinToWin, etc.)
  extras?: Record<string, unknown>;
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Get the resolved theme configuration for a specific template type.
 *
 * This function:
 * 1. Looks up the base theme by key
 * 2. Merges any template-specific overrides
 * 3. Returns a fully resolved configuration
 *
 * @param themeKey - The theme identifier (e.g., "bold", "modern")
 * @param templateType - The template type (e.g., "NEWSLETTER", "FLASH_SALE")
 * @returns ResolvedThemeConfig with merged settings
 */
export function getThemeConfigForTemplate(
  themeKey: ThemeKey,
  templateType: TemplateType
): ResolvedThemeConfig {
  const theme = THEME_REGISTRY[themeKey];

  if (!theme) {
    // Fallback to modern if theme not found
    return getThemeConfigForTemplate("modern", templateType);
  }

  const baseColors = theme.baseColors;
  const templateOverrides = theme.templateOverrides?.[templateType] ?? {};

  // Build the resolved config
  const resolved: ResolvedThemeConfig = {
    themeKey,
    themeName: theme.name,
    colors: baseColors,

    // Apply template overrides with sensible defaults
    backgroundImageMode: templateOverrides.backgroundImageMode ?? "none",
    backgroundImagePresetKey: templateOverrides.backgroundImagePresetKey,
    backgroundImageUrl: templateOverrides.backgroundImageUrl,
    backgroundOverlayOpacity: templateOverrides.backgroundOverlayOpacity,
    imagePosition: templateOverrides.imagePosition ?? "left",

    // Color overrides
    accentColorOverride: templateOverrides.accentColorOverride,
    buttonColorOverride: templateOverrides.buttonColorOverride,
  };

  // Add template-specific extras
  if (templateType === "SPIN_TO_WIN" && "wheelBorderColor" in templateOverrides) {
    resolved.extras = {
      wheelBorderColor: (templateOverrides as SpinToWinOverride).wheelBorderColor,
      wheelBorderWidth: (templateOverrides as SpinToWinOverride).wheelBorderWidth,
    };
  }

  return resolved;
}

/**
 * Get the background image URL for a theme and template.
 * Returns undefined if the template doesn't use background images.
 */
export function getThemeBackgroundUrl(
  themeKey: ThemeKey,
  templateType: TemplateType
): string | undefined {
  const resolved = getThemeConfigForTemplate(themeKey, templateType);

  if (resolved.backgroundImageMode === "none") {
    return undefined;
  }

  if (resolved.backgroundImageUrl) {
    return resolved.backgroundImageUrl;
  }

  if (resolved.backgroundImagePresetKey) {
    return `/apps/revenue-boost/assets/newsletter-backgrounds/${resolved.backgroundImagePresetKey}.jpg`;
  }

  return undefined;
}

/**
 * Check if a theme uses background images for a specific template.
 */
export function themeUsesBackgroundImage(
  themeKey: ThemeKey,
  templateType: TemplateType
): boolean {
  const resolved = getThemeConfigForTemplate(themeKey, templateType);
  return resolved.backgroundImageMode !== "none";
}

// ============================================================================
// THEME REGISTRY
// ============================================================================

/**
 * Central registry of all themes.
 * Each theme defines base colors and optional template-specific overrides.
 *
 * To add a new theme:
 * 1. Add the key to ThemeKey type
 * 2. Add the configuration here with baseColors
 * 3. Optionally add templateOverrides for template-specific behavior
 */
export const THEME_REGISTRY: Record<ThemeKey, ThemeConfig> = {
  modern: {
    id: "modern",
    name: "Modern",
    description: "Clean and professional blue theme",
    baseColors: {
      background: "#ffffff",
      text: "#111827",
      primary: "#3b82f6",
      secondary: "#f3f4f6",
      accent: "#dbeafe",
      border: "#e5e7eb",
      success: "#10b981",
      warning: "#ef4444",
      imageBg: "#f4f4f5",
      descColor: "#52525b",
      inputBorder: "#d4d4d8",
      timerBg: "rgba(59, 130, 246, 0.1)",
      timerText: "#3b82f6",
      ctaBg: "#3b82f6",
      ctaText: "#ffffff",
      fontFamily: "inherit",
      titleFontSize: "1.875rem",
      titleFontWeight: "700",
      descriptionFontSize: "1rem",
      descriptionFontWeight: "400",
    },
    templateOverrides: {
      NEWSLETTER: {
        backgroundImageMode: "preset",
        backgroundImagePresetKey: "modern",
        imagePosition: "left",
      },
      FLASH_SALE: {
        backgroundImageMode: "none",
        imagePosition: "none",
      },
      SPIN_TO_WIN: {
        backgroundImageMode: "none",
        imagePosition: "none",
        wheelBorderColor: "#3b82f6",
        wheelBorderWidth: 6,
      },
      SCRATCH_CARD: {
        backgroundImageMode: "preset",
        backgroundImagePresetKey: "modern",
        imagePosition: "left",
      },
    },
  },

  minimal: {
    id: "minimal",
    name: "Minimal",
    description: "Ultra-light with subtle accents",
    baseColors: {
      background: "#fafafa",
      text: "#18181b",
      primary: "#18181b",
      secondary: "#f4f4f5",
      accent: "#e4e4e7",
      border: "#e4e4e7",
      success: "#22c55e",
      warning: "#ef4444",
      imageBg: "#f4f4f5",
      descColor: "#71717a",
      inputBorder: "#d4d4d8",
      timerBg: "#f4f4f5",
      timerText: "#18181b",
      ctaBg: "#18181b",
      ctaText: "#ffffff",
      fontFamily: "inherit",
      titleFontSize: "1.5rem",
      titleFontWeight: "300",
      descriptionFontSize: "0.875rem",
      descriptionFontWeight: "400",
    },
    templateOverrides: {
      NEWSLETTER: {
        backgroundImageMode: "preset",
        backgroundImagePresetKey: "minimal",
        imagePosition: "left",
      },
      FLASH_SALE: {
        backgroundImageMode: "none",
        imagePosition: "none",
      },
      SPIN_TO_WIN: {
        backgroundImageMode: "none",
        imagePosition: "none",
        wheelBorderColor: "#d4d4d8",
        wheelBorderWidth: 3,
      },
      SCRATCH_CARD: {
        backgroundImageMode: "preset",
        backgroundImagePresetKey: "minimal",
        imagePosition: "left",
      },
    },
  },

  elegant: {
    id: "elegant",
    name: "Elegant",
    description: "Warm yellow tones with serif typography",
    baseColors: {
      background: "#fefce8",
      text: "#44403c",
      primary: "#a855f7",
      secondary: "#fef3c7",
      accent: "#f3e8ff",
      border: "#e7e5e4",
      success: "#a855f7",
      warning: "#dc2626",
      imageBg: "#fef3c7",
      descColor: "#78716c",
      fontFamily: "serif",
      titleFontSize: "1.875rem",
      titleFontWeight: "700",
      descriptionFontSize: "1rem",
      descriptionFontWeight: "400",
      inputBorder: "#e7e5e4",
      timerBg: "rgba(168, 85, 247, 0.1)",
      timerText: "#a855f7",
      ctaBg: "#a855f7",
      ctaText: "#ffffff",
    },
    templateOverrides: {
      NEWSLETTER: {
        backgroundImageMode: "preset",
        backgroundImagePresetKey: "elegant",
        imagePosition: "left",
      },
      FLASH_SALE: {
        backgroundImageMode: "none",
        imagePosition: "none",
      },
      SPIN_TO_WIN: {
        backgroundImageMode: "none",
        imagePosition: "none",
        wheelBorderColor: "#a855f7",
        wheelBorderWidth: 5,
      },
      SCRATCH_CARD: {
        backgroundImageMode: "preset",
        backgroundImagePresetKey: "elegant",
        imagePosition: "left",
      },
    },
  },

  bold: {
    id: "bold",
    name: "Bold",
    description: "Vibrant gradient with high contrast",
    baseColors: {
      background: "linear-gradient(135deg, #ec4899 0%, #f59e0b 100%)",
      text: "#ffffff",
      primary: "#fde68a",
      secondary: "rgba(255, 255, 255, 0.2)",
      accent: "#fde68a",
      border: "rgba(255, 255, 255, 0.3)",
      success: "#10b981",
      warning: "#fca5a5",
      imageBg: "rgba(255, 255, 255, 0.15)",
      descColor: "#fef3c7",
      inputBorder: "rgba(255, 255, 255, 0.3)",
      inputTextColor: "#ffffff",
      timerBg: "rgba(255, 255, 255, 0.25)",
      timerText: "#ffffff",
      ctaBg: "#ffffff",
      ctaText: "#ec4899",
      fontFamily: "inherit",
      titleFontSize: "2rem",
      titleFontWeight: "900",
      descriptionFontSize: "1rem",
      descriptionFontWeight: "500",
    },
    templateOverrides: {
      NEWSLETTER: {
        backgroundImageMode: "preset",
        backgroundImagePresetKey: "bold",
        imagePosition: "left",
      },
      FLASH_SALE: {
        // Flash sale uses no background image for bold - keeps focus on the sale
        backgroundImageMode: "none",
        imagePosition: "none",
      },
      SPIN_TO_WIN: {
        backgroundImageMode: "none",
        imagePosition: "none",
        wheelBorderColor: "#ffffff",
        wheelBorderWidth: 8,
      },
      SCRATCH_CARD: {
        backgroundImageMode: "preset",
        backgroundImagePresetKey: "bold",
        imagePosition: "left",
      },
    },
  },

  glass: {
    id: "glass",
    name: "Glass",
    description: "Glassmorphism with blur effect",
    baseColors: {
      background: "rgba(255, 255, 255, 0.7)",
      text: "#18181b",
      primary: "#6366f1",
      secondary: "rgba(255, 255, 255, 0.5)",
      accent: "rgba(99, 102, 241, 0.1)",
      border: "rgba(255, 255, 255, 0.3)",
      success: "#10b981",
      warning: "#ef4444",
      imageBg: "rgba(244, 244, 245, 0.8)",
      descColor: "#52525b",
      inputBorder: "rgba(212, 212, 216, 0.5)",
      timerBg: "rgba(99, 102, 241, 0.15)",
      timerText: "#6366f1",
      ctaBg: "#6366f1",
      ctaText: "#ffffff",
      blur: true,
      fontFamily: "inherit",
      titleFontSize: "1.875rem",
      titleFontWeight: "700",
      descriptionFontSize: "1rem",
      descriptionFontWeight: "400",
      inputBackdropFilter: "blur(10px)",
    },
    templateOverrides: {
      NEWSLETTER: {
        backgroundImageMode: "preset",
        backgroundImagePresetKey: "glass",
        imagePosition: "left",
      },
      FLASH_SALE: {
        backgroundImageMode: "none",
        imagePosition: "none",
      },
      SPIN_TO_WIN: {
        backgroundImageMode: "none",
        imagePosition: "none",
        wheelBorderColor: "rgba(99, 102, 241, 0.4)",
        wheelBorderWidth: 4,
      },
      SCRATCH_CARD: {
        backgroundImageMode: "preset",
        backgroundImagePresetKey: "glass",
        imagePosition: "left",
      },
    },
  },

  dark: {
    id: "dark",
    name: "Dark",
    description: "Dark mode optimized",
    baseColors: {
      background: "#111827",
      text: "#f9fafb",
      primary: "#3b82f6",
      secondary: "#1f2937",
      accent: "#374151",
      border: "#374151",
      success: "#10b981",
      warning: "#ef4444",
      imageBg: "#1f2937",
      descColor: "#d1d5db",
      inputBorder: "#4b5563",
      timerBg: "#1f2937",
      timerText: "#f9fafb",
      ctaBg: "#3b82f6",
      ctaText: "#ffffff",
      fontFamily: "inherit",
      titleFontSize: "1.875rem",
      titleFontWeight: "700",
      descriptionFontSize: "1rem",
      descriptionFontWeight: "400",
    },
    templateOverrides: {
      NEWSLETTER: {
        backgroundImageMode: "preset",
        backgroundImagePresetKey: "dark",
        imagePosition: "left",
      },
      FLASH_SALE: {
        backgroundImageMode: "none",
        imagePosition: "none",
      },
      SPIN_TO_WIN: {
        backgroundImageMode: "none",
        imagePosition: "none",
        wheelBorderColor: "#4b5563",
        wheelBorderWidth: 5,
      },
      SCRATCH_CARD: {
        backgroundImageMode: "preset",
        backgroundImagePresetKey: "dark",
        imagePosition: "left",
      },
    },
  },

  gradient: {
    id: "gradient",
    name: "Gradient",
    description: "Purple gradient background",
    baseColors: {
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      text: "#ffffff",
      primary: "#e0e7ff",
      secondary: "rgba(255, 255, 255, 0.15)",
      accent: "#e0e7ff",
      border: "rgba(255, 255, 255, 0.2)",
      success: "#10b981",
      warning: "#fca5a5",
      imageBg: "rgba(255, 255, 255, 0.1)",
      descColor: "#e0e7ff",
      inputBorder: "rgba(255, 255, 255, 0.3)",
      inputTextColor: "#ffffff",
      timerBg: "rgba(255, 255, 255, 0.2)",
      timerText: "#ffffff",
      ctaBg: "#ffffff",
      ctaText: "#667eea",
      fontFamily: "inherit",
      titleFontSize: "2rem",
      titleFontWeight: "700",
      descriptionFontSize: "1rem",
      descriptionFontWeight: "400",
      inputBackdropFilter: "blur(10px)",
    },
    templateOverrides: {
      NEWSLETTER: {
        backgroundImageMode: "preset",
        backgroundImagePresetKey: "gradient",
        imagePosition: "left",
      },
      FLASH_SALE: {
        backgroundImageMode: "none",
        imagePosition: "none",
      },
      SPIN_TO_WIN: {
        backgroundImageMode: "none",
        imagePosition: "none",
        wheelBorderColor: "rgba(255, 255, 255, 0.4)",
        wheelBorderWidth: 5,
      },
      SCRATCH_CARD: {
        backgroundImageMode: "preset",
        backgroundImagePresetKey: "gradient",
        imagePosition: "left",
      },
    },
  },

  luxury: {
    id: "luxury",
    name: "Luxury",
    description: "Gold on black, premium feel",
    baseColors: {
      background: "#1a1a0a",
      text: "#d4af37",
      primary: "#d4af37",
      secondary: "#2d2d1a",
      accent: "#3d3d2a",
      border: "#d4af37",
      success: "#d4af37",
      warning: "#dc2626",
      imageBg: "#2d2d1a",
      descColor: "#f5f5dc",
      inputBorder: "#d4af37",
      timerBg: "rgba(212, 175, 55, 0.1)",
      timerText: "#d4af37",
      ctaBg: "#d4af37",
      ctaText: "#1a1a0a",
      fontFamily: "serif",
      titleFontSize: "1.875rem",
      titleFontWeight: "700",
      descriptionFontSize: "1rem",
      descriptionFontWeight: "400",
    },
    templateOverrides: {
      NEWSLETTER: {
        backgroundImageMode: "preset",
        backgroundImagePresetKey: "luxury",
        imagePosition: "left",
      },
      FLASH_SALE: {
        backgroundImageMode: "none",
        imagePosition: "none",
      },
      SPIN_TO_WIN: {
        backgroundImageMode: "none",
        imagePosition: "none",
        wheelBorderColor: "#d4af37",
        wheelBorderWidth: 5,
      },
      SCRATCH_CARD: {
        backgroundImageMode: "preset",
        backgroundImagePresetKey: "luxury",
        imagePosition: "left",
      },
    },
  },

  neon: {
    id: "neon",
    name: "Neon",
    description: "Cyberpunk glow effects",
    baseColors: {
      background: "#0a0a1f",
      text: "#00ffff",
      primary: "#00ffff",
      secondary: "#1a1a3a",
      accent: "#ff00ff",
      border: "rgba(0, 255, 255, 0.3)",
      success: "#00ffff",
      warning: "#ff00ff",
      imageBg: "#1a1a3a",
      descColor: "#00ffff",
      inputBorder: "rgba(0, 255, 255, 0.5)",
      timerBg: "rgba(0, 255, 255, 0.1)",
      timerText: "#00ffff",
      ctaBg: "#00ffff",
      ctaText: "#0a0a1f",
      fontFamily: "inherit",
      titleFontSize: "2rem",
      titleFontWeight: "900",
      titleTextShadow: "0 0 20px currentColor, 0 0 40px currentColor",
      descriptionFontSize: "1rem",
      descriptionFontWeight: "400",
      inputBoxShadow: "0 0 10px rgba(0, 255, 255, 0.1)",
    },
    templateOverrides: {
      NEWSLETTER: {
        backgroundImageMode: "preset",
        backgroundImagePresetKey: "neon",
        imagePosition: "left",
      },
      FLASH_SALE: {
        backgroundImageMode: "none",
        imagePosition: "none",
      },
      SPIN_TO_WIN: {
        backgroundImageMode: "none",
        imagePosition: "none",
        wheelBorderColor: "#00ffff",
        wheelBorderWidth: 6,
      },
      SCRATCH_CARD: {
        backgroundImageMode: "preset",
        backgroundImagePresetKey: "neon",
        imagePosition: "left",
      },
    },
  },

  ocean: {
    id: "ocean",
    name: "Ocean",
    description: "Fresh blue/teal palette",
    baseColors: {
      background: "#f0f9ff",
      text: "#0c4a6e",
      primary: "#0ea5e9",
      secondary: "#e0f2fe",
      accent: "#bae6fd",
      border: "#7dd3fc",
      success: "#14b8a6",
      warning: "#ef4444",
      imageBg: "#e0f2fe",
      descColor: "#0369a1",
      inputBorder: "#7dd3fc",
      timerBg: "rgba(14, 165, 233, 0.1)",
      timerText: "#0ea5e9",
      ctaBg: "#0ea5e9",
      ctaText: "#ffffff",
      fontFamily: "inherit",
      titleFontSize: "1.875rem",
      titleFontWeight: "700",
      descriptionFontSize: "1rem",
      descriptionFontWeight: "400",
    },
    templateOverrides: {
      NEWSLETTER: {
        backgroundImageMode: "preset",
        backgroundImagePresetKey: "ocean",
        imagePosition: "left",
      },
      FLASH_SALE: {
        backgroundImageMode: "none",
        imagePosition: "none",
      },
      SPIN_TO_WIN: {
        backgroundImageMode: "none",
        imagePosition: "none",
        wheelBorderColor: "#0ea5e9",
        wheelBorderWidth: 6,
      },
      SCRATCH_CARD: {
        backgroundImageMode: "preset",
        backgroundImagePresetKey: "ocean",
        imagePosition: "left",
      },
    },
  },

  "summer-sale": {
    id: "summer-sale",
    name: "Summer Sale",
    description: "Sunny orange & turquoise",
    baseColors: {
      background: "#FFFBEB",
      text: "#1E3A5F",
      primary: "#FF5733",
      secondary: "#FEF3C7",
      accent: "#38BDF8",
      border: "#FBBF24",
      success: "#10B981",
      warning: "#EF4444",
      imageBg: "#FEF9C3",
      descColor: "#0F766E",
      inputBorder: "#FBBF24",
      timerBg: "rgba(255, 87, 51, 0.1)",
      timerText: "#FF5733",
      ctaBg: "#FF5733",
      ctaText: "#FFFFFF",
      fontFamily: "inherit",
      titleFontSize: "1.875rem",
      titleFontWeight: "700",
      descriptionFontSize: "1rem",
      descriptionFontWeight: "400",
    },
    templateOverrides: {
      NEWSLETTER: {
        backgroundImageMode: "preset",
        backgroundImagePresetKey: "summer-sale",
        imagePosition: "full", // Summer sale uses full background by default
        backgroundOverlayOpacity: 0.4,
      },
      FLASH_SALE: {
        // Flash sale also uses full background for summer-sale theme
        backgroundImageMode: "preset",
        backgroundImagePresetKey: "summer-sale",
        imagePosition: "full",
        backgroundOverlayOpacity: 0.5,
      },
      SPIN_TO_WIN: {
        backgroundImageMode: "none",
        imagePosition: "none",
        wheelBorderColor: "#FF5733",
        wheelBorderWidth: 6,
      },
      SCRATCH_CARD: {
        backgroundImageMode: "preset",
        backgroundImagePresetKey: "summer-sale",
        imagePosition: "full",
        backgroundOverlayOpacity: 0.4,
      },
    },
  },
};

/**
 * Get all available theme keys.
 */
export function getAvailableThemeKeys(): ThemeKey[] {
  return Object.keys(THEME_REGISTRY) as ThemeKey[];
}

/**
 * Get theme metadata for UI display (name, description).
 */
export function getThemeMetadata(themeKey: ThemeKey): { name: string; description: string } {
  const theme = THEME_REGISTRY[themeKey];
  return {
    name: theme?.name ?? themeKey,
    description: theme?.description ?? "",
  };
}

