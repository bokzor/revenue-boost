/**
 * Design Tokens Schema
 *
 * Simplified 12-token design system for popup styling.
 * Replaces the legacy 50+ field DesignConfigSchema.
 *
 * Theme Modes:
 * - "shopify": Inherit colors/fonts from merchant's Shopify theme (auto-sync)
 * - "preset": Use predefined artistic/seasonal design (e.g., Bold Energy, Black Friday)
 * - "custom": Manual color configuration by the merchant
 */

import { z } from "zod";

// =============================================================================
// THEME MODE
// =============================================================================

/**
 * Theme mode determines the source of design tokens:
 * - default: Use the store's default theme preset (recommended)
 * - shopify: Auto-inherit from store theme (legacy, same as default)
 * - preset: Use predefined artistic/seasonal design (for inspiration recipes)
 * - custom: Merchant-defined colors (manual override)
 */
export const ThemeModeSchema = z.enum(["default", "shopify", "preset", "custom"]);
export type ThemeMode = z.infer<typeof ThemeModeSchema>;

// =============================================================================
// DESIGN TOKENS (12 Semantic Tokens)
// =============================================================================

/**
 * Simplified design tokens - 12 semantic values that control all popup styling.
 * These map directly to CSS custom properties (--rb-*).
 */
export const DesignTokensSchema = z.object({
  // === Colors (7) ===
  /** Primary background color */
  background: z.string().default("#ffffff"),
  /** Primary text color */
  foreground: z.string().default("#1a1a1a"),
  /** Muted/secondary text color (derived from foreground if not set) */
  muted: z.string().optional(),
  /** Primary action color (buttons, links) */
  primary: z.string().default("#000000"),
  /** Text color on primary background */
  primaryForeground: z.string().default("#ffffff"),
  /** Surface/card background color (derived from background if not set) */
  surface: z.string().optional(),
  /** Border color (derived from foreground if not set) */
  border: z.string().optional(),
  /** Success state color */
  success: z.string().default("#10B981"),

  // === Typography (2) ===
  /** Body text font family (CSS font-family string with fallbacks) */
  fontFamily: z.string().default("system-ui, -apple-system, sans-serif"),
  /** Heading font family (optional, defaults to fontFamily) */
  headingFontFamily: z.string().optional(),

  // === Border Radius (2) ===
  /** Border radius for buttons and inputs (in pixels) */
  borderRadius: z.number().min(0).max(50).default(8),
  /** Border radius for the popup container (in pixels) */
  popupBorderRadius: z.number().min(0).max(50).default(16),
});

export type DesignTokens = z.infer<typeof DesignTokensSchema>;

// =============================================================================
// PRESET DESIGN (for artistic/seasonal templates)
// =============================================================================

/**
 * Preset design - complete design package for inspiration/seasonal recipes.
 * Includes all 12 tokens plus additional styling that can't be auto-derived.
 */
export const PresetDesignSchema = DesignTokensSchema.extend({
  /** Preset identifier (e.g., "bold-energy", "black-friday") */
  presetId: z.string(),
  /** Human-readable name */
  presetName: z.string(),
  /** Additional custom CSS for complex designs */
  customCSS: z.string().optional(),
  /** Background gradient (overrides background color) */
  backgroundGradient: z.string().optional(),
  /** Background image URL */
  backgroundImage: z.string().optional(),
  /** Background image overlay opacity */
  backgroundOverlayOpacity: z.number().min(0).max(1).optional(),
});

export type PresetDesign = z.infer<typeof PresetDesignSchema>;

// =============================================================================
// LAYOUT OPTIONS (separate from colors/fonts)
// =============================================================================

/**
 * Layout configuration - structural options that are independent of theme.
 * These apply regardless of whether using shopify/preset/custom colors.
 */
export const LayoutOptionsSchema = z.object({
  /** Popup position on screen */
  position: z.enum(["center", "top", "bottom", "left", "right"]).default("center"),
  /** Display mode */
  displayMode: z.enum(["popup", "banner", "slide-in", "inline"]).default("popup"),
  /** Animation type */
  animation: z.enum(["fade", "slide", "bounce", "none"]).default("fade"),
  /** Show close button */
  showCloseButton: z.boolean().default(true),
  /** Layout variant for split/stacked layouts */
  layout: z
    .enum([
      "centered",
      "split-left",
      "split-right",
      "fullscreen",
      "banner-top",
      "banner-bottom",
      "sidebar-left",
      "sidebar-right",
    ])
    .default("centered"),
  /** Image position (for templates with images) */
  imagePosition: z.enum(["left", "right", "top", "bottom", "full", "none"]).optional(),
});

export type LayoutOptions = z.infer<typeof LayoutOptionsSchema>;

// =============================================================================
// PRESET CATALOG - Predefined designs for inspiration/seasonal recipes
// =============================================================================

/**
 * Catalog of preset designs.
 * These are used when themeMode is "preset".
 */
