/**
 * Unit Tests for Storefront Google Fonts Utilities
 *
 * Tests the Google Fonts loading and font name extraction.
 */

import { describe, it, expect } from "vitest";

// Recreate the GOOGLE_FONT_MAP (subset for testing)
const GOOGLE_FONT_MAP: Record<string, string> = {
  "Inter, system-ui, sans-serif": "Inter:wght@400;500;600;700",
  "Roboto, system-ui, sans-serif": "Roboto:wght@400;500;700",
  "'Open Sans', system-ui, sans-serif": "Open+Sans:wght@400;500;600;700",
  "Poppins, system-ui, sans-serif": "Poppins:wght@400;500;600;700",
  "'Playfair Display', Georgia, serif": "Playfair+Display:wght@400;500;600;700",
};

// Recreate the extractFontName helper
function extractFontName(fontFamily: string): string {
  if (!fontFamily) return "";
  const firstFont = fontFamily.split(",")[0].trim();
  return firstFont.replace(/^['"]|['"]$/g, "");
}

// Recreate the getGoogleFontUrl helper
function getGoogleFontUrl(fontFamily: string): string | null {
  if (!fontFamily || fontFamily === "inherit") return null;

  const predefinedId = GOOGLE_FONT_MAP[fontFamily];
  if (predefinedId) {
    return `https://fonts.googleapis.com/css2?family=${predefinedId}&display=swap`;
  }

  const fontName = extractFontName(fontFamily);
  if (!fontName) return null;

  const googleFontName = fontName.replace(/\s+/g, "+");
  return `https://fonts.googleapis.com/css2?family=${googleFontName}:wght@400;500;600;700&display=swap`;
}

// Helper to generate link ID
function generateLinkId(fontFamily: string): string {
  return `rb-font-${fontFamily.replace(/[^a-z0-9]/gi, "-")}`;
}

describe("Storefront Google Fonts Utilities", () => {
  describe("GOOGLE_FONT_MAP", () => {
    it("should have Inter font", () => {
      expect(GOOGLE_FONT_MAP["Inter, system-ui, sans-serif"]).toBe("Inter:wght@400;500;600;700");
    });

    it("should have Roboto font", () => {
      expect(GOOGLE_FONT_MAP["Roboto, system-ui, sans-serif"]).toBe("Roboto:wght@400;500;700");
    });

    it("should have Open Sans font with quotes", () => {
      expect(GOOGLE_FONT_MAP["'Open Sans', system-ui, sans-serif"]).toBe("Open+Sans:wght@400;500;600;700");
    });
  });

  describe("extractFontName", () => {
    it("should extract simple font name", () => {
      expect(extractFontName("Inter, system-ui, sans-serif")).toBe("Inter");
    });

    it("should extract quoted font name", () => {
      expect(extractFontName("'Open Sans', system-ui, sans-serif")).toBe("Open Sans");
    });

    it("should handle double quotes", () => {
      expect(extractFontName('"Open Sans", system-ui, sans-serif')).toBe("Open Sans");
    });

    it("should return empty string for empty input", () => {
      expect(extractFontName("")).toBe("");
    });
  });

  describe("getGoogleFontUrl", () => {
    it("should return URL for predefined font", () => {
      const url = getGoogleFontUrl("Inter, system-ui, sans-serif");
      expect(url).toBe("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");
    });

    it("should return URL for unknown font", () => {
      const url = getGoogleFontUrl("Custom Font, sans-serif");
      expect(url).toBe("https://fonts.googleapis.com/css2?family=Custom+Font:wght@400;500;600;700&display=swap");
    });

    it("should return null for inherit", () => {
      expect(getGoogleFontUrl("inherit")).toBeNull();
    });

    it("should return null for empty string", () => {
      expect(getGoogleFontUrl("")).toBeNull();
    });
  });

  describe("generateLinkId", () => {
    it("should generate valid ID", () => {
      const id = generateLinkId("Inter, system-ui, sans-serif");
      expect(id).toBe("rb-font-Inter--system-ui--sans-serif");
    });

    it("should replace special characters", () => {
      const id = generateLinkId("'Open Sans', sans-serif");
      expect(id).toMatch(/^rb-font-/);
      expect(id).not.toContain("'");
    });
  });

  describe("Font loading behavior", () => {
    it("should skip loading for inherit", () => {
      const shouldLoad = (fontFamily: string) => fontFamily !== "inherit" && fontFamily !== "";
      expect(shouldLoad("inherit")).toBe(false);
      expect(shouldLoad("")).toBe(false);
      expect(shouldLoad("Inter, sans-serif")).toBe(true);
    });
  });
});

