/**
 * Unit tests for theme-settings.server.ts
 *
 * Tests the extraction of theme settings from Shopify theme settings_data.json
 */

import { describe, it, expect } from "vitest";
import {
  parseThemeSettings,
  themeSettingsToDesignTokens,
  designTokensToCSSVariables,
  type ExtractedThemeSettings,
} from "~/lib/shopify/theme-settings.server";

// =============================================================================
// MOCK DATA: Dawn theme (OS 2.0)
// =============================================================================

const DAWN_SETTINGS_DATA = {
  current: {
    // Typography (root level)
    type_header_font: "assistant_n4",
    type_body_font: "montserrat_n4",
    heading_scale: 120,
    body_scale: 100,

    // Button/Input styling (root level)
    buttons_radius: 8,
    buttons_border_thickness: 1,
    buttons_border_opacity: 100,
    buttons_shadow_opacity: 0,
    buttons_shadow_horizontal_offset: 0,
    buttons_shadow_vertical_offset: 4,
    buttons_shadow_blur: 5,

    inputs_radius: 4,
    inputs_border_thickness: 1,
    inputs_border_opacity: 55,

    popup_corner_radius: 16,
    popup_shadow_opacity: 10,
    popup_shadow_horizontal_offset: 0,
    popup_shadow_vertical_offset: 4,
    popup_shadow_blur: 5,

    card_corner_radius: 0,

    // Color schemes (OS 2.0)
    color_schemes: {
      "scheme-1": {
        settings: {
          background: "#ffffff",
          text: "#121212",
          button: "#121212",
          button_label: "#ffffff",
          secondary_button_label: "#121212",
          shadow: "#121212",
        },
      },
      "scheme-2": {
        settings: {
          background: "#f3f3f3",
          text: "#333333",
          button: "#0066cc",
          button_label: "#ffffff",
        },
      },
    },
  },
};

// =============================================================================
// MOCK DATA: Legacy theme (pre-OS 2.0)
// =============================================================================

const LEGACY_SETTINGS_DATA = {
  current: {
    colors_background: "#fafafa",
    colors_text: "#333333",
    colors_primary: "#0066cc",
    colors_accent: "#ff6600",
  },
};

// =============================================================================
// TESTS
// =============================================================================

