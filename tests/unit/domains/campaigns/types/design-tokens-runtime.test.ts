/**
 * Unit Tests for Design Tokens Runtime
 */

import { describe, it, expect } from "vitest";

import {
  DEFAULT_DESIGN_TOKENS,
  PRESET_DESIGNS,
  getPresetDesign,
  getAllPresetIds,
  deriveTokens,
  resolveDesignTokens,
  tokensToCSSString,
} from "~/domains/campaigns/types/design-tokens-runtime";

describe("DEFAULT_DESIGN_TOKENS", () => {
  it("should have all required tokens defined", () => {
    expect(DEFAULT_DESIGN_TOKENS.background).toBeDefined();
    expect(DEFAULT_DESIGN_TOKENS.foreground).toBeDefined();
    expect(DEFAULT_DESIGN_TOKENS.primary).toBeDefined();
    expect(DEFAULT_DESIGN_TOKENS.primaryForeground).toBeDefined();
    expect(DEFAULT_DESIGN_TOKENS.fontFamily).toBeDefined();
    expect(DEFAULT_DESIGN_TOKENS.borderRadius).toBeDefined();
    expect(DEFAULT_DESIGN_TOKENS.popupBorderRadius).toBeDefined();
  });
});

describe("PRESET_DESIGNS", () => {
  it("should have preset designs defined", () => {
    expect(Object.keys(PRESET_DESIGNS).length).toBeGreaterThan(0);
  });

  it("should have bold-energy preset", () => {
    expect(PRESET_DESIGNS["bold-energy"]).toBeDefined();
    expect(PRESET_DESIGNS["bold-energy"].presetName).toBe("Bold Energy");
  });

  it("should have black-friday preset", () => {
    expect(PRESET_DESIGNS["black-friday"]).toBeDefined();
    expect(PRESET_DESIGNS["black-friday"].presetName).toBe("Black Friday");
  });
});

describe("getPresetDesign", () => {
  it("should return preset for valid ID", () => {
    const preset = getPresetDesign("bold-energy");
    expect(preset).toBeDefined();
    expect(preset?.presetId).toBe("bold-energy");
  });

  it("should return undefined for invalid ID", () => {
    const preset = getPresetDesign("invalid-preset");
    expect(preset).toBeUndefined();
  });
});

describe("getAllPresetIds", () => {
  it("should return all preset IDs", () => {
    const ids = getAllPresetIds();
    expect(ids.length).toBeGreaterThan(0);
    expect(ids).toContain("bold-energy");
    expect(ids).toContain("black-friday");
  });
});

describe("deriveTokens", () => {
  it("should derive complete tokens from required tokens", () => {
    const tokens = deriveTokens({
      background: "#ffffff",
      foreground: "#000000",
      primary: "#3b82f6",
    });

    expect(tokens.background).toBe("#ffffff");
    expect(tokens.foreground).toBe("#000000");
    expect(tokens.primary).toBe("#3b82f6");
    expect(tokens.primaryForeground).toBeDefined();
    expect(tokens.muted).toBeDefined();
    expect(tokens.fontFamily).toBeDefined();
  });

  it("should apply overrides", () => {
    const tokens = deriveTokens(
      {
        background: "#ffffff",
        foreground: "#000000",
        primary: "#3b82f6",
      },
      { borderRadius: 16 }
    );

    expect(tokens.borderRadius).toBe(16);
  });

  it("should derive light theme colors for light background", () => {
    const tokens = deriveTokens({
      background: "#ffffff",
      foreground: "#000000",
      primary: "#3b82f6",
    });

    expect(tokens.muted).toContain("0, 0, 0");
  });

  it("should derive dark theme colors for dark background", () => {
    const tokens = deriveTokens({
      background: "#000000",
      foreground: "#ffffff",
      primary: "#3b82f6",
    });

    expect(tokens.muted).toContain("255, 255, 255");
  });
});

describe("resolveDesignTokens", () => {
  it("should return default tokens when no design provided", () => {
    const tokens = resolveDesignTokens(undefined);
    expect(tokens).toEqual(DEFAULT_DESIGN_TOKENS);
  });

  it("should use preset tokens when themeMode is preset", () => {
    const tokens = resolveDesignTokens({
      themeMode: "preset",
      presetId: "bold-energy",
    });

    expect(tokens.background).toBe(PRESET_DESIGNS["bold-energy"].background);
  });

  it("should use default tokens when themeMode is default", () => {
    const tokens = resolveDesignTokens({ themeMode: "default" });
    expect(tokens).toEqual(DEFAULT_DESIGN_TOKENS);
  });

  it("should merge custom token overrides", () => {
    const tokens = resolveDesignTokens({
      themeMode: "default",
      tokens: { borderRadius: 24 },
    });

    expect(tokens.borderRadius).toBe(24);
  });
});

describe("tokensToCSSString", () => {
  it("should generate CSS custom properties string", () => {
    const css = tokensToCSSString(DEFAULT_DESIGN_TOKENS);

    expect(css).toContain("--rb-background:");
    expect(css).toContain("--rb-foreground:");
    expect(css).toContain("--rb-primary:");
    expect(css).toContain("--rb-radius:");
    expect(css).toContain("--rb-font-family:");
  });
});

