/**
 * Design Tokens Runtime
 *
 * Runtime-only code for design tokens - NO Zod dependency.
 * This file is safe to import in storefront bundles.
 *
 * For Zod schemas (admin validation), import from design-tokens.ts instead.
 */

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
export type ThemeMode = "default" | "shopify" | "preset" | "custom";

// =============================================================================
// DESIGN TOKENS (14 Semantic Tokens)
// =============================================================================

/**
 * Complete design tokens - 14 semantic values that control all popup styling.
 * These map directly to CSS custom properties (--rb-*).
 */
export interface DesignTokens {
  // === TIER 1: Essential Colors (Simple Mode - 5 tokens) ===
  /** Primary background color */
  background: string;
  /** Primary text color */
  foreground: string;
  /** Primary action color (buttons, links, accents) */
  primary: string;
  /** Muted/secondary text color (descriptions, placeholders) */
  muted?: string;
  /** Border radius for buttons and inputs (in pixels) */
  borderRadius: number;

  // === TIER 2: Common Colors (Standard Mode - +5 tokens) ===
  /** Text color on primary background (button text) */
  primaryForeground: string;
  /** Surface/card/input background color */
  surface?: string;
  /** Border color for inputs, dividers */
  border?: string;
  /** Modal backdrop overlay (rgba color string) */
  overlay?: string;
  /** Body text font family */
  fontFamily: string;

  // === TIER 3: Advanced (Power User - +4 tokens) ===
  /** Success state color (confirmations, checkmarks) */
  success?: string;
  /** Error state color (validation errors, alerts) */
  error?: string;
  /** Focus ring color (accessibility) */
  ring?: string;
  /** Heading font family (optional, defaults to fontFamily) */
  headingFontFamily?: string;

  // === STRUCTURAL (always available) ===
  /** Border radius for the popup container (in pixels) */
  popupBorderRadius: number;
}

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
 */
export interface PresetDesign extends DesignTokens {
  /** Preset identifier (e.g., "bold-energy", "black-friday") */
  presetId: string;
  /** Human-readable name */
  presetName: string;
  /** Additional custom CSS for complex designs */
  customCSS?: string;
  /** Background gradient (overrides background color) */
  backgroundGradient?: string;
  /** Background image URL */
  backgroundImage?: string;
  /** Background image overlay opacity */
  backgroundOverlayOpacity?: number;
}

// =============================================================================
// LAYOUT OPTIONS (separate from colors/fonts)
// =============================================================================

export type LayoutPosition = "center" | "top" | "bottom" | "left" | "right";
export type DisplayMode = "popup" | "banner" | "slide-in" | "inline";
export type AnimationType = "fade" | "slide" | "bounce" | "none";
export type LayoutVariant =
  | "centered"
  | "split-left"
  | "split-right"
  | "fullscreen"
  | "banner-top"
  | "banner-bottom"
  | "sidebar-left"
  | "sidebar-right";
export type ImagePosition = "left" | "right" | "top" | "bottom" | "full" | "none";

export interface LayoutOptions {
  position: LayoutPosition;
  displayMode: DisplayMode;
  animation: AnimationType;
  showCloseButton: boolean;
  layout: LayoutVariant;
  imagePosition?: ImagePosition;
}

// =============================================================================
// CAMPAIGN DESIGN CONFIG
// =============================================================================

export type BackgroundImageMode = "none" | "preset" | "file";

/**
 * Campaign design configuration (runtime type).
 */
export interface CampaignDesign {
  themeMode: ThemeMode;
  presetId?: string;
  tokens?: Partial<DesignTokens>;
  layout?: Partial<LayoutOptions>;
  backgroundImageUrl?: string;
  backgroundImageMode?: BackgroundImageMode;
  backgroundImagePresetKey?: string;
  backgroundOverlayOpacity?: number;
}

/**
 * Input type for CampaignDesign (what you pass in - all fields optional)
 */
export type CampaignDesignInput = Partial<CampaignDesign>;

// =============================================================================
// DEFAULT DESIGN TOKENS
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

    case "custom": {
      // Custom mode: use hardcoded defaults (no store defaults)
      baseTokens = DEFAULT_DESIGN_TOKENS;
      break;
    }

    case "default":
    case "shopify":
    default: {
      // "default", "shopify", or undefined/unset: use store's default theme
      // This ensures recipes without explicit theme use store defaults
      baseTokens = defaultTokens
        ? { ...DEFAULT_DESIGN_TOKENS, ...defaultTokens }
        : DEFAULT_DESIGN_TOKENS;
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
