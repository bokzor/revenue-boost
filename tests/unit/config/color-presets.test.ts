/**
 * Unit Tests for Color Presets Configuration
 */

import { describe, it, expect } from "vitest";

import {
  NEWSLETTER_THEMES,
  FLASH_SALE_THEMES,
  TEMPLATE_THEME_BEHAVIOR,
  getNewsletterThemeColors,
  getFlashSaleThemeColors,
  getSpinToWinSliceColors,
  getTemplateThemeBehavior,
  themeColorsToDesignConfig,
} from "~/config/color-presets";

describe("Color Presets", () => {
  describe("NEWSLETTER_THEMES", () => {
    it("should have all required themes", () => {
      expect(NEWSLETTER_THEMES.modern).toBeDefined();
      expect(NEWSLETTER_THEMES.minimal).toBeDefined();
      expect(NEWSLETTER_THEMES.dark).toBeDefined();
      expect(NEWSLETTER_THEMES.gradient).toBeDefined();
      expect(NEWSLETTER_THEMES.luxury).toBeDefined();
    });

    it("should have required color properties", () => {
      const theme = NEWSLETTER_THEMES.modern;
      expect(theme.background).toBeDefined();
      expect(theme.text).toBeDefined();
      expect(theme.primary).toBeDefined();
      expect(theme.secondary).toBeDefined();
      expect(theme.accent).toBeDefined();
      expect(theme.border).toBeDefined();
      expect(theme.success).toBeDefined();
      expect(theme.warning).toBeDefined();
    });
  });

  describe("FLASH_SALE_THEMES", () => {
    it("should have flash sale themes", () => {
      expect(FLASH_SALE_THEMES.urgent_red).toBeDefined();
      expect(FLASH_SALE_THEMES.neon_flash).toBeDefined();
    });
  });



  describe("getNewsletterThemeColors", () => {
    it("should return theme colors", () => {
      const colors = getNewsletterThemeColors("modern");
      expect(colors.background).toBe("#ffffff");
      expect(colors.primary).toBe("#3b82f6");
    });

    it("should merge custom colors", () => {
      const colors = getNewsletterThemeColors("modern", { background: "#000000" });
      expect(colors.background).toBe("#000000");
      expect(colors.primary).toBe("#3b82f6");
    });
  });

  describe("getFlashSaleThemeColors", () => {
    it("should return theme colors", () => {
      const colors = getFlashSaleThemeColors("urgent_red");
      expect(colors).toBeDefined();
      expect(colors.background).toBeDefined();
    });

    it("should merge custom colors", () => {
      const colors = getFlashSaleThemeColors("urgent_red", { text: "#ffffff" });
      expect(colors.text).toBe("#ffffff");
    });
  });

  describe("getSpinToWinSliceColors", () => {
    it("should return slice colors for theme", () => {
      const colors = getSpinToWinSliceColors("modern", 6);
      expect(colors).toBeDefined();
      expect(colors.length).toBe(6);
    });

    it("should return correct number of colors", () => {
      const colors = getSpinToWinSliceColors("dark", 4);
      expect(colors.length).toBe(4);
    });
  });



  describe("TEMPLATE_THEME_BEHAVIOR", () => {
    it("should define behavior for NEWSLETTER", () => {
      expect(TEMPLATE_THEME_BEHAVIOR.NEWSLETTER).toBeDefined();
      expect(TEMPLATE_THEME_BEHAVIOR.NEWSLETTER?.usesBackgroundImage).toBe(true);
    });

    it("should define behavior for SPIN_TO_WIN", () => {
      expect(TEMPLATE_THEME_BEHAVIOR.SPIN_TO_WIN).toBeDefined();
      expect(TEMPLATE_THEME_BEHAVIOR.SPIN_TO_WIN?.usesBackgroundImage).toBe(false);
    });
  });

  describe("getTemplateThemeBehavior", () => {
    it("should return behavior for known template", () => {
      const behavior = getTemplateThemeBehavior("NEWSLETTER");
      expect(behavior.usesBackgroundImage).toBe(true);
    });

    it("should return default behavior for unknown template", () => {
      const behavior = getTemplateThemeBehavior("UNKNOWN" as never);
      expect(behavior.usesBackgroundImage).toBe(false);
      expect(behavior.defaultImagePosition).toBe("none");
    });
  });

  describe("themeColorsToDesignConfig", () => {
    it("should convert theme colors to design config", () => {
      const colors = NEWSLETTER_THEMES.modern;
      const config = themeColorsToDesignConfig(colors);
      expect(config.backgroundColor).toBe(colors.background);
      expect(config.textColor).toBe(colors.text);
      expect(config.accentColor).toBe(colors.primary);
    });
  });
});

