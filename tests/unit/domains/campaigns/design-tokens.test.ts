/**
 * Unit tests for design-tokens.ts
 *
 * Tests the simplified 12-token design system for popup styling.
 */

import { describe, it, expect } from "vitest";
import {
  resolveDesignTokens,
  tokensToCSSString,
  getPresetDesign,
  getAllPresetIds,
  DEFAULT_DESIGN_TOKENS,
  type CampaignDesignInput,
  type DesignTokens,
} from "~/domains/campaigns/types/design-tokens";

// =============================================================================
// MOCK DATA
// =============================================================================

const MOCK_SHOPIFY_TOKENS: Partial<DesignTokens> = {
  background: "#fafafa",
  foreground: "#333333",
  primary: "#0066cc",
  primaryForeground: "#ffffff",
  fontFamily: "'Open Sans', sans-serif",
  borderRadius: 12,
  popupBorderRadius: 20,
};

// =============================================================================
// TESTS: resolveDesignTokens
// =============================================================================

describe("resolveDesignTokens", () => {
  describe("when design is undefined", () => {
    it("should return default tokens when no shopifyTokens provided", () => {
      const tokens = resolveDesignTokens(undefined);
      expect(tokens).toEqual(DEFAULT_DESIGN_TOKENS);
    });

    it("should merge shopifyTokens with defaults", () => {
      const tokens = resolveDesignTokens(undefined, MOCK_SHOPIFY_TOKENS);

      expect(tokens.background).toBe("#fafafa");
      expect(tokens.primary).toBe("#0066cc");
      expect(tokens.fontFamily).toBe("'Open Sans', sans-serif");
      // Should retain defaults for unset values
      expect(tokens.success).toBe(DEFAULT_DESIGN_TOKENS.success);
    });
  });

  describe("themeMode: shopify", () => {
    it("should use shopifyTokens when provided", () => {
      const design: CampaignDesignInput = { themeMode: "shopify" };
      const tokens = resolveDesignTokens(design, MOCK_SHOPIFY_TOKENS);

      expect(tokens.background).toBe("#fafafa");
      expect(tokens.foreground).toBe("#333333");
      expect(tokens.primary).toBe("#0066cc");
      expect(tokens.borderRadius).toBe(12);
    });

    it("should fall back to defaults when no shopifyTokens", () => {
      const design: CampaignDesignInput = { themeMode: "shopify" };
      const tokens = resolveDesignTokens(design);

      expect(tokens).toEqual(DEFAULT_DESIGN_TOKENS);
    });

    it("should allow custom token overrides", () => {
      const design: CampaignDesignInput = {
        themeMode: "shopify",
        tokens: { primary: "#ff0000" },
      };
      const tokens = resolveDesignTokens(design, MOCK_SHOPIFY_TOKENS);

      expect(tokens.background).toBe("#fafafa"); // From shopify
      expect(tokens.primary).toBe("#ff0000"); // Override
    });
  });

  describe("themeMode: preset", () => {
    it("should use preset tokens when presetId is valid", () => {
      const design: CampaignDesignInput = {
        themeMode: "preset",
        presetId: "bold-energy",
      };
      const tokens = resolveDesignTokens(design);

      expect(tokens.background).toBe("#1a1a2e");
      expect(tokens.foreground).toBe("#ffffff");
      expect(tokens.primary).toBe("#ff6b35");
    });

    it("should use Black Friday preset tokens", () => {
      const design: CampaignDesignInput = {
        themeMode: "preset",
        presetId: "black-friday",
      };
      const tokens = resolveDesignTokens(design);

      expect(tokens.background).toBe("#000000");
      expect(tokens.foreground).toBe("#ffffff");
      expect(tokens.primary).toBe("#ff0000");
      expect(tokens.fontFamily).toBe("'Bebas Neue', sans-serif");
    });

    it("should fall back to defaults for invalid presetId", () => {
      const design: CampaignDesignInput = {
        themeMode: "preset",
        presetId: "non-existent-preset",
      };
      const tokens = resolveDesignTokens(design);

      expect(tokens).toEqual(DEFAULT_DESIGN_TOKENS);
    });

    it("should allow custom token overrides on preset", () => {
      const design: CampaignDesignInput = {
        themeMode: "preset",
        presetId: "bold-energy",
        tokens: { primary: "#00ff00" },
      };
      const tokens = resolveDesignTokens(design);

      expect(tokens.background).toBe("#1a1a2e"); // From preset
      expect(tokens.primary).toBe("#00ff00"); // Override
    });
  });

  describe("themeMode: custom", () => {
    it("should start with defaults", () => {
      const design: CampaignDesignInput = { themeMode: "custom" };
      const tokens = resolveDesignTokens(design);

      expect(tokens).toEqual(DEFAULT_DESIGN_TOKENS);
    });

    it("should apply custom tokens as overrides", () => {
      const design: CampaignDesignInput = {
        themeMode: "custom",
        tokens: {
          background: "#222222",
          foreground: "#eeeeee",
          primary: "#ff5500",
          borderRadius: 20,
        },
      };
      const tokens = resolveDesignTokens(design);

      expect(tokens.background).toBe("#222222");
      expect(tokens.foreground).toBe("#eeeeee");
      expect(tokens.primary).toBe("#ff5500");
      expect(tokens.borderRadius).toBe(20);
      // Defaults for unset values
      expect(tokens.success).toBe(DEFAULT_DESIGN_TOKENS.success);
    });
  });
});

