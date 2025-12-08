/**
 * Design Tokens Schema
 *
 * 14-token design system for popup styling with Simple/Standard/Advanced modes.
 * Replaces the legacy 50+ field DesignConfigSchema.
 *
 * Token Tiers:
 * - Simple Mode (5 tokens): background, foreground, primary, muted, radius
 * - Standard Mode (+5 tokens): primaryForeground, surface, border, overlay, fontFamily
 * - Advanced Mode (+4 tokens): success, error, ring, headingFontFamily
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
// DESIGN TOKENS (14 Semantic Tokens)
// =============================================================================

/**
 * Complete design tokens - 14 semantic values that control all popup styling.
 * These map directly to CSS custom properties (--rb-*).
 *
 * Simple Mode (user sees 5):
 * - background, foreground, primary, muted, borderRadius
 *
 * Standard Mode (user sees 10):
 * - + primaryForeground, surface, border, overlay, fontFamily
 *
 * Advanced Mode (user sees 14):
 * - + success, error, ring, headingFontFamily
 */
export const DesignTokensSchema = z.object({
  // === TIER 1: Essential Colors (Simple Mode - 5 tokens) ===
  /** Primary background color */
  background: z.string().default("#ffffff"),
  /** Primary text color */
  foreground: z.string().default("#1a1a1a"),
  /** Primary action color (buttons, links, accents) */
  primary: z.string().default("#000000"),
  /** Muted/secondary text color (descriptions, placeholders) */
  muted: z.string().optional(),
  /** Border radius for buttons and inputs (in pixels) */
  borderRadius: z.number().min(0).max(50).default(8),

  // === TIER 2: Common Colors (Standard Mode - +5 tokens) ===
  /** Text color on primary background (button text) */
  primaryForeground: z.string().default("#ffffff"),
  /** Surface/card/input background color */
  surface: z.string().optional(),
  /** Border color for inputs, dividers */
  border: z.string().optional(),
  /** Modal backdrop overlay (rgba color string) */
  overlay: z.string().optional(),
  /** Body text font family */
  fontFamily: z.string().default("system-ui, -apple-system, sans-serif"),

  // === TIER 3: Advanced (Power User - +4 tokens) ===
  /** Success state color (confirmations, checkmarks) - defaults to green #10B981 */
  success: z.string().optional(),
  /** Error state color (validation errors, alerts) - defaults to red #EF4444 */
  error: z.string().optional(),
  /** Focus ring color (accessibility) */
  ring: z.string().optional(),
  /** Heading font family (optional, defaults to fontFamily) */
  headingFontFamily: z.string().optional(),

  // === STRUCTURAL (always available) ===
  /** Border radius for the popup container (in pixels) */
  popupBorderRadius: z.number().min(0).max(50).default(16),
});

export type DesignTokens = z.infer<typeof DesignTokensSchema>;

/**
 * Minimal required tokens - everything else can be derived from these 3.
 */
export interface RequiredTokens {
  background: string;
  foreground: string;
  primary: string;
}

// =============================================================================
// PRESET DESIGN (for artistic/seasonal templates)
// =============================================================================

/**
 * Preset design - complete design package for inspiration/seasonal recipes.
 * Includes all 14 tokens plus additional styling that can't be auto-derived.
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
  // Tier 1: Essential
  background: "#ffffff",
  foreground: "#1a1a1a",
  primary: "#000000",
  muted: "rgba(26, 26, 26, 0.6)",
  borderRadius: 8,

  // Tier 2: Common
  primaryForeground: "#ffffff",
  surface: "#f5f5f5",
  border: "rgba(26, 26, 26, 0.2)",
  overlay: "rgba(0, 0, 0, 0.6)",
  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",

  // Tier 3: Advanced
  success: "#10B981",
  error: "#EF4444",
  ring: "rgba(0, 0, 0, 0.1)",
  headingFontFamily: undefined,

  // Structural
  popupBorderRadius: 16,
};

// =============================================================================
// TOKEN DERIVATION UTILITIES
// =============================================================================

/**
 * Check if a color is dark (for contrast calculation)
 */
