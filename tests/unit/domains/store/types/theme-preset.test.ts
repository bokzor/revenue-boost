/**
 * Unit Tests for Theme Preset Types
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  ThemePresetInputSchema,
  ThemePresetsArraySchema,
  expandThemePreset,
  createEmptyThemePreset,
  parseThemePreset,
  parseThemePresets,
  getWheelColorsFromPreset,
} from "~/domains/store/types/theme-preset";

describe("ThemePresetInputSchema", () => {
  it("should validate valid preset", () => {
    const result = ThemePresetInputSchema.safeParse({
      id: "preset-1",
      name: "My Theme",
      backgroundColor: "#FFFFFF",
      textColor: "#111827",
      brandColor: "#3B82F6",
    });

    expect(result.success).toBe(true);
  });

  it("should reject invalid hex colors", () => {
    const result = ThemePresetInputSchema.safeParse({
      id: "preset-1",
      name: "My Theme",
      backgroundColor: "#FFFFFF",
      textColor: "invalid",
      brandColor: "#3B82F6",
    });

    expect(result.success).toBe(false);
  });

  it("should reject empty name", () => {
    const result = ThemePresetInputSchema.safeParse({
      id: "preset-1",
      name: "",
      backgroundColor: "#FFFFFF",
      textColor: "#111827",
      brandColor: "#3B82F6",
    });

    expect(result.success).toBe(false);
  });

  it("should allow optional fields", () => {
    const result = ThemePresetInputSchema.safeParse({
      id: "preset-1",
      name: "My Theme",
      backgroundColor: "#FFFFFF",
      textColor: "#111827",
      brandColor: "#3B82F6",
      // Optional fields not provided
    });

    expect(result.success).toBe(true);
  });
});

describe("expandThemePreset", () => {
  it("should expand preset to full design config", () => {
    const preset = {
      id: "preset-1",
      name: "My Theme",
      isDefault: false,
      backgroundColor: "#FFFFFF",
      textColor: "#111827",
      brandColor: "#3B82F6",
    };

    const config = expandThemePreset(preset);

    expect(config.backgroundColor).toBe("#FFFFFF");
    expect(config.textColor).toBe("#111827");
    expect(config.buttonColor).toBe("#3B82F6");
    expect(config.accentColor).toBe("#3B82F6");
  });

  it("should auto-compute button text color", () => {
    const preset = {
      id: "preset-1",
      name: "Dark Button",
      isDefault: false,
      backgroundColor: "#FFFFFF",
      textColor: "#111827",
      brandColor: "#000000", // Dark button
    };

    const config = expandThemePreset(preset);

    expect(config.buttonTextColor).toBe("#FFFFFF"); // White text on dark button
  });

  it("should use provided primaryForegroundColor", () => {
    const preset = {
      id: "preset-1",
      name: "Custom Button Text",
      isDefault: false,
      backgroundColor: "#FFFFFF",
      textColor: "#111827",
      brandColor: "#3B82F6",
      primaryForegroundColor: "#FFFF00",
    };

    const config = expandThemePreset(preset);

    expect(config.buttonTextColor).toBe("#FFFF00");
  });
});

describe("createEmptyThemePreset", () => {
  it("should create preset with defaults", () => {
    const preset = createEmptyThemePreset();

    expect(preset.id).toBeDefined();
    expect(preset.name).toBe("");
    expect(preset.backgroundColor).toBe("#FFFFFF");
    expect(preset.textColor).toBe("#111827");
    expect(preset.brandColor).toBe("#3B82F6");
  });

  it("should apply overrides", () => {
    const preset = createEmptyThemePreset({
      name: "Custom Theme",
      brandColor: "#FF0000",
    });

    expect(preset.name).toBe("Custom Theme");
    expect(preset.brandColor).toBe("#FF0000");
  });
});

describe("parseThemePreset", () => {
  it("should return parsed preset for valid data", () => {
    const result = parseThemePreset({
      id: "preset-1",
      name: "My Theme",
      backgroundColor: "#FFFFFF",
      textColor: "#111827",
      brandColor: "#3B82F6",
    });

    expect(result).not.toBeNull();
    expect(result?.name).toBe("My Theme");
  });

  it("should return null for invalid data", () => {
    const result = parseThemePreset({ invalid: "data" });
    expect(result).toBeNull();
  });
});

describe("parseThemePresets", () => {
  it("should return parsed array for valid data", () => {
    const result = parseThemePresets([
      { id: "1", name: "Theme 1", backgroundColor: "#FFF", textColor: "#000000", brandColor: "#3B82F6" },
    ]);

    expect(result).toHaveLength(1);
  });

  it("should return empty array for invalid data", () => {
    const result = parseThemePresets("invalid");
    expect(result).toEqual([]);
  });
});
