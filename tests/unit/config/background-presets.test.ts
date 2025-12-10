/**
 * Unit Tests for Background Presets Configuration
 */

import { describe, it, expect } from "vitest";

import {
  BACKGROUND_PRESETS,
  getBackgroundById,
  getBackgroundsForTheme,
  getDefaultBackgroundForTheme,
  getBackgroundsByCategory,
  getFeaturedBackgrounds,
  getSeasonalBackgrounds,
  getBackgroundsForTemplateType,
  getBackgroundUrl,
  themeHasDedicatedBackground,
  getBackgroundIdForTheme,
  getBackgroundsForLayout,
} from "~/config/background-presets";

describe("Background Presets", () => {
  describe("BACKGROUND_PRESETS", () => {
    it("should have presets defined", () => {
      expect(BACKGROUND_PRESETS.length).toBeGreaterThan(0);
    });

    it("should have required fields on each preset", () => {
      BACKGROUND_PRESETS.forEach((preset) => {
        expect(preset.id).toBeDefined();
        expect(preset.filename).toBeDefined();
        expect(preset.name).toBeDefined();
        expect(preset.category).toBeDefined();
        expect(preset.templateTypes).toBeDefined();
        expect(Array.isArray(preset.templateTypes)).toBe(true);
      });
    });
  });

  describe("getBackgroundById", () => {
    it("should return preset by ID", () => {
      const preset = getBackgroundById("bg-modern");
      expect(preset).toBeDefined();
      expect(preset?.name).toBe("Modern");
    });

    it("should return undefined for unknown ID", () => {
      const preset = getBackgroundById("unknown-id");
      expect(preset).toBeUndefined();
    });
  });

  describe("getBackgroundsForTheme", () => {
    it("should return backgrounds for modern theme", () => {
      const backgrounds = getBackgroundsForTheme("modern");
      expect(backgrounds.length).toBeGreaterThan(0);
      expect(backgrounds.some((bg) => bg.suggestedForThemes.includes("modern"))).toBe(true);
    });

    it("should return empty array for unknown theme", () => {
      const backgrounds = getBackgroundsForTheme("unknown-theme" as never);
      expect(backgrounds).toEqual([]);
    });
  });

  describe("getDefaultBackgroundForTheme", () => {
    it("should return primary background for theme", () => {
      const preset = getDefaultBackgroundForTheme("modern");
      expect(preset).toBeDefined();
      expect(preset?.primaryTheme).toBe("modern");
    });

    it("should return undefined for theme without primary background", () => {
      const preset = getDefaultBackgroundForTheme("unknown-theme" as never);
      expect(preset).toBeUndefined();
    });
  });

  describe("getBackgroundsByCategory", () => {
    it("should return backgrounds by category", () => {
      const themeBackgrounds = getBackgroundsByCategory("theme");
      expect(themeBackgrounds.length).toBeGreaterThan(0);
      themeBackgrounds.forEach((bg) => {
        expect(bg.category).toBe("theme");
      });
    });
  });

  describe("getFeaturedBackgrounds", () => {
    it("should return featured backgrounds", () => {
      const featured = getFeaturedBackgrounds();
      featured.forEach((bg) => {
        expect(bg.featured).toBe(true);
      });
    });
  });

  describe("getSeasonalBackgrounds", () => {
    it("should return seasonal backgrounds", () => {
      const seasonal = getSeasonalBackgrounds();
      seasonal.forEach((bg) => {
        expect(bg.seasonal).toBe(true);
      });
    });
  });

  describe("getBackgroundsForTemplateType", () => {
    it("should return backgrounds for NEWSLETTER", () => {
      const backgrounds = getBackgroundsForTemplateType("NEWSLETTER");
      expect(backgrounds.length).toBeGreaterThan(0);
    });

    it("should include ALL template type backgrounds", () => {
      const backgrounds = getBackgroundsForTemplateType("FLASH_SALE");
      const hasAllType = backgrounds.some((bg) => bg.templateTypes.includes("ALL"));
      expect(hasAllType).toBe(true);
    });
  });

  describe("getBackgroundUrl", () => {
    it("should build URL for simple filename", () => {
      const preset = { filename: "modern.jpg" } as never;
      const url = getBackgroundUrl(preset);
      expect(url).toBe("/newsletter-backgrounds/modern.jpg");
    });

    it("should use filename as-is if it includes path", () => {
      const preset = { filename: "recipes/flash-sale/summer.jpg" } as never;
      const url = getBackgroundUrl(preset);
      expect(url).toBe("/recipes/flash-sale/summer.jpg");
    });

    it("should prepend base URL", () => {
      const preset = { filename: "modern.jpg" } as never;
      const url = getBackgroundUrl(preset, "https://cdn.example.com");
      expect(url).toBe("https://cdn.example.com/newsletter-backgrounds/modern.jpg");
    });
  });

  describe("themeHasDedicatedBackground", () => {
    it("should return true for theme with dedicated background", () => {
      expect(themeHasDedicatedBackground("modern")).toBe(true);
    });
  });

  describe("getBackgroundIdForTheme", () => {
    it("should return background ID for theme", () => {
      const id = getBackgroundIdForTheme("modern");
      expect(id).toBe("bg-modern");
    });
  });

  describe("getBackgroundsForLayout", () => {
    it("should return empty array for undefined layout", () => {
      const backgrounds = getBackgroundsForLayout(undefined, []);
      expect(backgrounds).toEqual([]);
    });

    it("should return backgrounds from matching recipes", () => {
      const recipes = [
        { layout: "split-left", backgroundPresetId: "bg-modern" },
        { layout: "split-right", backgroundPresetId: "bg-minimal" },
      ];
      const backgrounds = getBackgroundsForLayout("split-left", recipes);
      expect(backgrounds.some((bg) => bg.id === "bg-modern")).toBe(true);
    });
  });
});

