/**
 * Google Fonts Utility
 *
 * Dynamically loads Google Fonts when needed for theme presets.
 * This is the single source of truth for font options used across the app.
 */

/**
 * Font option type for UI selectors
 */
export interface FontOption {
  label: string;
  value: string;
  googleFontId: string;
  category: "sans-serif" | "serif" | "display" | "monospace";
}

/**
 * Comprehensive list of supported fonts with their CSS values and Google Font IDs.
 * These are the most popular fonts from Shopify themes and Google Fonts.
 */
export const FONT_OPTIONS: FontOption[] = [
  // Sans-serif fonts (most popular for modern designs)
  { label: "Inter", value: "Inter, system-ui, sans-serif", googleFontId: "Inter:wght@400;500;600;700", category: "sans-serif" },
  { label: "Roboto", value: "Roboto, system-ui, sans-serif", googleFontId: "Roboto:wght@400;500;700", category: "sans-serif" },
  { label: "Open Sans", value: "'Open Sans', system-ui, sans-serif", googleFontId: "Open+Sans:wght@400;500;600;700", category: "sans-serif" },
  { label: "Lato", value: "Lato, system-ui, sans-serif", googleFontId: "Lato:wght@400;700", category: "sans-serif" },
  { label: "Montserrat", value: "Montserrat, system-ui, sans-serif", googleFontId: "Montserrat:wght@400;500;600;700", category: "sans-serif" },
  { label: "Poppins", value: "Poppins, system-ui, sans-serif", googleFontId: "Poppins:wght@400;500;600;700", category: "sans-serif" },
  { label: "Nunito", value: "Nunito, system-ui, sans-serif", googleFontId: "Nunito:wght@400;500;600;700", category: "sans-serif" },
  { label: "Nunito Sans", value: "'Nunito Sans', system-ui, sans-serif", googleFontId: "Nunito+Sans:wght@400;500;600;700", category: "sans-serif" },
  { label: "Raleway", value: "Raleway, system-ui, sans-serif", googleFontId: "Raleway:wght@400;500;600;700", category: "sans-serif" },
  { label: "Work Sans", value: "'Work Sans', system-ui, sans-serif", googleFontId: "Work+Sans:wght@400;500;600;700", category: "sans-serif" },
  { label: "DM Sans", value: "'DM Sans', system-ui, sans-serif", googleFontId: "DM+Sans:wght@400;500;700", category: "sans-serif" },
  { label: "Manrope", value: "Manrope, system-ui, sans-serif", googleFontId: "Manrope:wght@400;500;600;700", category: "sans-serif" },
  { label: "Karla", value: "Karla, system-ui, sans-serif", googleFontId: "Karla:wght@400;500;600;700", category: "sans-serif" },
  { label: "Mulish", value: "Mulish, system-ui, sans-serif", googleFontId: "Mulish:wght@400;500;600;700", category: "sans-serif" },
  { label: "Rubik", value: "Rubik, system-ui, sans-serif", googleFontId: "Rubik:wght@400;500;600;700", category: "sans-serif" },
  { label: "Quicksand", value: "Quicksand, system-ui, sans-serif", googleFontId: "Quicksand:wght@400;500;600;700", category: "sans-serif" },
  { label: "Barlow", value: "Barlow, system-ui, sans-serif", googleFontId: "Barlow:wght@400;500;600;700", category: "sans-serif" },
  { label: "Jost", value: "Jost, system-ui, sans-serif", googleFontId: "Jost:wght@400;500;600;700", category: "sans-serif" },
  { label: "Assistant", value: "Assistant, system-ui, sans-serif", googleFontId: "Assistant:wght@400;500;600;700", category: "sans-serif" },
  { label: "Oswald", value: "Oswald, system-ui, sans-serif", googleFontId: "Oswald:wght@400;500;600;700", category: "sans-serif" },
  { label: "Source Sans Pro", value: "'Source Sans Pro', system-ui, sans-serif", googleFontId: "Source+Sans+Pro:wght@400;600;700", category: "sans-serif" },

  // Serif fonts (elegant, traditional)
  { label: "Playfair Display", value: "'Playfair Display', Georgia, serif", googleFontId: "Playfair+Display:wght@400;500;600;700", category: "serif" },
  { label: "Merriweather", value: "Merriweather, Georgia, serif", googleFontId: "Merriweather:wght@400;700", category: "serif" },
  { label: "Lora", value: "Lora, Georgia, serif", googleFontId: "Lora:wght@400;500;600;700", category: "serif" },
  { label: "Libre Baskerville", value: "'Libre Baskerville', Georgia, serif", googleFontId: "Libre+Baskerville:wght@400;700", category: "serif" },
  { label: "EB Garamond", value: "'EB Garamond', Garamond, serif", googleFontId: "EB+Garamond:wght@400;500;600;700", category: "serif" },
  { label: "Cormorant Garamond", value: "'Cormorant Garamond', Garamond, serif", googleFontId: "Cormorant+Garamond:wght@400;500;600;700", category: "serif" },
  { label: "Crimson Text", value: "'Crimson Text', Georgia, serif", googleFontId: "Crimson+Text:wght@400;600;700", category: "serif" },
  { label: "Source Serif Pro", value: "'Source Serif Pro', Georgia, serif", googleFontId: "Source+Serif+Pro:wght@400;600;700", category: "serif" },
  { label: "DM Serif Display", value: "'DM Serif Display', Georgia, serif", googleFontId: "DM+Serif+Display:wght@400", category: "serif" },
  { label: "Bitter", value: "Bitter, Georgia, serif", googleFontId: "Bitter:wght@400;500;600;700", category: "serif" },

  // Display fonts (headlines, bold statements)
  { label: "Bebas Neue", value: "'Bebas Neue', Impact, sans-serif", googleFontId: "Bebas+Neue:wght@400", category: "display" },
  { label: "Anton", value: "Anton, Impact, sans-serif", googleFontId: "Anton:wght@400", category: "display" },
  { label: "Abril Fatface", value: "'Abril Fatface', Georgia, serif", googleFontId: "Abril+Fatface:wght@400", category: "display" },

  // Monospace fonts (technical, modern)
  { label: "Roboto Mono", value: "'Roboto Mono', monospace", googleFontId: "Roboto+Mono:wght@400;500;700", category: "monospace" },
  { label: "Fira Code", value: "'Fira Code', monospace", googleFontId: "Fira+Code:wght@400;500;700", category: "monospace" },
  { label: "Source Code Pro", value: "'Source Code Pro', monospace", googleFontId: "Source+Code+Pro:wght@400;500;700", category: "monospace" },
];