describe("theme-settings.server", () => {
  describe("parseThemeSettings", () => {
    it("should extract colors from OS 2.0 theme color_schemes", () => {
      const result = parseThemeSettings("Dawn", DAWN_SETTINGS_DATA);

      expect(result.isOS2Theme).toBe(true);
      expect(result.colors.background).toBe("#ffffff");
      expect(result.colors.text).toBe("#121212");
      expect(result.colors.button).toBe("#121212");
      expect(result.colors.buttonLabel).toBe("#ffffff");
    });

    it("should extract typography from root-level settings", () => {
      const result = parseThemeSettings("Dawn", DAWN_SETTINGS_DATA);

      expect(result.typography.headingFont).toBe("Assistant");
      expect(result.typography.bodyFont).toBe("Montserrat");
      expect(result.typography.headingScale).toBe(120);
      expect(result.typography.bodyScale).toBe(100);
      // Check font stacks include fallbacks
      expect(result.typography.headingFontStack).toContain("Assistant");
      expect(result.typography.headingFontStack).toContain("sans-serif");
      expect(result.typography.bodyFontStack).toContain("Montserrat");
    });

    it("should extract border radius from root-level settings", () => {
      const result = parseThemeSettings("Dawn", DAWN_SETTINGS_DATA);

      expect(result.borderRadius.buttons).toBe(8);
      expect(result.borderRadius.inputs).toBe(4);
      expect(result.borderRadius.popup).toBe(16);
      expect(result.borderRadius.cards).toBe(0);
    });

    it("should extract shadow settings from root-level settings", () => {
      const result = parseThemeSettings("Dawn", DAWN_SETTINGS_DATA);

      expect(result.shadows.buttonVerticalOffset).toBe(4);
      expect(result.shadows.buttonBlur).toBe(5);
      expect(result.shadows.popupOpacity).toBe(10);
    });

    it("should extract all color schemes for reference", () => {
      const result = parseThemeSettings("Dawn", DAWN_SETTINGS_DATA);

      expect(result.colorSchemes).toBeDefined();
      expect(Object.keys(result.colorSchemes!).length).toBe(2);
      expect(result.colorSchemes!["scheme-1"].background).toBe("#ffffff");
      expect(result.colorSchemes!["scheme-2"].button).toBe("#0066cc");
    });

    it("should fall back to legacy color settings for older themes", () => {
      const result = parseThemeSettings("Debut", LEGACY_SETTINGS_DATA);

      expect(result.isOS2Theme).toBe(false);
      expect(result.colors.background).toBe("#fafafa");
      expect(result.colors.text).toBe("#333333");
      expect(result.colors.button).toBe("#0066cc");
    });
  });

  describe("themeSettingsToDesignTokens", () => {
    it("should convert ExtractedThemeSettings to design tokens", () => {
      const settings = parseThemeSettings("Dawn", DAWN_SETTINGS_DATA);
      const tokens = themeSettingsToDesignTokens(settings);

      expect(tokens.background).toBe("#ffffff");
      expect(tokens.foreground).toBe("#121212");
      expect(tokens.primary).toBe("#121212");
      expect(tokens.primaryForeground).toBe("#ffffff");
      expect(tokens.borderRadius).toBe(8);
      expect(tokens.popupBorderRadius).toBe(16);
    });

    it("should derive muted color from foreground", () => {
      const settings = parseThemeSettings("Dawn", DAWN_SETTINGS_DATA);
      const tokens = themeSettingsToDesignTokens(settings);

      // Muted should be derived (rgba with opacity)
      expect(tokens.muted).toContain("rgba");
      expect(tokens.muted).toContain("0.6");
    });

    it("should derive surface color from background", () => {
      const settings = parseThemeSettings("Dawn", DAWN_SETTINGS_DATA);
      const tokens = themeSettingsToDesignTokens(settings);

      // Surface should be slightly different from background
      expect(tokens.surface).not.toBe(tokens.background);
      expect(tokens.surface).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    it("should derive border color from foreground", () => {
      const settings = parseThemeSettings("Dawn", DAWN_SETTINGS_DATA);
      const tokens = themeSettingsToDesignTokens(settings);

      // Border should be derived (rgba with low opacity)
      expect(tokens.border).toContain("rgba");
      expect(tokens.border).toContain("0.2");
    });
  });

  describe("designTokensToCSSVariables", () => {
    it("should convert design tokens to CSS custom properties", () => {
      const settings = parseThemeSettings("Dawn", DAWN_SETTINGS_DATA);
      const tokens = themeSettingsToDesignTokens(settings);
      const cssVars = designTokensToCSSVariables(tokens);

      expect(cssVars["--rb-background"]).toBe("#ffffff");
      expect(cssVars["--rb-foreground"]).toBe("#121212");
      expect(cssVars["--rb-primary"]).toBe("#121212");
      expect(cssVars["--rb-primary-foreground"]).toBe("#ffffff");
      expect(cssVars["--rb-radius"]).toBe("8px");
      expect(cssVars["--rb-popup-radius"]).toBe("16px");
      expect(cssVars["--rb-font-family"]).toContain("Montserrat");
    });

    it("should use --rb- prefix for all variables", () => {
      const settings = parseThemeSettings("Dawn", DAWN_SETTINGS_DATA);
      const tokens = themeSettingsToDesignTokens(settings);
      const cssVars = designTokensToCSSVariables(tokens);

      for (const key of Object.keys(cssVars)) {
        expect(key).toMatch(/^--rb-/);
      }
    });
  });
});

