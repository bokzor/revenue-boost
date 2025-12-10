/**
 * Unit Tests for Theme Settings Server Module
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  themeSettingsToPreset,
  themeSettingsToDesignTokens,
  designTokensToCSSVariables,
  type ExtractedThemeSettings,
} from "~/lib/shopify/theme-settings.server";

describe("Theme Settings Server Module", () => {
  const mockThemeSettings: ExtractedThemeSettings = {
    themeName: "Dawn",
    colors: {
      background: "#ffffff",
      text: "#121212",
      button: "#3b82f6",
      buttonLabel: "#ffffff",
    },
    typography: {
      headingFont: "Montserrat",
      headingFontStack: "Montserrat, sans-serif",
      bodyFont: "Open Sans",
      bodyFontStack: "Open Sans, sans-serif",
    },
    borderRadius: {
      buttons: 8,
      inputs: 4,
      popup: 12,
    },
    borders: {
      buttonThickness: 1,
      buttonOpacity: 100,
      inputThickness: 1,
      inputOpacity: 100,
    },
    shadows: {},
    isOS2Theme: true,
  };

  describe("themeSettingsToPreset", () => {
    it("should convert theme settings to preset", () => {
      const preset = themeSettingsToPreset(mockThemeSettings, "test-preset");

      expect(preset.id).toBe("test-preset");
      expect(preset.name).toBe("Dawn Theme");
      expect(preset.backgroundColor).toBe("#ffffff");
      expect(preset.textColor).toBe("#121212");
      expect(preset.brandColor).toBe("#3b82f6");
    });

    it("should set isDefault when option is provided", () => {
      const preset = themeSettingsToPreset(mockThemeSettings, "test-preset", {
        isDefault: true,
      });

      expect(preset.isDefault).toBe(true);
    });

    it("should include font family settings", () => {
      const preset = themeSettingsToPreset(mockThemeSettings, "test-preset");

      expect(preset.fontFamily).toBe("Open Sans, sans-serif");
      expect(preset.headingFontFamily).toBe("Montserrat, sans-serif");
    });
  });

  describe("themeSettingsToDesignTokens", () => {
    it("should convert theme settings to design tokens", () => {
      const tokens = themeSettingsToDesignTokens(mockThemeSettings);

      expect(tokens.background).toBe("#ffffff");
      expect(tokens.foreground).toBe("#121212");
      expect(tokens.primary).toBe("#3b82f6");
      expect(tokens.primaryForeground).toBe("#ffffff");
    });

    it("should include font family from typography", () => {
      const tokens = themeSettingsToDesignTokens(mockThemeSettings);

      expect(tokens.fontFamily).toBe("Open Sans, sans-serif");
      expect(tokens.headingFontFamily).toBe("Montserrat, sans-serif");
    });

    it("should include border radius from settings", () => {
      const tokens = themeSettingsToDesignTokens(mockThemeSettings);

      expect(tokens.borderRadius).toBe(8);
      expect(tokens.popupBorderRadius).toBe(12);
    });

    it("should use fallback font when typography is missing", () => {
      const settingsWithoutTypography: ExtractedThemeSettings = {
        ...mockThemeSettings,
        typography: {},
      };

      const tokens = themeSettingsToDesignTokens(settingsWithoutTypography);

      expect(tokens.fontFamily).toContain("-apple-system");
    });
  });

  describe("designTokensToCSSVariables", () => {
    it("should convert design tokens to CSS variables", () => {
      const tokens = themeSettingsToDesignTokens(mockThemeSettings);
      const cssVars = designTokensToCSSVariables(tokens);

      expect(cssVars["--rb-background"]).toBe("#ffffff");
      expect(cssVars["--rb-foreground"]).toBe("#121212");
      expect(cssVars["--rb-primary"]).toBe("#3b82f6");
      expect(cssVars["--rb-primary-foreground"]).toBe("#ffffff");
    });

    it("should include radius as pixel values", () => {
      const tokens = themeSettingsToDesignTokens(mockThemeSettings);
      const cssVars = designTokensToCSSVariables(tokens);

      expect(cssVars["--rb-radius"]).toBe("8px");
      expect(cssVars["--rb-popup-radius"]).toBe("12px");
    });

    it("should include font family variables", () => {
      const tokens = themeSettingsToDesignTokens(mockThemeSettings);
      const cssVars = designTokensToCSSVariables(tokens);

      expect(cssVars["--rb-font-family"]).toBe("Open Sans, sans-serif");
      expect(cssVars["--rb-heading-font-family"]).toBe("Montserrat, sans-serif");
    });

    it("should include success color", () => {
      const tokens = themeSettingsToDesignTokens(mockThemeSettings);
      const cssVars = designTokensToCSSVariables(tokens);

      expect(cssVars["--rb-success"]).toBe("#10B981");
    });
  });
});