/**
 * Get font options formatted for Polaris Select component.
 * Includes "System Default" option and groups by category.
 */
export function getFontSelectOptions(): { label: string; value: string }[] {
  return [
    { label: "System Default", value: "inherit" },
    // Add separator labels for categories
    { label: "── Sans-Serif ──", value: "__sans-serif-header__" },
    ...FONT_OPTIONS.filter(f => f.category === "sans-serif").map(f => ({ label: f.label, value: f.value })),
    { label: "── Serif ──", value: "__serif-header__" },
    ...FONT_OPTIONS.filter(f => f.category === "serif").map(f => ({ label: f.label, value: f.value })),
    { label: "── Display ──", value: "__display-header__" },
    ...FONT_OPTIONS.filter(f => f.category === "display").map(f => ({ label: f.label, value: f.value })),
    { label: "── Monospace ──", value: "__monospace-header__" },
    ...FONT_OPTIONS.filter(f => f.category === "monospace").map(f => ({ label: f.label, value: f.value })),
  ];
}

/**
 * Get a flat list of font options (without category headers) for simple selects.
 * @param currentValue - Optional current font value to include if not in predefined list
 */
export function getFontSelectOptionsFlat(currentValue?: string): { label: string; value: string }[] {
  const options = [
    { label: "System Default", value: "inherit" },
    ...FONT_OPTIONS.map(f => ({ label: f.label, value: f.value })),
  ];

  // If there's a current value that's not in our predefined list, add it
  if (currentValue && currentValue !== "inherit") {
    const isInList = FONT_OPTIONS.some(f => f.value === currentValue);
    if (!isInList) {
      // Extract font name from the CSS value (e.g., "Poppins, system-ui, sans-serif" -> "Poppins")
      const fontLabel = extractFontName(currentValue);
      options.splice(1, 0, {
        label: `${fontLabel} (from theme)`,
        value: currentValue
      });
    }
  }

  return options;
}