export const PRESET_DESIGNS: Record<string, PresetDesign> = {
  // === NEWSLETTER INSPIRATION PRESETS ===
  "bold-energy": {
    presetId: "bold-energy",
    presetName: "Bold Energy",
    background: "#1a1a2e",
    foreground: "#ffffff",
    primary: "#ff6b35",
    primaryForeground: "#ffffff",
    success: "#10B981",
    fontFamily: "'Oswald', sans-serif",
    borderRadius: 0,
    popupBorderRadius: 0,
    backgroundGradient: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
  },
  "active-life": {
    presetId: "active-life",
    presetName: "Active Life",
    background: "#f0f7f4",
    foreground: "#2d5a45",
    primary: "#3d8b6e",
    primaryForeground: "#ffffff",
    success: "#10B981",
    fontFamily: "'Montserrat', sans-serif",
    borderRadius: 24,
    popupBorderRadius: 24,
  },
  "spa-serenity": {
    presetId: "spa-serenity",
    presetName: "Spa Serenity",
    background: "#faf8f5",
    foreground: "#5c5c5c",
    primary: "#8b7355",
    primaryForeground: "#ffffff",
    success: "#10B981",
    fontFamily: "'Cormorant Garamond', serif",
    headingFontFamily: "'Cormorant Garamond', serif",
    borderRadius: 4,
    popupBorderRadius: 16,
  },
  "fresh-organic": {
    presetId: "fresh-organic",
    presetName: "Fresh & Organic",
    background: "#f8faf5",
    foreground: "#2d3b1f",
    primary: "#4a7c23",
    primaryForeground: "#ffffff",
    success: "#4a7c23",
    fontFamily: "'Nunito', sans-serif",
    borderRadius: 999,
    popupBorderRadius: 24,
  },
  "elegant-luxe": {
    presetId: "elegant-luxe",
    presetName: "Elegant Luxe",
    background: "#0d0d0d",
    foreground: "#d4af37",
    primary: "#d4af37",
    primaryForeground: "#0d0d0d",
    success: "#10B981",
    fontFamily: "'Playfair Display', serif",
    borderRadius: 0,
    popupBorderRadius: 0,
  },

  // === SEASONAL PRESETS ===
  "black-friday": {
    presetId: "black-friday",
    presetName: "Black Friday",
    background: "#000000",
    foreground: "#ffffff",
    primary: "#ff0000",
    primaryForeground: "#ffffff",
    success: "#10B981",
    fontFamily: "'Bebas Neue', sans-serif",
    borderRadius: 0,
    popupBorderRadius: 8,
    backgroundGradient: "linear-gradient(135deg, #000000 0%, #1a1a1a 100%)",
  },
  "cyber-monday": {
    presetId: "cyber-monday",
    presetName: "Cyber Monday",
    background: "#0a0a1f",
    foreground: "#00ffff",
    primary: "#00ffff",
    primaryForeground: "#0a0a1f",
    success: "#00ff00",
    fontFamily: "'Orbitron', sans-serif",
    borderRadius: 4,
    popupBorderRadius: 12,
    backgroundGradient: "linear-gradient(135deg, #0a0a1f 0%, #1a1a3f 100%)",
  },
  "holiday-festive": {
    presetId: "holiday-festive",
    presetName: "Holiday Festive",
    background: "#1a472a",
    foreground: "#ffffff",
    primary: "#c41e3a",
    primaryForeground: "#ffffff",
    success: "#ffd700",
    fontFamily: "'Playfair Display', serif",
    borderRadius: 8,
    popupBorderRadius: 16,
  },
  "summer-vibes": {
    presetId: "summer-vibes",
    presetName: "Summer Vibes",
    background: "#fff5e6",
    foreground: "#2d4059",
    primary: "#ff6b35",
    primaryForeground: "#ffffff",
    success: "#10B981",
    fontFamily: "'Poppins', sans-serif",
    borderRadius: 16,
    popupBorderRadius: 24,
    backgroundGradient: "linear-gradient(135deg, #fff5e6 0%, #ffe4cc 100%)",
  },

  // === SPIN-TO-WIN PRESETS ===
  "neon-nights": {
    presetId: "neon-nights",
    presetName: "Neon Nights",
    background: "#0f0f23",
    foreground: "#ff00ff",
    primary: "#ff00ff",
    primaryForeground: "#0f0f23",
    success: "#00ff00",
    fontFamily: "'Audiowide', sans-serif",
    borderRadius: 8,
    popupBorderRadius: 24,
    backgroundGradient: "linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%)",
  },
  "retro-arcade": {
    presetId: "retro-arcade",
    presetName: "Retro Arcade",
    background: "#2b0548",
    foreground: "#ffff00",
    primary: "#ff6b6b",
    primaryForeground: "#2b0548",
    success: "#00ff00",
    fontFamily: "'Press Start 2P', cursive",
    borderRadius: 0,
    popupBorderRadius: 8,
  },
};

/**
 * Get a preset design by ID
 */
export function getPresetDesign(presetId: string): PresetDesign | undefined {
  return PRESET_DESIGNS[presetId];
}

/**
 * Get all preset IDs
 */
export function getAllPresetIds(): string[] {
  return Object.keys(PRESET_DESIGNS);
}

