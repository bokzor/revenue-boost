/**
 * Color Presets Configuration
 *
 * Predefined color schemes for different template types
 */

import type {
  ColorPreset,
  ColorTheme,
  ExtendedColorConfig,
} from "~/domains/popups/color-customization.types";
import type { DesignConfig } from "~/domains/campaigns/types/campaign";

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

  // Flash Sale templates use the new flash sale themes
  if (templateType === "FLASH_SALE") {
    return getFlashSaleThemePresets();
  }

  const presetIds = TEMPLATE_PRESETS[templateType] || [];
  const presets = presetIds
    .map((id) => COLOR_PRESETS.find((p) => p.id === id))
    .filter((p): p is ColorPreset => p !== undefined);

  // If no specific presets, return all
  return presets.length > 0 ? presets : COLOR_PRESETS;
}

/**
 * Get popular color presets
 */
export function getPopularColorPresets(): ColorPreset[] {
  return COLOR_PRESETS.filter((p) => p.isPopular);
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
  | "ocean"
  | "summer-sale";

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

  // Typography
  fontFamily?: string;
  titleFontSize?: string;
  titleFontWeight?: string;
  titleTextShadow?: string;
  descriptionFontSize?: string;
  descriptionFontWeight?: string;

  // Input styling
  inputTextColor?: string;
  inputBackdropFilter?: string;
  inputBoxShadow?: string;
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
    // Typography
    fontFamily: "inherit",
    titleFontSize: "1.875rem",
    titleFontWeight: "700",
    descriptionFontSize: "1rem",
    descriptionFontWeight: "400",
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
    // Typography
    fontFamily: "inherit",
    titleFontSize: "1.5rem",
    titleFontWeight: "300",
    descriptionFontSize: "0.875rem",
    descriptionFontWeight: "400",
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
    // Typography
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
    inputTextColor: "#ffffff",
    timerBg: "rgba(255, 255, 255, 0.25)",
    timerText: "#ffffff",
    ctaBg: "#ffffff",
    ctaText: "#ec4899",
    // Typography
    fontFamily: "inherit",
    titleFontSize: "2rem",
    titleFontWeight: "900",
    descriptionFontSize: "1rem",
    descriptionFontWeight: "500",
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
    // Typography
    fontFamily: "inherit",
    titleFontSize: "1.875rem",
    titleFontWeight: "700",
    descriptionFontSize: "1rem",
    descriptionFontWeight: "400",
    // Input styling
    inputBackdropFilter: "blur(10px)",
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
    // Typography
    fontFamily: "inherit",
    titleFontSize: "1.875rem",
    titleFontWeight: "700",
    descriptionFontSize: "1rem",
    descriptionFontWeight: "400",
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
    inputTextColor: "#ffffff",
    timerBg: "rgba(255, 255, 255, 0.2)",
    timerText: "#ffffff",
    ctaBg: "#ffffff",
    ctaText: "#667eea",
    // Typography
    fontFamily: "inherit",
    titleFontSize: "2rem",
    titleFontWeight: "700",
    descriptionFontSize: "1rem",
    descriptionFontWeight: "400",
    // Input styling
    inputBackdropFilter: "blur(10px)",
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
    // Typography
    fontFamily: "serif",
    titleFontSize: "1.875rem",
    titleFontWeight: "700",
    descriptionFontSize: "1rem",
    descriptionFontWeight: "400",
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
    // Typography
    fontFamily: "inherit",
    titleFontSize: "2rem",
    titleFontWeight: "900",
    titleTextShadow: "0 0 20px currentColor, 0 0 40px currentColor",
    descriptionFontSize: "1rem",
    descriptionFontWeight: "400",
    // Input styling
    inputBoxShadow: "0 0 10px rgba(0, 255, 255, 0.1)",
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
    // Typography
    fontFamily: "inherit",
    titleFontSize: "1.875rem",
    titleFontWeight: "700",
    descriptionFontSize: "1rem",
    descriptionFontWeight: "400",
  },
  "summer-sale": {
    background: "#FFFBEB", // Warm light yellow-cream background
    text: "#1E3A5F", // Navy blue for headlines
    primary: "#FF5733", // Vibrant orange
    secondary: "#FEF3C7", // Light cream/yellow
    accent: "#38BDF8", // Bright turquoise accent
    border: "#FBBF24", // Golden yellow border
    success: "#10B981",
    warning: "#EF4444",
    imageBg: "#FEF9C3", // Light yellow image background
    descColor: "#0F766E", // Dark teal for description text
    inputBorder: "#FBBF24", // Golden yellow
    timerBg: "rgba(255, 87, 51, 0.1)", // Orange tint
    timerText: "#FF5733", // Vibrant orange
    ctaBg: "#FF5733", // Vibrant orange button
    ctaText: "#FFFFFF", // White button text
    // Typography
    fontFamily: "inherit",
    titleFontSize: "1.875rem",
    titleFontWeight: "700",
    descriptionFontSize: "1rem",
    descriptionFontWeight: "400",
  },
};

