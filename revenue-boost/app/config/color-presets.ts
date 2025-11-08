/**
 * Color Presets Configuration
 *
 * Predefined color schemes for different template types
 */

import type { ColorPreset } from "~/domains/popups/color-customization.types";

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
 */
const TEMPLATE_PRESETS: Record<string, string[]> = {
  NEWSLETTER: ["modern-blue", "elegant-rose", "minimal-light"],
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


