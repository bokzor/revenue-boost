/**
 * Unit Tests for Google Fonts Utility
 */

import { describe, it, expect } from "vitest";

import {
  FONT_OPTIONS,
  getFontSelectOptions,
  getFontSelectOptionsFlat,
  extractFontName,
  getGoogleFontUrl,
} from "~/shared/utils/google-fonts";

describe("FONT_OPTIONS", () => {
  it("should have font options", () => {
    expect(FONT_OPTIONS.length).toBeGreaterThan(20);
  });

  it("should have required properties for each font", () => {
    for (const font of FONT_OPTIONS) {
      expect(font.label).toBeDefined();
      expect(font.value).toBeDefined();
      expect(font.googleFontId).toBeDefined();
      expect(font.category).toBeDefined();
    }
  });

  it("should have fonts in all categories", () => {
    const categories = new Set(FONT_OPTIONS.map((f) => f.category));
    expect(categories.has("sans-serif")).toBe(true);
    expect(categories.has("serif")).toBe(true);
    expect(categories.has("display")).toBe(true);
    expect(categories.has("monospace")).toBe(true);
  });
});

describe("getFontSelectOptions", () => {
  it("should include System Default option", () => {
    const options = getFontSelectOptions();
    expect(options[0]).toEqual({ label: "System Default", value: "inherit" });
  });

  it("should include category headers", () => {
    const options = getFontSelectOptions();
    const headers = options.filter((o) => o.value.startsWith("__"));
    expect(headers.length).toBeGreaterThan(0);
  });
});

describe("getFontSelectOptionsFlat", () => {
  it("should include System Default option", () => {
    const options = getFontSelectOptionsFlat();
    expect(options[0]).toEqual({ label: "System Default", value: "inherit" });
  });

  it("should not include category headers", () => {
    const options = getFontSelectOptionsFlat();
    const headers = options.filter((o) => o.value.startsWith("__"));
    expect(headers.length).toBe(0);
  });

  it("should add custom font if not in list", () => {
    const customFont = "CustomFont, sans-serif";
    const options = getFontSelectOptionsFlat(customFont);
    const customOption = options.find((o) => o.value === customFont);
    expect(customOption).toBeDefined();
    expect(customOption?.label).toContain("from theme");
  });

  it("should not duplicate existing fonts", () => {
    const existingFont = FONT_OPTIONS[0].value;
    const options = getFontSelectOptionsFlat(existingFont);
    const matches = options.filter((o) => o.value === existingFont);
    expect(matches.length).toBe(1);
  });
});

describe("extractFontName", () => {
  it("should extract font name from CSS font-family", () => {
    expect(extractFontName("Poppins, system-ui, sans-serif")).toBe("Poppins");
    expect(extractFontName("Inter, sans-serif")).toBe("Inter");
  });

  it("should handle quoted font names", () => {
    expect(extractFontName("'Open Sans', system-ui, sans-serif")).toBe("Open Sans");
    expect(extractFontName('"Playfair Display", Georgia, serif')).toBe("Playfair Display");
  });

  it("should return Custom Font for empty input", () => {
    expect(extractFontName("")).toBe("Custom Font");
  });
});

describe("getGoogleFontUrl", () => {
  it("should return null for inherit", () => {
    expect(getGoogleFontUrl("inherit")).toBeNull();
  });

  it("should return null for empty string", () => {
    expect(getGoogleFontUrl("")).toBeNull();
  });

  it("should return URL for predefined fonts", () => {
    const interFont = FONT_OPTIONS.find((f) => f.label === "Inter");
    if (interFont) {
      const url = getGoogleFontUrl(interFont.value);
      expect(url).toContain("fonts.googleapis.com");
      expect(url).toContain("Inter");
    }
  });

  it("should construct URL for unknown fonts", () => {
    const url = getGoogleFontUrl("CustomFont, sans-serif");
    expect(url).toContain("fonts.googleapis.com");
    expect(url).toContain("CustomFont");
  });
});

