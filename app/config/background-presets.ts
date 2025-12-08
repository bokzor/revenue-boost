/**
 * Background Presets Configuration
 *
 * Defines available background images and their theme affinity.
 * Used by styled recipes to auto-select matching backgrounds.
 *
 * @see docs/RECIPE_SYSTEM_ARCHITECTURE.md
 * @see docs/BACKGROUND_IMAGES.md
 */

import type { NewsletterThemeKey } from "./color-presets";

// =============================================================================
// TYPES
// =============================================================================

export type BackgroundCategory =
  | "theme" // Matches a specific theme (modern, bold, etc.)
  | "seasonal" // Seasonal backgrounds (holiday, summer, etc.)
  | "abstract" // Generic abstract patterns
  | "minimal" // Clean, minimal backgrounds
  | "custom"; // User-uploaded

export type TemplateTypeForBackground =
  | "NEWSLETTER"
  | "FLASH_SALE"
  | "SPIN_TO_WIN"
  | "SCRATCH_CARD"
  | "ANNOUNCEMENT"
  | "ALL";

export interface BackgroundPreset {
  /** Unique identifier */
  id: string;

  /** Filename in public/newsletter-backgrounds/ */
  filename: string;

  /** Display name */
  name: string;

  /** Short description */
  description: string;

  /** Themes this background works well with */
  suggestedForThemes: NewsletterThemeKey[];

  /** Primary theme (if this is the "default" background for a theme) */
  primaryTheme?: NewsletterThemeKey;

  /** Is this a seasonal background */
  seasonal?: boolean;

  /** Category for organization in picker */
  category: BackgroundCategory;

  /** Which template types this works for */
  templateTypes: TemplateTypeForBackground[];

  /** Is this featured/popular */
  featured?: boolean;
}