/**
 * Extract the primary font name from a CSS font-family string.
 * E.g., "Poppins, system-ui, sans-serif" -> "Poppins"
 * E.g., "'Open Sans', system-ui, sans-serif" -> "Open Sans"
 */
export function extractFontName(fontFamily: string): string {
  if (!fontFamily) return "Custom Font";

  // Get the first font in the stack
  const firstFont = fontFamily.split(",")[0].trim();

  // Remove quotes if present
  return firstFont.replace(/^['"]|['"]$/g, "");
}

/**
 * Try to construct a Google Fonts URL for any font family.
 * This is used for fonts imported from themes that may not be in our predefined list.
 */
export function getGoogleFontUrl(fontFamily: string): string | null {
  if (!fontFamily || fontFamily === "inherit") return null;

  // First check if it's in our predefined map
  const predefinedId = GOOGLE_FONT_MAP[fontFamily];
  if (predefinedId) {
    return `https://fonts.googleapis.com/css2?family=${predefinedId}&display=swap`;
  }

  // Otherwise, try to construct a URL from the font name
  const fontName = extractFontName(fontFamily);
  if (!fontName || fontName === "Custom Font") return null;

  // Format for Google Fonts: replace spaces with +
  const googleFontName = fontName.replace(/\s+/g, "+");
  return `https://fonts.googleapis.com/css2?family=${googleFontName}:wght@400;500;600;700&display=swap`;
}

// Build the Google Font map from FONT_OPTIONS for internal use
const GOOGLE_FONT_MAP: Record<string, string> = Object.fromEntries(
  FONT_OPTIONS.map(f => [f.value, f.googleFontId])
);

// Track which fonts have been loaded
const loadedFonts = new Set<string>();

/**
 * Load a Google Font dynamically
 * @param fontFamily - The CSS font-family value (e.g., "Inter, system-ui, sans-serif")
 */
export function loadGoogleFont(fontFamily: string | undefined): void {
  if (!fontFamily || fontFamily === "inherit") return;
  if (typeof document === "undefined") return; // SSR safety

  // Try to get the font URL (works for predefined fonts and attempts unknown fonts)
  const fontUrl = getGoogleFontUrl(fontFamily);
  if (!fontUrl) return;

  // Create a unique key for tracking
  const fontKey = fontFamily;

  // Already loaded
  if (loadedFonts.has(fontKey)) return;

  const linkId = `google-font-${fontKey.replace(/[^a-z0-9]/gi, "-")}`;

  // Check if already in DOM
  if (document.getElementById(linkId)) {
    loadedFonts.add(fontKey);
    return;
  }

  const link = document.createElement("link");
  link.id = linkId;
  link.rel = "stylesheet";
  link.href = fontUrl;
  document.head.appendChild(link);

  loadedFonts.add(fontKey);
}

/**
 * React hook to load a Google Font
 * @param fontFamily - The CSS font-family value
 */
export function useGoogleFont(fontFamily: string | undefined): void {
  // Using dynamic import to avoid issues with SSR
  if (typeof window !== "undefined") {
    loadGoogleFont(fontFamily);
  }
}

