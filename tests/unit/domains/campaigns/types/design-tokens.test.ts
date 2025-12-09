/**
 * Unit Tests for Design Tokens
 */

import { describe, it, expect } from "vitest";

import {
  ThemeModeSchema,
  DesignTokensSchema,
  PresetDesignSchema,
  LayoutOptionsSchema,
  PRESET_DESIGNS,
  DEFAULT_DESIGN_TOKENS,
  getPresetDesign,
  getAllPresetIds,
  resolveDesignTokens,
  tokensToCSSString,
} from "~/domains/campaigns/types/design-tokens";

describe("ThemeModeSchema", () => {
  it("should validate valid theme modes", () => {
    expect(ThemeModeSchema.parse("default")).toBe("default");
    expect(ThemeModeSchema.parse("shopify")).toBe("shopify");
    expect(ThemeModeSchema.parse("preset")).toBe("preset");
    expect(ThemeModeSchema.parse("custom")).toBe("custom");
  });

  it("should reject invalid theme modes", () => {
    expect(() => ThemeModeSchema.parse("invalid")).toThrow();
  });
});

describe("DesignTokensSchema", () => {
  it("should apply defaults", () => {
    const result = DesignTokensSchema.parse({});
    expect(result.background).toBe("#ffffff");
    expect(result.foreground).toBe("#1a1a1a");
    expect(result.primary).toBe("#000000");
    expect(result.borderRadius).toBe(8);
    expect(result.popupBorderRadius).toBe(16);
  });

  it("should validate custom tokens", () => {
    const tokens = {
      background: "#000000",
      foreground: "#ffffff",
      primary: "#ff0000",
      borderRadius: 12,
    };
    const result = DesignTokensSchema.parse(tokens);
    expect(result.background).toBe("#000000");
    expect(result.borderRadius).toBe(12);
  });
});

describe("LayoutOptionsSchema", () => {
  it("should apply defaults", () => {
    const result = LayoutOptionsSchema.parse({});
    expect(result.position).toBe("center");
    expect(result.displayMode).toBe("popup");
    expect(result.animation).toBe("fade");
    expect(result.showCloseButton).toBe(true);
    expect(result.layout).toBe("centered");
  });

  it("should validate custom layout", () => {
    const layout = {
      position: "bottom",
      displayMode: "banner",
      animation: "slide",
    };
    const result = LayoutOptionsSchema.parse(layout);
    expect(result.position).toBe("bottom");
    expect(result.displayMode).toBe("banner");
  });
});

describe("PRESET_DESIGNS", () => {
  it("should have presets defined", () => {
    expect(Object.keys(PRESET_DESIGNS).length).toBeGreaterThan(0);
  });

  it("should have required properties on each preset", () => {
    for (const [id, preset] of Object.entries(PRESET_DESIGNS)) {
      expect(preset.presetId).toBe(id);
      expect(preset.presetName).toBeDefined();
      expect(preset.background).toBeDefined();
      expect(preset.foreground).toBeDefined();
      expect(preset.primary).toBeDefined();
    }
  });
});

describe("DEFAULT_DESIGN_TOKENS", () => {
  it("should have all required tokens", () => {
    expect(DEFAULT_DESIGN_TOKENS.background).toBeDefined();
    expect(DEFAULT_DESIGN_TOKENS.foreground).toBeDefined();
    expect(DEFAULT_DESIGN_TOKENS.primary).toBeDefined();
    expect(DEFAULT_DESIGN_TOKENS.fontFamily).toBeDefined();
  });
});

describe("getPresetDesign", () => {
  it("should return preset for valid ID", () => {
    const ids = getAllPresetIds();
    if (ids.length > 0) {
      const preset = getPresetDesign(ids[0]);
      expect(preset).toBeDefined();
      expect(preset?.presetId).toBe(ids[0]);
    }
  });

  it("should return undefined for invalid ID", () => {
    const preset = getPresetDesign("non-existent-preset");
    expect(preset).toBeUndefined();
  });
});

describe("getAllPresetIds", () => {
  it("should return array of preset IDs", () => {
    const ids = getAllPresetIds();
    expect(Array.isArray(ids)).toBe(true);
    expect(ids.length).toBeGreaterThan(0);
  });
});

describe("resolveDesignTokens", () => {
  it("should return defaults when no design provided", () => {
    const tokens = resolveDesignTokens(undefined);
    expect(tokens.background).toBe(DEFAULT_DESIGN_TOKENS.background);
  });

  it("should merge custom tokens", () => {
    const design = {
      themeMode: "custom" as const,
      tokens: { background: "#ff0000" },
    };
    const tokens = resolveDesignTokens(design);
    expect(tokens.background).toBe("#ff0000");
  });
});

describe("tokensToCSSString", () => {
  it("should generate CSS custom properties", () => {
    const css = tokensToCSSString(DEFAULT_DESIGN_TOKENS);
    expect(css).toContain("--rb-background:");
    expect(css).toContain("--rb-foreground:");
    expect(css).toContain("--rb-primary:");
    expect(css).toContain("--rb-radius:");
  });
});