// =============================================================================
// BACKGROUND PRESETS
// =============================================================================

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  // ============================================
  // THEME-MATCHED BACKGROUNDS
  // ============================================
  {
    id: "bg-modern",
    filename: "modern.jpg",
    name: "Modern",
    description: "Clean blue gradient",
    suggestedForThemes: ["modern"],
    primaryTheme: "modern",
    category: "theme",
    templateTypes: ["ALL"],
    featured: true,
  },
  {
    id: "bg-minimal",
    filename: "minimal.jpg",
    name: "Minimal",
    description: "Ultra-light, subtle",
    suggestedForThemes: ["minimal"],
    primaryTheme: "minimal",
    category: "theme",
    templateTypes: ["ALL"],
  },
  {
    id: "bg-dark",
    filename: "dark.jpg",
    name: "Dark",
    description: "Dark mode optimized",
    suggestedForThemes: ["dark", "black-friday", "cyber-monday"],
    primaryTheme: "dark",
    category: "theme",
    templateTypes: ["ALL"],
    featured: true,
  },
  {
    id: "bg-gradient",
    filename: "gradient.jpg",
    name: "Gradient",
    description: "Purple gradient background",
    suggestedForThemes: ["gradient"],
    primaryTheme: "gradient",
    category: "theme",
    templateTypes: ["ALL"],
  },
  {
    id: "bg-luxury",
    filename: "luxury.jpg",
    name: "Luxury",
    description: "Gold on dark, premium",
    suggestedForThemes: ["luxury"],
    primaryTheme: "luxury",
    category: "theme",
    templateTypes: ["ALL"],
  },
  {
    id: "bg-neon",
    filename: "neon.jpg",
    name: "Neon",
    description: "Cyberpunk glow effects",
    suggestedForThemes: ["neon", "cyber-monday"],
    primaryTheme: "neon",
    category: "theme",
    templateTypes: ["ALL"],
  },
  {
    id: "bg-ocean",
    filename: "ocean.jpg",
    name: "Ocean",
    description: "Fresh blue/teal palette",
    suggestedForThemes: ["ocean", "modern"],
    primaryTheme: "ocean",
    category: "theme",
    templateTypes: ["ALL"],
  },

  // ============================================
  // SEASONAL BACKGROUNDS
  // ============================================
  {
    id: "bg-summer",
    filename: "summer.jpg",
    name: "Summer",
    description: "Warm sunny vibes",
    suggestedForThemes: ["summer"],
    primaryTheme: "summer",
    seasonal: true,
    category: "seasonal",
    templateTypes: ["ALL"],
    featured: true,
  },
  {
    id: "bg-black-friday",
    filename: "lucid-origin_A_vibrant_landscape_rectangular_abstract_background_with_sharp_corners_for_a_Bla-2.jpg",
    name: "Black Friday",
    description: "Bold black with gold accents",
    suggestedForThemes: ["black-friday", "dark", "luxury"],
    primaryTheme: "black-friday",
    seasonal: true,
    category: "seasonal",
    templateTypes: ["ALL"],
    featured: true,
  },
  {
    id: "bg-cyber-monday",
    filename: "lucid-origin_A_vibrant_landscape_rectangular_abstract_background_with_sharp_corners_for_a_Bac-3.jpg",
    name: "Cyber Monday",
    description: "Neon tech aesthetic",
    suggestedForThemes: ["cyber-monday", "neon"],
    primaryTheme: "cyber-monday",
    seasonal: true,
    category: "seasonal",
    templateTypes: ["ALL"],
  },
  {
    id: "bg-holiday",
    filename: "christmas.jpg",
    name: "Holiday / Christmas",
    description: "Festive red and green",
    suggestedForThemes: ["holiday"],
    primaryTheme: "holiday",
    seasonal: true,
    category: "seasonal",
    templateTypes: ["ALL"],
    featured: true,
  },
  {
    id: "bg-valentine",
    filename: "lucid-origin_A_vibrant_landscape_rectangular_abstract_background_with_sharp_corners_for_a_Val-2.jpg",
    name: "Valentine's Day",
    description: "Romantic pink and red",
    suggestedForThemes: ["valentine"],
    primaryTheme: "valentine",
    seasonal: true,
    category: "seasonal",
    templateTypes: ["ALL"],
  },
  {
    id: "bg-easter",
    filename: "lucid-origin_A_vibrant_landscape_rectangular_abstract_background_with_sharp_corners_for_an_Ea-2.jpg",
    name: "Easter / Spring",
    description: "Fresh pastels and spring colors",
    suggestedForThemes: ["spring"],
    primaryTheme: "spring",
    seasonal: true,
    category: "seasonal",
    templateTypes: ["ALL"],
  },
  {
    id: "bg-halloween",
    filename: "lucid-origin_A_vibrant_landscape_rectangular_abstract_background_with_sharp_corners_for_a_Hal-0.jpg",
    name: "Halloween",
    description: "Spooky orange and black",
    suggestedForThemes: ["dark", "neon"],
    seasonal: true,
    category: "seasonal",
    templateTypes: ["ALL"],
  },
  {
    id: "bg-thanksgiving",
    filename: "lucid-origin_A_vibrant_landscape_rectangular_abstract_background_with_sharp_corners_for_a_Tha-3.jpg",
    name: "Thanksgiving",
    description: "Warm autumn tones",
    suggestedForThemes: ["luxury"],
    seasonal: true,
    category: "seasonal",
    templateTypes: ["ALL"],
  },
  {
    id: "bg-new-year",
    filename: "lucid-origin_A_vibrant_landscape_rectangular_abstract_background_with_sharp_corners_for_a_New-0.jpg",
    name: "New Year",
    description: "Celebratory gold and sparkles",
    suggestedForThemes: ["luxury", "gradient"],
    seasonal: true,
    category: "seasonal",
    templateTypes: ["ALL"],
  },
  {
    id: "bg-winter",
    filename: "lucid-origin_A_vibrant_landscape_rectangular_abstract_background_with_sharp_corners_for_a_Win-1.jpg",
    name: "Winter",
    description: "Cool blue winter scene",
    suggestedForThemes: ["ocean"],
    seasonal: true,
    category: "seasonal",
    templateTypes: ["ALL"],
  },

  // ============================================
  // FLASH SALE SPECIFIC BACKGROUNDS
  // These are optimized for centered flash sale popups with overlay text
  // Located in public/recipes/flash-sale/
  // ============================================
  {
    id: "fs-bg-summer",
    filename: "recipes/flash-sale/summer.jpg",
    name: "Summer Flash Sale",
    description: "Warm summer vibes for flash sales",
    suggestedForThemes: ["summer"],
    primaryTheme: "summer",
    seasonal: true,
    category: "seasonal",
    templateTypes: ["FLASH_SALE"],
    featured: true,
  },
  {
    id: "fs-bg-black-friday",
    filename: "recipes/flash-sale/black-friday-center-negative.jpg",
    name: "Black Friday Flash Sale",
    description: "Bold black with dramatic lighting",
    suggestedForThemes: ["black-friday", "dark", "luxury"],
    primaryTheme: "black-friday",
    seasonal: true,
    category: "seasonal",
    templateTypes: ["FLASH_SALE"],
    featured: true,
  },
  {
    id: "fs-bg-christmas",
    filename: "recipes/flash-sale/christman-center-negative.jpg",
    name: "Christmas Flash Sale",
    description: "Festive holiday atmosphere",
    suggestedForThemes: ["holiday"],
    primaryTheme: "holiday",
    seasonal: true,
    category: "seasonal",
    templateTypes: ["FLASH_SALE"],
    featured: true,
  },
  {
    id: "fs-bg-valentine",
    filename: "recipes/flash-sale/valentine-day-negative-center.jpg",
    name: "Valentine's Flash Sale",
    description: "Romantic pink and red tones",
    suggestedForThemes: ["valentine"],
    primaryTheme: "valentine",
    seasonal: true,
    category: "seasonal",
    templateTypes: ["FLASH_SALE"],
  },
  {
    id: "fs-bg-easter",
    filename: "recipes/flash-sale/easter-negative-center.jpg",
    name: "Easter Flash Sale",
    description: "Fresh spring pastels",
    suggestedForThemes: ["spring"],
    primaryTheme: "spring",
    seasonal: true,
    category: "seasonal",
    templateTypes: ["FLASH_SALE"],
  },
  {
    id: "fs-bg-halloween",
    filename: "recipes/flash-sale/halloween-center-negative.jpg",
    name: "Halloween Flash Sale",
    description: "Spooky orange and black",
    suggestedForThemes: ["dark", "neon"],
    seasonal: true,
    category: "seasonal",
    templateTypes: ["FLASH_SALE"],
  },
  {
    id: "fs-bg-thanksgiving",
    filename: "recipes/flash-sale/thanksgivin-center-negative.jpg",
    name: "Thanksgiving Flash Sale",
    description: "Warm autumn harvest tones",
    suggestedForThemes: ["luxury"],
    seasonal: true,
    category: "seasonal",
    templateTypes: ["FLASH_SALE"],
  },
  {
    id: "fs-bg-new-year",
    filename: "recipes/flash-sale/new-year-center-negative.jpg",
    name: "New Year Flash Sale",
    description: "Celebratory gold and sparkles",
    suggestedForThemes: ["luxury", "gradient"],
    seasonal: true,
    category: "seasonal",
    templateTypes: ["FLASH_SALE"],
  },
  {
    id: "fs-bg-winter",
    filename: "recipes/flash-sale/winter-negative-center.jpg",
    name: "Winter Flash Sale",
    description: "Cool blue winter clearance",
    suggestedForThemes: ["ocean"],
    seasonal: true,
    category: "seasonal",
    templateTypes: ["FLASH_SALE"],
  },
  {
    id: "fs-bg-back-to-school",
    filename: "recipes/flash-sale/back-to-school-center-negative.jpg",
    name: "Back to School Flash Sale",
    description: "Academic season savings",
    suggestedForThemes: ["modern", "gradient"],
    seasonal: true,
    category: "seasonal",
    templateTypes: ["FLASH_SALE"],
  },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get all backgrounds suggested for a specific theme
 */