export const NEWSLETTER_BACKGROUND_PRESETS: {
  key: NewsletterThemeKey;
  label: string;
}[] = [
  { key: "modern", label: "Modern theme image" },
  { key: "minimal", label: "Minimal theme image" },
  { key: "elegant", label: "Elegant theme image" },
  { key: "bold", label: "Bold theme image" },
  { key: "glass", label: "Glass theme image" },
  { key: "dark", label: "Dark theme image" },
  { key: "gradient", label: "Gradient theme image" },
  { key: "luxury", label: "Luxury theme image" },
  { key: "neon", label: "Neon theme image" },
  { key: "ocean", label: "Ocean theme image" },
  { key: "summer-sale", label: "Summer Sale theme image" },
];

export function getNewsletterBackgroundUrl(key: NewsletterThemeKey): string {
  return `/apps/revenue-boost/assets/newsletter-backgrounds/${key}.jpg`;
}

export const NEWSLETTER_THEMES_2: Record<NewsletterThemeKey, ThemeColors> = {
  modern: NEWSLETTER_THEMES.modern,
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
    // Typography
    fontFamily: "inherit",
    titleFontSize: "1.5rem",
    titleFontWeight: "300",
    descriptionFontSize: "0.875rem",
    descriptionFontWeight: "400",
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
    // Typography
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
    inputTextColor: "#ffffff",
    timerBg: "rgba(255, 255, 255, 0.25)",
    timerText: "#ffffff",
    ctaBg: "#ffffff",
    ctaText: "#ec4899",
    // Typography
    fontFamily: "inherit",
    titleFontSize: "2rem",
    titleFontWeight: "900",
    descriptionFontSize: "1rem",
    descriptionFontWeight: "500",
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
    // Typography
    fontFamily: "inherit",
    titleFontSize: "1.875rem",
    titleFontWeight: "700",
    descriptionFontSize: "1rem",
    descriptionFontWeight: "400",
    // Input styling
    inputBackdropFilter: "blur(10px)",
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
    // Typography
    fontFamily: "inherit",
    titleFontSize: "1.875rem",
    titleFontWeight: "700",
    descriptionFontSize: "1rem",
    descriptionFontWeight: "400",
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
    inputTextColor: "#ffffff",
    timerBg: "rgba(255, 255, 255, 0.2)",
    timerText: "#ffffff",
    ctaBg: "#ffffff",
    ctaText: "#667eea",
    // Typography
    fontFamily: "inherit",
    titleFontSize: "2rem",
    titleFontWeight: "700",
    descriptionFontSize: "1rem",
    descriptionFontWeight: "400",
    // Input styling
    inputBackdropFilter: "blur(10px)",
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
    // Typography
    fontFamily: "serif",
    titleFontSize: "1.875rem",
    titleFontWeight: "700",
    descriptionFontSize: "1rem",
    descriptionFontWeight: "400",
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
    // Typography
    fontFamily: "inherit",
    titleFontSize: "2rem",
    titleFontWeight: "900",
    titleTextShadow: "0 0 20px currentColor, 0 0 40px currentColor",
    descriptionFontSize: "1rem",
    descriptionFontWeight: "400",
    // Input styling
    inputBoxShadow: "0 0 10px rgba(0, 255, 255, 0.1)",
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
    // Typography
    fontFamily: "inherit",
    titleFontSize: "1.875rem",
    titleFontWeight: "700",
    descriptionFontSize: "1rem",
    descriptionFontWeight: "400",
  },
  "summer-sale": {
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
    // Typography
    fontFamily: "inherit",
    titleFontSize: "1.875rem",
    titleFontWeight: "700",
    descriptionFontSize: "1rem",
    descriptionFontWeight: "400",
  },
};

