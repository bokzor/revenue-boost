/**
 * Color Presets Configuration
 *
 * Predefined color schemes for different template types
 */

import type { ColorPreset, ColorTheme } from "~/domains/popups/color-customization.types";

/**
 * Default color presets
 */
export const COLOR_PRESETS: ColorPreset[] = [
  {
    id: "modern-blue",
    name: "Modern Blue",
    description: "Clean and professional blue theme",
    theme: "professional",
    colors: {
      backgroundColor: "#FFFFFF",
      textColor: "#1A202C",
      buttonColor: "#3B82F6",
      buttonTextColor: "#FFFFFF",
      accentColor: "#60A5FA",
      overlayOpacity: 0.6,
    },
    isPopular: true,
  },
  {
    id: "vibrant-purple",
    name: "Vibrant Purple",
    description: "Eye-catching purple gradient",
    theme: "vibrant",
    colors: {
      backgroundColor: "#FFFFFF",
      textColor: "#1F2937",
      buttonColor: "#8B5CF6",
      buttonTextColor: "#FFFFFF",
      accentColor: "#A78BFA",
      overlayOpacity: 0.7,
    },
    isPopular: true,
  },
  {
    id: "elegant-dark",
    name: "Elegant Dark",
    description: "Sophisticated dark theme",
    theme: "dark",
    colors: {
      backgroundColor: "#1F2937",
      textColor: "#F9FAFB",
      buttonColor: "#10B981",
      buttonTextColor: "#FFFFFF",
      accentColor: "#34D399",
      overlayOpacity: 0.8,
    },
    isPopular: true,
  },
  {
    id: "minimal-light",
    name: "Minimal Light",
    description: "Clean and minimal light theme",
    theme: "minimal",
    colors: {
      backgroundColor: "#F9FAFB",
      textColor: "#111827",
      buttonColor: "#111827",
      buttonTextColor: "#FFFFFF",
      accentColor: "#6B7280",
      overlayOpacity: 0.5,
    },
  },
  {
    id: "playful-orange",
    name: "Playful Orange",
    description: "Fun and energetic orange theme",
    theme: "playful",
    colors: {
      backgroundColor: "#FFFFFF",
      textColor: "#1F2937",
      buttonColor: "#F59E0B",
      buttonTextColor: "#FFFFFF",
      accentColor: "#FBBF24",
      overlayOpacity: 0.6,
    },
  },
  {
    id: "elegant-rose",
    name: "Elegant Rose",
    description: "Sophisticated rose gold theme",
    theme: "elegant",
    colors: {
      backgroundColor: "#FFF1F2",
      textColor: "#881337",
      buttonColor: "#E11D48",
      buttonTextColor: "#FFFFFF",
      accentColor: "#FB7185",
      overlayOpacity: 0.6,
    },
  },
];

/**
 * Template-specific color presets
 * Note: NEWSLETTER uses the new newsletter themes defined below
 */
const TEMPLATE_PRESETS: Record<string, string[]> = {
  NEWSLETTER: [], // Newsletter uses NEWSLETTER_THEMES instead
  SPIN_TO_WIN: ["vibrant-purple", "playful-orange"],
  FLASH_SALE: ["vibrant-purple", "playful-orange", "elegant-dark"],
  EXIT_INTENT: ["modern-blue", "elegant-dark"],
  CART_ABANDONMENT: ["playful-orange", "vibrant-purple"],
  PRODUCT_UPSELL: ["modern-blue", "elegant-rose"],
  SOCIAL_PROOF: ["minimal-light", "modern-blue"],
  COUNTDOWN_TIMER: ["playful-orange", "vibrant-purple"],
  SCRATCH_CARD: ["playful-orange", "vibrant-purple"],
  ANNOUNCEMENT: ["modern-blue", "minimal-light"],
};

/**
 * Get color presets for a specific template type
 */
export function getColorPresetsForTemplate(templateType?: string): ColorPreset[] {
  if (!templateType) {
    return COLOR_PRESETS;
  }

  // Newsletter templates use the new newsletter themes
  if (templateType === "NEWSLETTER") {
    return getNewsletterThemePresets();
  }

  const presetIds = TEMPLATE_PRESETS[templateType] || [];
  const presets = presetIds
    .map(id => COLOR_PRESETS.find(p => p.id === id))
    .filter((p): p is ColorPreset => p !== undefined);

  // If no specific presets, return all
  return presets.length > 0 ? presets : COLOR_PRESETS;
}

/**
 * Get popular color presets
 */
export function getPopularColorPresets(): ColorPreset[] {
  return COLOR_PRESETS.filter(p => p.isPopular);
}

// ============================================================================
// NEWSLETTER-SPECIFIC THEMES
// ============================================================================

/**
 * Newsletter theme keys
 */
export type NewsletterThemeKey =
  | "modern"
  | "minimal"
  | "elegant"
  | "bold"
  | "glass"
  | "dark"
  | "gradient"
  | "luxury"
  | "neon"
  | "ocean";

/**
 * Theme color configuration from mockup
 */
export interface ThemeColors {
  background: string;
  text: string;
  primary: string;
  secondary: string;
  accent: string;
  border: string;
  success: string;
  warning: string;
  imageBg?: string;
  descColor?: string;
  inputBorder?: string;
  timerBg?: string;
  timerText?: string;
  ctaBg?: string;
  ctaText?: string;
  blur?: boolean;
}