export function getBackgroundsForTheme(theme: NewsletterThemeKey): BackgroundPreset[] {
  return BACKGROUND_PRESETS.filter((bg) => bg.suggestedForThemes.includes(theme));
}

/**
 * Get the primary/default background for a theme.
 * Returns the background where this theme is the primaryTheme.
 */
export function getDefaultBackgroundForTheme(
  theme: NewsletterThemeKey
): BackgroundPreset | undefined {
  return BACKGROUND_PRESETS.find((bg) => bg.primaryTheme === theme);
}

/**
 * Get background by ID
 */
export function getBackgroundById(id: string): BackgroundPreset | undefined {
  return BACKGROUND_PRESETS.find((bg) => bg.id === id);
}

/**
 * Get all backgrounds in a category
 */
export function getBackgroundsByCategory(category: BackgroundCategory): BackgroundPreset[] {
  return BACKGROUND_PRESETS.filter((bg) => bg.category === category);
}

/**
 * Get featured backgrounds
 */
export function getFeaturedBackgrounds(): BackgroundPreset[] {
  return BACKGROUND_PRESETS.filter((bg) => bg.featured);
}

/**
 * Get seasonal backgrounds
 */
export function getSeasonalBackgrounds(): BackgroundPreset[] {
  return BACKGROUND_PRESETS.filter((bg) => bg.seasonal);
}