// ============================================================================
// Spin-to-Win wheel slice colors (admin-side theme mapping)
// ============================================================================

/**
 * Get Spin-to-Win wheel slice colors for a given newsletter theme.
 *
 * This mirrors the mockup's generateSliceColors(theme) so that the admin
 * can preconfigure wheelSegments[i].color based on the selected theme.
 * The storefront wheel remains purely presentational and only reads colors.
 */
export function getSpinToWinSliceColors(theme: NewsletterThemeKey, sliceCount: number): string[] {
  const themeMap: Record<NewsletterThemeKey, string[]> = {
    modern: ["#3b82f6", "#2563eb", "#1d4ed8", "#1e40af", "#1e3a8a", "#60a5fa"],
    minimal: ["#6b7280", "#4b5563", "#374151", "#1f2937", "#9ca3af", "#d1d5db"],
    elegant: ["#be185d", "#9f1239", "#831843", "#701a40", "#ec4899", "#f9a8d4"],
    bold: ["#dc2626", "#ea580c", "#d97706", "#ca8a04", "#eab308", "#84cc16"],
    glass: [
      "rgba(59, 130, 246, 0.5)",
      "rgba(99, 102, 241, 0.5)",
      "rgba(139, 92, 246, 0.5)",
      "rgba(168, 85, 247, 0.5)",
      "rgba(236, 72, 153, 0.5)",
      "rgba(244, 114, 182, 0.5)",
    ],
    dark: ["#3b82f6", "#8b5cf6", "#ec4899", "#ef4444", "#f59e0b", "#10b981"],
    gradient: ["#a855f7", "#9333ea", "#7e22ce", "#6b21a8", "#581c87", "#c084fc"],
    luxury: ["#d97706", "#b45309", "#92400e", "#78350f", "#ca8a04", "#f59e0b"],
    neon: ["#06b6d4", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#6366f1"],
    ocean: ["#06b6d4", "#0891b2", "#0e7490", "#155e75", "#22d3ee", "#67e8f9"],
    "summer-sale": ["#FF5733", "#FF7849", "#FBBF24", "#38BDF8", "#0EA5E9", "#F97316"],
  };

  const base = themeMap[theme] || themeMap.modern;
  if (sliceCount <= base.length) {
    return base.slice(0, sliceCount);
  }

  // Repeat colors if there are more slices than base colors
  const result: string[] = [];
  for (let i = 0; i < sliceCount; i++) {
    result.push(base[i % base.length]);
  }
  return result;
}

// Spin-to-Win wheel border defaults (admin-side theme mapping)
// Mirrors docs/mockup/lib/popup-themes.ts wheelBorderDefaults
export interface SpinToWinWheelBorder {
  color: string;
  width: number;
}

const SPIN_TO_WIN_WHEEL_BORDER_DEFAULTS: Record<NewsletterThemeKey, SpinToWinWheelBorder> = {
  modern: { color: "#3b82f6", width: 3 },
  minimal: { color: "#d4d4d8", width: 2 },
  elegant: { color: "#a855f7", width: 3 },
  bold: { color: "#ffffff", width: 4 },
  glass: { color: "rgba(99, 102, 241, 0.4)", width: 2 },
  dark: { color: "#3b82f6", width: 3 },
  gradient: { color: "#ffffff", width: 3 },
  luxury: { color: "#d4af37", width: 3 },
  neon: { color: "#00ffff", width: 3 },
  ocean: { color: "#0ea5e9", width: 3 },
  "summer-sale": { color: "#FF5733", width: 3 },
};

export function getSpinToWinWheelBorder(theme: NewsletterThemeKey): SpinToWinWheelBorder {
  return SPIN_TO_WIN_WHEEL_BORDER_DEFAULTS[theme] ?? SPIN_TO_WIN_WHEEL_BORDER_DEFAULTS.modern;
}

// ============================================
// Flash Sale Themes
// ============================================

export type FlashSaleThemeKey =
  | "urgent_red"
  | "hot_deal"
  | "midnight_sale"
  | "neon_flash"
  | "elegant_sale"
  | "minimal_clean"
  | "gradient_pop"
  | "luxury_offer";

export const FLASH_SALE_THEMES: Record<FlashSaleThemeKey, ThemeColors> = {
  urgent_red: {
    background: "#ffffff",
    text: "#1f2937",
    primary: "#ef4444",
    secondary: "#fee2e2",
    accent: "#dc2626",
    border: "#fca5a5",
    success: "#10b981",
    warning: "#ef4444",
    imageBg: "#fef2f2",
    descColor: "#6b7280",
    inputBorder: "#fca5a5",
    timerBg: "rgba(239, 68, 68, 0.15)",
    timerText: "#dc2626",
    ctaBg: "#ef4444",
    ctaText: "#ffffff",
    fontFamily: "inherit",
    titleFontSize: "2rem",
    titleFontWeight: "800",
    descriptionFontSize: "1rem",
    descriptionFontWeight: "500",
  },
  hot_deal: {
    background: "#fffbeb",
    text: "#1f2937",
    primary: "#f97316",
    secondary: "#ffedd5",
    accent: "#ea580c",
    border: "#fdba74",
    success: "#10b981",
    warning: "#dc2626",
    imageBg: "#fff7ed",
    descColor: "#78716c",
    inputBorder: "#fdba74",
    timerBg: "rgba(249, 115, 22, 0.15)",
    timerText: "#ea580c",
    ctaBg: "#f97316",
    ctaText: "#ffffff",
    fontFamily: "inherit",
    titleFontSize: "2rem",
    titleFontWeight: "800",
    descriptionFontSize: "1rem",
    descriptionFontWeight: "500",
  },
  midnight_sale: {
    background: "#0f172a",
    text: "#f1f5f9",
    primary: "#38bdf8",
    secondary: "rgba(255, 255, 255, 0.08)",
    accent: "#0ea5e9",
    border: "rgba(56, 189, 248, 0.3)",
    success: "#10b981",
    warning: "#ef4444",
    imageBg: "#1e293b",
    descColor: "#cbd5e1",
    inputBorder: "rgba(56, 189, 248, 0.3)",
    timerBg: "rgba(56, 189, 248, 0.12)",
    timerText: "#38bdf8",
    ctaBg: "#38bdf8",
    ctaText: "#0f172a",
    fontFamily: "inherit",
    titleFontSize: "2rem",
    titleFontWeight: "700",
    descriptionFontSize: "1rem",
    descriptionFontWeight: "400",
    inputBackdropFilter: "blur(8px)",
  },
  neon_flash: {
    background: "#1a1a2e",
    text: "#ffffff",
    primary: "#fde047",
    secondary: "rgba(253, 224, 71, 0.1)",
    accent: "#facc15",
    border: "rgba(253, 224, 71, 0.4)",
    success: "#22c55e",
    warning: "#ef4444",
    imageBg: "#16213e",
    descColor: "#e2e8f0",
    inputBorder: "rgba(253, 224, 71, 0.4)",
    timerBg: "rgba(253, 224, 71, 0.15)",
    timerText: "#fde047",
    ctaBg: "#fde047",
    ctaText: "#1a1a2e",
    fontFamily: "inherit",
    titleFontSize: "2rem",
    titleFontWeight: "800",
    titleTextShadow: "0 0 20px rgba(253, 224, 71, 0.5)",
    descriptionFontSize: "1rem",
    descriptionFontWeight: "500",
    inputBackdropFilter: "blur(8px)",
    inputBoxShadow: "0 0 15px rgba(253, 224, 71, 0.2)",
  },
  elegant_sale: {
    background: "#fffbf5",
    text: "#1f2937",
    primary: "#d97706",
    secondary: "#fef3c7",
    accent: "#b45309",
    border: "#fcd34d",
    success: "#059669",
    warning: "#dc2626",
    imageBg: "#fef9c3",
    descColor: "#78716c",
    inputBorder: "#fcd34d",
    timerBg: "rgba(217, 119, 6, 0.1)",
    timerText: "#b45309",
    ctaBg: "#d97706",
    ctaText: "#ffffff",
    fontFamily: "inherit",
    titleFontSize: "1.875rem",
    titleFontWeight: "700",
    descriptionFontSize: "1rem",
    descriptionFontWeight: "400",
  },
  minimal_clean: {
    background: "#ffffff",
    text: "#111827",
    primary: "#3b82f6",
    secondary: "#f9fafb",
    accent: "#2563eb",
    border: "#e5e7eb",
    success: "#10b981",
    warning: "#ef4444",
    imageBg: "#f3f4f6",
    descColor: "#6b7280",
    inputBorder: "#d1d5db",
    timerBg: "rgba(59, 130, 246, 0.08)",
    timerText: "#2563eb",
    ctaBg: "#3b82f6",
    ctaText: "#ffffff",
    fontFamily: "inherit",
    titleFontSize: "1.875rem",
    titleFontWeight: "600",
    descriptionFontSize: "1rem",
    descriptionFontWeight: "400",
  },
  gradient_pop: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    text: "#ffffff",
    primary: "#fbbf24",
    secondary: "rgba(255, 255, 255, 0.15)",
    accent: "#f59e0b",
    border: "rgba(255, 255, 255, 0.3)",
    success: "#34d399",
    warning: "#f87171",
    imageBg: "rgba(255, 255, 255, 0.1)",
    descColor: "#f3f4f6",
    inputBorder: "rgba(255, 255, 255, 0.3)",
    timerBg: "rgba(251, 191, 36, 0.15)",
    timerText: "#fbbf24",
    ctaBg: "#fbbf24",
    ctaText: "#1f2937",
    fontFamily: "inherit",
    titleFontSize: "2rem",
    titleFontWeight: "700",
    descriptionFontSize: "1rem",
    descriptionFontWeight: "400",
    inputBackdropFilter: "blur(10px)",
    inputBoxShadow: "0 0 20px rgba(251, 191, 36, 0.15)",
  },
  luxury_offer: {
    background: "#18181b",
    text: "#fbbf24",
    primary: "#fbbf24",
    secondary: "rgba(251, 191, 36, 0.1)",
    accent: "#f59e0b",
    border: "rgba(251, 191, 36, 0.3)",
    success: "#10b981",
    warning: "#ef4444",
    imageBg: "#27272a",
    descColor: "#e5e5e5",
    inputBorder: "rgba(251, 191, 36, 0.3)",
    timerBg: "rgba(251, 191, 36, 0.12)",
    timerText: "#fbbf24",
    ctaBg: "#fbbf24",
    ctaText: "#18181b",
    fontFamily: "inherit",
    titleFontSize: "2rem",
    titleFontWeight: "700",
    descriptionFontSize: "1rem",
    descriptionFontWeight: "400",
    inputBackdropFilter: "blur(8px)",
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
  if (secondary.includes("rgba") && secondary.includes("255, 255, 255")) {
    return "#111827"; // Dark text on light transparent backgrounds
  }

  // For dark backgrounds (hex color with low brightness), use theme text color
  if (secondary.startsWith("#")) {
    const brightness = parseInt(secondary.slice(1, 3), 16);
    if (brightness < 128) {
      return themeText; // Use theme text color for dark backgrounds
    }
  }

  // For light backgrounds, use dark text
  return "#111827";
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
export function themeColorsToDesignConfig(
  themeColors: ThemeColors
): ExtendedColorConfig &
  Partial<
    Pick<
      DesignConfig,
      | "descriptionColor"
      | "imageBgColor"
      | "fontFamily"
      | "titleFontSize"
      | "titleFontWeight"
      | "titleTextShadow"
      | "descriptionFontSize"
      | "descriptionFontWeight"
      | "inputBackdropFilter"
      | "inputBoxShadow"
    >
  > {
  return {
    // Main colors
    backgroundColor: themeColors.background,
    textColor: themeColors.text,
    accentColor: themeColors.primary,
    buttonColor: themeColors.ctaBg || themeColors.primary,
    buttonTextColor: themeColors.ctaText || "#FFFFFF",

    // Input field colors
    inputBackgroundColor: themeColors.secondary,
    inputTextColor:
      themeColors.inputTextColor || getInputTextColor(themeColors.secondary, themeColors.text),
    inputBorderColor: themeColors.inputBorder || themeColors.border,

    // State colors
    successColor: themeColors.success,

    // Overlay
    overlayOpacity: 0.5,

    // Additional DesignConfig fields
    descriptionColor: themeColors.descColor,
    imageBgColor: themeColors.imageBg,
    fontFamily: themeColors.fontFamily,
    titleFontSize: themeColors.titleFontSize,
    titleFontWeight: themeColors.titleFontWeight,
    titleTextShadow: themeColors.titleTextShadow,
    descriptionFontSize: themeColors.descriptionFontSize,
    descriptionFontWeight: themeColors.descriptionFontWeight,
    inputBackdropFilter: themeColors.inputBackdropFilter,
    inputBoxShadow: themeColors.inputBoxShadow,
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
    "summer-sale": "vibrant",
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
    "summer-sale": "Sunny orange & turquoise",
  };
  return descriptions[theme] || "";
}

// ============================================
// Flash Sale Theme Helpers
// ============================================

/**
 * Get flash sale themes as ColorPreset format for ColorCustomizationPanel
 */
export function getFlashSaleThemePresets(): ColorPreset[] {
  return Object.entries(FLASH_SALE_THEMES).map(([key, theme]) => ({
    id: `flash-sale-${key}`,
    name: key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" "),
    description: getFlashSaleThemeDescription(key as FlashSaleThemeKey),
    colors: themeColorsToDesignConfig(theme),
    theme: getColorThemeForFlashSaleTheme(key as FlashSaleThemeKey),
    isPopular: ["urgent_red", "hot_deal", "midnight_sale", "neon_flash"].includes(key),
  }));
}

/**
 * Map flash sale theme to ColorTheme
 */
function getColorThemeForFlashSaleTheme(theme: FlashSaleThemeKey): ColorTheme {
  const mapping: Record<FlashSaleThemeKey, ColorTheme> = {
    urgent_red: "vibrant",
    hot_deal: "vibrant",
    midnight_sale: "dark",
    neon_flash: "playful",
    elegant_sale: "elegant",
    minimal_clean: "minimal",
    gradient_pop: "vibrant",
    luxury_offer: "elegant",
  };
  return mapping[theme];
}

/**
 * Get description for flash sale theme
 */
function getFlashSaleThemeDescription(theme: FlashSaleThemeKey): string {
  const descriptions: Record<FlashSaleThemeKey, string> = {
    urgent_red: "Bold red urgency theme",
    hot_deal: "Warm orange/yellow energy",
    midnight_sale: "Dark mode with bright cyan",
    neon_flash: "Cyberpunk yellow glow",
    elegant_sale: "Sophisticated amber tones",
    minimal_clean: "Clean white with blue accents",
    gradient_pop: "Purple gradient with gold CTA",
    luxury_offer: "Premium gold on black",
  };
  return descriptions[theme] || "";
}

/**
 * Get theme colors for a specific flash sale theme
 */
export function getFlashSaleThemeColors(
  theme: FlashSaleThemeKey,
  customColors?: Partial<ThemeColors>
): ThemeColors {
  const baseTheme = FLASH_SALE_THEMES[theme];

  if (!customColors) {
    return baseTheme;
  }

  return {
    ...baseTheme,
    ...customColors,
  };
}