/**
 * Newsletter theme presets based on mockup design
 * Source: docs/mockup/popup-themes.ts
 */
export const NEWSLETTER_THEMES: Record<NewsletterThemeKey, ThemeColors> = {
  modern: {
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
  },
  minimal: {
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
  },
  elegant: {
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
    inputBorder: "#e7e5e4",
    timerBg: "rgba(168, 85, 247, 0.1)",
    timerText: "#a855f7",
    ctaBg: "#a855f7",
    ctaText: "#ffffff",
  },
  bold: {
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
    timerBg: "rgba(255, 255, 255, 0.25)",
    timerText: "#ffffff",
    ctaBg: "#ffffff",
    ctaText: "#ec4899",
  },
  glass: {
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
  },
  dark: {
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
  },
  gradient: {
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
    timerBg: "rgba(255, 255, 255, 0.2)",
    timerText: "#ffffff",
    ctaBg: "#ffffff",
    ctaText: "#667eea",
  },
  luxury: {
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
  },
  neon: {
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
  },
  ocean: {
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
  },
};

/**
 * Get theme colors for a specific newsletter theme
 */
export function getNewsletterThemeColors(
  theme: NewsletterThemeKey,
  customColors?: Partial<ThemeColors>
): ThemeColors {
  const baseTheme = NEWSLETTER_THEMES[theme];

  if (!customColors) {
    return baseTheme;
  }

  return {
    ...baseTheme,
    ...customColors,
  };
}

/**
 * Determine input text color based on input background for better contrast
 * Follows WCAG contrast guidelines
 */
function getInputTextColor(secondary: string, themeText: string): string {
  // If secondary is transparent white rgba, use dark text for contrast
  if (secondary.includes('rgba') && secondary.includes('255, 255, 255')) {
    return '#111827'; // Dark text on light transparent backgrounds
  }

  // For dark backgrounds (hex color with low brightness), use theme text color
  if (secondary.startsWith('#')) {
    const brightness = parseInt(secondary.slice(1, 3), 16);
    if (brightness < 128) {
      return themeText; // Use theme text color for dark backgrounds
    }
  }

  // For light backgrounds, use dark text
  return '#111827';
}

/**
 * Convert theme colors to PopupDesignConfig format
 * Maps mockup theme colors to design config fields
 *
 * Mapping:
 * - background → backgroundColor
 * - text → textColor (for headings)
 * - descColor → descriptionColor (for description/subheadline)
 * - primary → accentColor (for highlights)
 * - ctaBg → buttonColor
 * - ctaText → buttonTextColor
 * - secondary → inputBackgroundColor
 * - (computed) → inputTextColor (auto-detected for contrast)
 * - inputBorder → inputBorderColor
 * - imageBg → imageBgColor
 * - success → successColor
 */
export function themeColorsToDesignConfig(themeColors: ThemeColors): any {
  return {
    // Main colors
    backgroundColor: themeColors.background,
    textColor: themeColors.text,
    descriptionColor: themeColors.descColor,
    accentColor: themeColors.primary,

    // Button colors
    buttonColor: themeColors.ctaBg || themeColors.primary,
    buttonTextColor: themeColors.ctaText || "#FFFFFF",

    // Input field colors
    inputBackgroundColor: themeColors.secondary,
    inputTextColor: getInputTextColor(themeColors.secondary, themeColors.text),
    inputBorderColor: themeColors.inputBorder || themeColors.border,

    // Image colors
    imageBgColor: themeColors.imageBg,

    // State colors
    successColor: themeColors.success,
  };
}

/**
 * Get newsletter themes as ColorPreset format for ColorCustomizationPanel
 */
export function getNewsletterThemePresets(): ColorPreset[] {
  return Object.entries(NEWSLETTER_THEMES).map(([key, theme]) => ({
    id: `newsletter-${key}`,
    name: key.charAt(0).toUpperCase() + key.slice(1),
    description: getNewsletterThemeDescription(key as NewsletterThemeKey),
    colors: themeColorsToDesignConfig(theme),
    theme: getColorThemeForNewsletterTheme(key as NewsletterThemeKey),
    isPopular: ["modern", "minimal", "elegant", "glass"].includes(key),
  }));
}

/**
 * Map newsletter theme to ColorTheme
 */
function getColorThemeForNewsletterTheme(theme: NewsletterThemeKey): ColorTheme {
  const mapping: Record<NewsletterThemeKey, ColorTheme> = {
    modern: "professional",
    minimal: "minimal",
    elegant: "elegant",
    bold: "vibrant",
    glass: "minimal",
    dark: "dark",
    gradient: "vibrant",
    luxury: "elegant",
    neon: "playful",
    ocean: "professional",
  };
  return mapping[theme];
}

/**
 * Get description for newsletter theme
 */
function getNewsletterThemeDescription(theme: NewsletterThemeKey): string {
  const descriptions: Record<NewsletterThemeKey, string> = {
    modern: "Clean black & white",
    minimal: "Ultra-light, subtle accents",
    elegant: "Warm yellow tones",
    bold: "Vibrant gradient",
    glass: "Glassmorphism with blur",
    dark: "Dark mode optimized",
    gradient: "Purple gradient background",
    luxury: "Gold on black, premium feel",
    neon: "Cyberpunk glow effects",
    ocean: "Fresh blue/teal palette",
  };
  return descriptions[theme] || "";
}


