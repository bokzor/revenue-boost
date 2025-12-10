/**
 * Google Fonts Loader for Storefront
 *
 * Dynamically loads Google Fonts when needed for popup rendering.
 * This ensures custom fonts from theme presets are available on the storefront.
 *
 * IMPORTANT: Keep this map in sync with app/shared/utils/google-fonts.ts
 */

// Map of font family CSS values to their Google Fonts identifiers
// This list supports all fonts that can be selected in the admin or imported from themes
const GOOGLE_FONT_MAP: Record<string, string> = {
  // Sans-serif fonts
  "Inter, system-ui, sans-serif": "Inter:wght@400;500;600;700",
  "Roboto, system-ui, sans-serif": "Roboto:wght@400;500;700",
  "'Open Sans', system-ui, sans-serif": "Open+Sans:wght@400;500;600;700",
  "Lato, system-ui, sans-serif": "Lato:wght@400;700",
  "Montserrat, system-ui, sans-serif": "Montserrat:wght@400;500;600;700",
  "Poppins, system-ui, sans-serif": "Poppins:wght@400;500;600;700",
  "Nunito, system-ui, sans-serif": "Nunito:wght@400;500;600;700",
  "'Nunito Sans', system-ui, sans-serif": "Nunito+Sans:wght@400;500;600;700",
  "Raleway, system-ui, sans-serif": "Raleway:wght@400;500;600;700",
  "'Work Sans', system-ui, sans-serif": "Work+Sans:wght@400;500;600;700",
  "'DM Sans', system-ui, sans-serif": "DM+Sans:wght@400;500;700",
  "Manrope, system-ui, sans-serif": "Manrope:wght@400;500;600;700",
  "Karla, system-ui, sans-serif": "Karla:wght@400;500;600;700",
  "Mulish, system-ui, sans-serif": "Mulish:wght@400;500;600;700",
  "Rubik, system-ui, sans-serif": "Rubik:wght@400;500;600;700",
  "Quicksand, system-ui, sans-serif": "Quicksand:wght@400;500;600;700",
  "Barlow, system-ui, sans-serif": "Barlow:wght@400;500;600;700",
  "Jost, system-ui, sans-serif": "Jost:wght@400;500;600;700",
  "Assistant, system-ui, sans-serif": "Assistant:wght@400;500;600;700",
  "Oswald, system-ui, sans-serif": "Oswald:wght@400;500;600;700",
  "'Source Sans Pro', system-ui, sans-serif": "Source+Sans+Pro:wght@400;600;700",

  // Serif fonts
  "'Playfair Display', Georgia, serif": "Playfair+Display:wght@400;500;600;700",
  "Merriweather, Georgia, serif": "Merriweather:wght@400;700",
  "Lora, Georgia, serif": "Lora:wght@400;500;600;700",
  "'Libre Baskerville', Georgia, serif": "Libre+Baskerville:wght@400;700",
  "'EB Garamond', Garamond, serif": "EB+Garamond:wght@400;500;600;700",
  "'Cormorant Garamond', Garamond, serif": "Cormorant+Garamond:wght@400;500;600;700",
  "'Crimson Text', Georgia, serif": "Crimson+Text:wght@400;600;700",
  "'Source Serif Pro', Georgia, serif": "Source+Serif+Pro:wght@400;600;700",
  "'DM Serif Display', Georgia, serif": "DM+Serif+Display:wght@400",
  "Bitter, Georgia, serif": "Bitter:wght@400;500;600;700",

  // Display fonts
  "'Bebas Neue', Impact, sans-serif": "Bebas+Neue:wght@400",
  "Anton, Impact, sans-serif": "Anton:wght@400",
  "'Abril Fatface', Georgia, serif": "Abril+Fatface:wght@400",

  // Monospace fonts
  "'Roboto Mono', monospace": "Roboto+Mono:wght@400;500;700",
  "'Fira Code', monospace": "Fira+Code:wght@400;500;700",
  "'Source Code Pro', monospace": "Source+Code+Pro:wght@400;500;700",
};

// Track which fonts have been loaded
const loadedFonts = new Set<string>();

/**
 * Extract the primary font name from a CSS font-family string.
 * E.g., "Poppins, system-ui, sans-serif" -> "Poppins"
 * E.g., "'Open Sans', system-ui, sans-serif" -> "Open Sans"
 */
function extractFontName(fontFamily: string): string {
  if (!fontFamily) return "";

  // Get the first font in the stack
  const firstFont = fontFamily.split(",")[0].trim();

  // Remove quotes if present
  return firstFont.replace(/^['"]|['"]$/g, "");
}

/**
 * Get the Google Fonts URL for a font family.
 * Works for predefined fonts and attempts to construct URLs for unknown fonts.
 */
function getGoogleFontUrl(fontFamily: string): string | null {
  if (!fontFamily || fontFamily === "inherit") return null;

  // First check if it's in our predefined map
  const predefinedId = GOOGLE_FONT_MAP[fontFamily];
  if (predefinedId) {
    return `https://fonts.googleapis.com/css2?family=${predefinedId}&display=swap`;
  }

  // Otherwise, try to construct a URL from the font name
  const fontName = extractFontName(fontFamily);
  if (!fontName) return null;

  // Format for Google Fonts: replace spaces with +
  const googleFontName = fontName.replace(/\s+/g, "+");
  return `https://fonts.googleapis.com/css2?family=${googleFontName}:wght@400;500;600;700&display=swap`;
}

/**
 * Load a Google Font dynamically
 * @param fontFamily - The CSS font-family value (e.g., "Inter, system-ui, sans-serif")
 */
export function loadGoogleFont(fontFamily: string | undefined): void {
  if (!fontFamily || fontFamily === "inherit") return;
  if (typeof document === "undefined") return;

  // Try to get the font URL (works for predefined fonts and attempts unknown fonts)
  const fontUrl = getGoogleFontUrl(fontFamily);
  if (!fontUrl) return;

  // Create a unique key for tracking
  const fontKey = fontFamily;

  // Already loaded
  if (loadedFonts.has(fontKey)) return;

  const linkId = `rb-font-${fontKey.replace(/[^a-z0-9]/gi, "-")}`;

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
 * Load font from a campaign's design config
 * Call this before rendering a popup
 */
export function loadFontFromDesignConfig(designConfig: Record<string, unknown> | undefined): void {
  if (!designConfig) return;
  
  const fontFamily = designConfig.fontFamily as string | undefined;
  if (fontFamily) {
    loadGoogleFont(fontFamily);
  }
}