/**
 * Get backgrounds compatible with a template type
 */
export function getBackgroundsForTemplateType(
  templateType: TemplateTypeForBackground
): BackgroundPreset[] {
  return BACKGROUND_PRESETS.filter(
    (bg) => bg.templateTypes.includes("ALL") || bg.templateTypes.includes(templateType)
  );
}

/**
 * Build the full URL for a background image
 * Works for both admin preview and storefront
 *
 * If filename already includes a path (e.g., "recipes/flash-sale/summer.jpg"),
 * it's used as-is. Otherwise, defaults to newsletter-backgrounds folder.
 */
export function getBackgroundUrl(preset: BackgroundPreset, baseUrl?: string): string {
  const base = baseUrl || "";
  // If filename already includes a path separator, use it as-is
  if (preset.filename.includes("/")) {
    return `${base}/${preset.filename}`;
  }
  // Default to newsletter-backgrounds folder for legacy filenames
  return `${base}/newsletter-backgrounds/${preset.filename}`;
}

/**
 * Check if a theme has a dedicated background
 */
export function themeHasDedicatedBackground(theme: NewsletterThemeKey): boolean {
  return BACKGROUND_PRESETS.some((bg) => bg.primaryTheme === theme);
}

/**
 * Get background preset ID for a theme (for use in recipes)
 */
export function getBackgroundIdForTheme(theme: NewsletterThemeKey): string | undefined {
  const preset = getDefaultBackgroundForTheme(theme);
  return preset?.id;
}

/**
 * Get backgrounds that are proven to work with a specific layout.
 * Derives suggestions from recipes that use the same layout - if a recipe
 * uses background X with layout Y, that combination is "proven" to work.
 *
 * @param layout - The layout to get backgrounds for (matches leadCaptureLayout.desktop)
 * @param recipes - Array of styled recipes to derive suggestions from
 * @returns Array of background presets used by recipes with the given layout
 */
export function getBackgroundsForLayout(
  layout: string | undefined,
  recipes: Array<{ layout: string; backgroundPresetId?: string }>
): BackgroundPreset[] {
  if (!layout) return [];

  // Map UI layout to recipe layouts
  // The DesignConfigSection uses leadCaptureLayout.desktop values like "split-left", "split-right", "overlay", "stacked", "content-only"
  // Recipes use PopupLayout values like "split-left", "split-right", "hero", "fullscreen", "centered"
  const layoutMapping: Record<string, string[]> = {
    "split-left": ["split-left"],
    "split-right": ["split-right"],
    "overlay": ["fullscreen", "centered"], // Full background mode maps to fullscreen/centered recipes
    "stacked": ["hero"], // Stacked layout is similar to hero (image on top)
    "content-only": ["centered"], // Content-only is similar to centered (no image focus)
  };

  const matchingRecipeLayouts = layoutMapping[layout] || [layout];

  // Find all recipes that use matching layouts
  const recipesWithLayout = recipes.filter((r) =>
    matchingRecipeLayouts.includes(r.layout)
  );

  // Extract unique background preset IDs
  const backgroundIds = new Set<string>();
  for (const recipe of recipesWithLayout) {
    if (recipe.backgroundPresetId) {
      backgroundIds.add(recipe.backgroundPresetId);
    }
  }

  // Return the actual presets
  return Array.from(backgroundIds)
    .map((id) => getBackgroundById(id))
    .filter((bg): bg is BackgroundPreset => bg !== undefined);
}

