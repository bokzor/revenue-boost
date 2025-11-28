/**
 * Google Fonts Loader for Storefront
 *
 * Dynamically loads Google Fonts when needed for popup rendering.
 * This ensures custom fonts from theme presets are available on the storefront.
 */

// Map of font family CSS values to their Google Fonts identifiers
const GOOGLE_FONT_MAP: Record<string, string> = {
  "Inter, system-ui, sans-serif": "Inter:wght@400;500;600;700",
  "Roboto, system-ui, sans-serif": "Roboto:wght@400;500;700",
  "'Open Sans', system-ui, sans-serif": "Open+Sans:wght@400;500;600;700",
  "Lato, system-ui, sans-serif": "Lato:wght@400;700",
  "Montserrat, system-ui, sans-serif": "Montserrat:wght@400;500;600;700",
  "'Playfair Display', Georgia, serif": "Playfair+Display:wght@400;500;600;700",
  "Merriweather, Georgia, serif": "Merriweather:wght@400;700",
};

// Track which fonts have been loaded
const loadedFonts = new Set<string>();

/**
 * Load a Google Font dynamically
 * @param fontFamily - The CSS font-family value (e.g., "Inter, system-ui, sans-serif")
 */
export function loadGoogleFont(fontFamily: string | undefined): void {
  if (!fontFamily || fontFamily === "inherit") return;
  if (typeof document === "undefined") return;

  const googleFontId = GOOGLE_FONT_MAP[fontFamily];
  if (!googleFontId) return;

  // Already loaded
  if (loadedFonts.has(googleFontId)) return;

  const linkId = `rb-font-${googleFontId.replace(/[^a-z0-9]/gi, "-")}`;

  // Check if already in DOM
  if (document.getElementById(linkId)) {
    loadedFonts.add(googleFontId);
    return;
  }

  const link = document.createElement("link");
  link.id = linkId;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${googleFontId}&display=swap`;
  document.head.appendChild(link);

  loadedFonts.add(googleFontId);
  
  console.log(`[RevenueBoost] Loaded font: ${fontFamily}`);
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