// =============================================================================
// CAMPAIGN DESIGN CONFIG (combines mode + tokens + layout)
// =============================================================================

/**
 * Complete design configuration for a campaign.
 * This is the new simplified schema that replaces the old DesignConfigSchema.
 */
export const CampaignDesignSchema = z.object({
  /** Theme mode: where do the colors come from? */
  themeMode: ThemeModeSchema.default("shopify"),

  /** Preset ID when themeMode is "preset" */
  presetId: z.string().optional(),

  /** Custom tokens when themeMode is "custom" (or overrides for any mode) */
  tokens: DesignTokensSchema.partial().optional(),

  /** Layout options (always customizable) */
  layout: LayoutOptionsSchema.optional(),

  /** Background image settings (always customizable) */
  backgroundImageUrl: z.string().optional(),
  backgroundImageMode: z.enum(["none", "preset", "file"]).optional().default("none"),
  backgroundImagePresetKey: z.string().optional(),
  backgroundOverlayOpacity: z.number().min(0).max(1).optional().default(0.6),
});

/**
 * Input type for CampaignDesign (what you pass in - all fields optional)
 */
export type CampaignDesignInput = z.input<typeof CampaignDesignSchema>;

export type CampaignDesign = z.infer<typeof CampaignDesignSchema>;

// =============================================================================
// TOKEN RESOLUTION UTILITIES
// =============================================================================

/**
 * Default design tokens (used when no theme is available)
 */
export const DEFAULT_DESIGN_TOKENS: DesignTokens = {
  background: "#ffffff",
  foreground: "#1a1a1a",
  muted: "rgba(26, 26, 26, 0.6)",
  primary: "#000000",
  primaryForeground: "#ffffff",
  surface: "#f5f5f5",
  border: "rgba(26, 26, 26, 0.2)",
  success: "#10B981",
  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  borderRadius: 8,
  popupBorderRadius: 16,
};

/**
 * Resolve final design tokens based on the campaign design configuration.
 *
 * Resolution order:
 * 1. If themeMode is "preset" and presetId is set, use preset tokens
 * 2. If themeMode is "default" or "shopify", use provided defaultTokens (from store's default preset)
 * 3. If themeMode is "custom", use custom tokens
 * 4. Merge any token overrides on top
 *
 * @param design The campaign design configuration
 * @param defaultTokens Tokens from the store's default theme preset (required for "default"/"shopify" mode)
 */
export function resolveDesignTokens(
  design: CampaignDesignInput | undefined,
  defaultTokens?: Partial<DesignTokens>
): DesignTokens {
  if (!design) {
    return defaultTokens
      ? { ...DEFAULT_DESIGN_TOKENS, ...defaultTokens }
      : DEFAULT_DESIGN_TOKENS;
  }

  let baseTokens: DesignTokens;

  switch (design.themeMode) {
    case "preset": {
      const preset = design.presetId ? getPresetDesign(design.presetId) : undefined;
      baseTokens = preset
        ? {
            background: preset.background,
            foreground: preset.foreground,
            muted: preset.muted,
            primary: preset.primary,
            primaryForeground: preset.primaryForeground,
            surface: preset.surface,
            border: preset.border,
            success: preset.success,
            fontFamily: preset.fontFamily,
            headingFontFamily: preset.headingFontFamily,
            borderRadius: preset.borderRadius,
            popupBorderRadius: preset.popupBorderRadius,
          }
        : DEFAULT_DESIGN_TOKENS;
      break;
    }

    case "default":
    case "shopify": {
      // Both "default" and "shopify" use the store's default theme preset
      baseTokens = defaultTokens
        ? { ...DEFAULT_DESIGN_TOKENS, ...defaultTokens }
        : DEFAULT_DESIGN_TOKENS;
      break;
    }

    case "custom":
    default: {
      baseTokens = DEFAULT_DESIGN_TOKENS;
      break;
    }
  }

  // Merge any custom token overrides
  if (design.tokens) {
    return { ...baseTokens, ...design.tokens };
  }

  return baseTokens;
}

/**
 * Convert design tokens to CSS custom property declarations.
 * Use this to generate inline styles or CSS for popup containers.
 */
export function tokensToCSSString(tokens: DesignTokens): string {
  const vars: string[] = [
    `--rb-background: ${tokens.background}`,
    `--rb-foreground: ${tokens.foreground}`,
    `--rb-muted: ${tokens.muted || "rgba(0, 0, 0, 0.6)"}`,
    `--rb-primary: ${tokens.primary}`,
    `--rb-primary-foreground: ${tokens.primaryForeground}`,
    `--rb-surface: ${tokens.surface || tokens.background}`,
    `--rb-border: ${tokens.border || "rgba(0, 0, 0, 0.1)"}`,
    `--rb-success: ${tokens.success}`,
    `--rb-font-family: ${tokens.fontFamily}`,
    `--rb-heading-font-family: ${tokens.headingFontFamily || tokens.fontFamily}`,
    `--rb-radius: ${tokens.borderRadius}px`,
    `--rb-popup-radius: ${tokens.popupBorderRadius}px`,
  ];

  return vars.join("; ");
}