// =============================================================================
// TESTS: tokensToCSSString
// =============================================================================

describe("tokensToCSSString", () => {
  it("should generate CSS custom properties string", () => {
    const cssString = tokensToCSSString(DEFAULT_DESIGN_TOKENS);

    expect(cssString).toContain("--rb-background: #ffffff");
    expect(cssString).toContain("--rb-foreground: #1a1a1a");
    expect(cssString).toContain("--rb-primary: #000000");
    expect(cssString).toContain("--rb-primary-foreground: #ffffff");
    expect(cssString).toContain("--rb-success: #10B981");
    expect(cssString).toContain("--rb-radius: 8px");
    expect(cssString).toContain("--rb-popup-radius: 16px");
  });

  it("should include font-family", () => {
    const cssString = tokensToCSSString(DEFAULT_DESIGN_TOKENS);

    expect(cssString).toContain("--rb-font-family:");
    expect(cssString).toContain("system-ui");
  });

  it("should use muted fallback when undefined", () => {
    const tokens: DesignTokens = {
      ...DEFAULT_DESIGN_TOKENS,
      muted: undefined,
    };
    const cssString = tokensToCSSString(tokens);

    expect(cssString).toContain("--rb-muted: rgba(0, 0, 0, 0.6)");
  });

  it("should use surface fallback to background when undefined", () => {
    const tokens: DesignTokens = {
      ...DEFAULT_DESIGN_TOKENS,
      background: "#ff0000",
      surface: undefined,
    };
    const cssString = tokensToCSSString(tokens);

    expect(cssString).toContain("--rb-surface: #ff0000");
  });

  it("should include headingFontFamily fallback", () => {
    const tokens: DesignTokens = {
      ...DEFAULT_DESIGN_TOKENS,
      fontFamily: "'Roboto', sans-serif",
      headingFontFamily: undefined,
    };
    const cssString = tokensToCSSString(tokens);

    expect(cssString).toContain("--rb-heading-font-family: 'Roboto', sans-serif");
  });
});

// =============================================================================
// TESTS: Preset utilities
// =============================================================================

describe("getPresetDesign", () => {
  it("should return preset for valid ID", () => {
    const preset = getPresetDesign("bold-energy");

    expect(preset).toBeDefined();
    expect(preset?.presetId).toBe("bold-energy");
    expect(preset?.presetName).toBe("Bold Energy");
  });

  it("should return undefined for invalid ID", () => {
    const preset = getPresetDesign("non-existent");

    expect(preset).toBeUndefined();
  });
});

describe("getAllPresetIds", () => {
  it("should return array of preset IDs", () => {
    const ids = getAllPresetIds();

    expect(Array.isArray(ids)).toBe(true);
    expect(ids.length).toBeGreaterThan(0);
    expect(ids).toContain("bold-energy");
    expect(ids).toContain("black-friday");
  });
});