function isDarkColor(hexColor: string): boolean {
  // Handle rgba/rgb colors
  if (hexColor.startsWith("rgba") || hexColor.startsWith("rgb")) {
    return false; // Assume light for complex colors
  }

  // Remove # if present
  const hex = hexColor.replace("#", "");
  if (hex.length !== 6 && hex.length !== 3) {
    return false;
  }

  // Expand 3-digit hex to 6-digit
  const fullHex =
    hex.length === 3 ? hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2] : hex;

  const r = parseInt(fullHex.substring(0, 2), 16);
  const g = parseInt(fullHex.substring(2, 4), 16);
  const b = parseInt(fullHex.substring(4, 6), 16);

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
}

/**
 * Get contrasting text color (white or black) for a background
 */
function getContrastColor(backgroundColor: string): string {
  return isDarkColor(backgroundColor) ? "#ffffff" : "#000000";
}

/**
 * Derive complete design tokens from minimal required tokens.
 * Only 3 values are truly required - everything else can be auto-derived.
 *
 * @param input Required tokens (background, foreground, primary)
 * @param overrides Optional overrides for any derived token
 */
export function deriveTokens(
  input: RequiredTokens,
  overrides?: Partial<Omit<DesignTokens, keyof RequiredTokens>>
): DesignTokens {
  const { background, foreground, primary } = input;
  const isDark = isDarkColor(background);

  // Derive all tokens from the 3 required ones
  const derived: DesignTokens = {
    // Required (user provides)
    background,
    foreground,
    primary,

    // Tier 1: Derived from foreground
    muted: isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)",
    borderRadius: 8,

    // Tier 2: Derived from primary/background
    primaryForeground: getContrastColor(primary),
    surface: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)",
    border: isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)",
    overlay: "rgba(0, 0, 0, 0.6)",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",

    // Tier 3: Semantic defaults
    success: "#10B981",
    error: "#EF4444",
    ring: isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.1)",
    headingFontFamily: undefined,

    // Structural
    popupBorderRadius: 16,
  };

  // Apply any overrides
  if (overrides) {
    return { ...derived, ...overrides };
  }

  return derived;
}

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
            // Tier 1: Essential
            background: preset.background,
            foreground: preset.foreground,
            primary: preset.primary,
            muted: preset.muted,
            borderRadius: preset.borderRadius,
            // Tier 2: Common
            primaryForeground: preset.primaryForeground,
            surface: preset.surface,
            border: preset.border,
            overlay: preset.overlay,
            fontFamily: preset.fontFamily,
            // Tier 3: Advanced
            success: preset.success,
            error: preset.error || DEFAULT_DESIGN_TOKENS.error,
            ring: preset.ring,
            headingFontFamily: preset.headingFontFamily,
            // Structural
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
    // Tier 1: Essential
    `--rb-background: ${tokens.background}`,
    `--rb-foreground: ${tokens.foreground}`,
    `--rb-primary: ${tokens.primary}`,
    `--rb-muted: ${tokens.muted || "rgba(0, 0, 0, 0.6)"}`,
    `--rb-radius: ${tokens.borderRadius}px`,
    // Tier 2: Common
    `--rb-primary-foreground: ${tokens.primaryForeground}`,
    `--rb-surface: ${tokens.surface || tokens.background}`,
    `--rb-border: ${tokens.border || "rgba(0, 0, 0, 0.1)"}`,
    `--rb-overlay: ${tokens.overlay || "rgba(0, 0, 0, 0.6)"}`,
    `--rb-font-family: ${tokens.fontFamily}`,
    // Tier 3: Advanced
    `--rb-success: ${tokens.success || "#10B981"}`,
    `--rb-error: ${tokens.error || "#EF4444"}`,
    `--rb-ring: ${tokens.ring || "rgba(0, 0, 0, 0.1)"}`,
    `--rb-heading-font-family: ${tokens.headingFontFamily || tokens.fontFamily}`,
    // Structural
    `--rb-popup-radius: ${tokens.popupBorderRadius}px`,
  ];

  return vars.join("; ");
}

