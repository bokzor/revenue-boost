/**
 * Unit Tests for Color Customization Types
 */

import { describe, it, expect } from "vitest";

import type {
  ColorConfig,
  ExtendedColorConfig,
  BrandColorConfig,
  ColorTheme,
  ColorHarmony,
  ColorValidationResult,
  ContrastCheckResult,
  AccessibilityLevel,
} from "~/domains/popups/color-customization.types";

describe("ColorConfig", () => {
  it("should support base color configuration", () => {
    const config: ColorConfig = {
      backgroundColor: "#FFFFFF",
      textColor: "#000000",
      buttonColor: "#3B82F6",
      buttonTextColor: "#FFFFFF",
    };

    expect(config.backgroundColor).toBe("#FFFFFF");
    expect(config.textColor).toBe("#000000");
  });

  it("should support optional accent color", () => {
    const config: ColorConfig = {
      backgroundColor: "#FFFFFF",
      textColor: "#000000",
      buttonColor: "#3B82F6",
      buttonTextColor: "#FFFFFF",
      accentColor: "#FF0000",
    };

    expect(config.accentColor).toBe("#FF0000");
  });
});

describe("ExtendedColorConfig", () => {
  it("should extend base config with additional properties", () => {
    const config: ExtendedColorConfig = {
      backgroundColor: "#FFFFFF",
      textColor: "#000000",
      buttonColor: "#3B82F6",
      buttonTextColor: "#FFFFFF",
      overlayColor: "#000000",
      overlayOpacity: 0.5,
      borderColor: "#E5E7EB",
      successColor: "#10B981",
      errorColor: "#EF4444",
    };

    expect(config.overlayOpacity).toBe(0.5);
    expect(config.successColor).toBe("#10B981");
  });

  it("should support template-specific colors", () => {
    const config: ExtendedColorConfig = {
      backgroundColor: "#FFFFFF",
      textColor: "#000000",
      buttonColor: "#3B82F6",
      buttonTextColor: "#FFFFFF",
      urgencyTextColor: "#EF4444",
      highlightTextColor: "#F59E0B",
      progressBarColor: "#10B981",
    };

    expect(config.urgencyTextColor).toBe("#EF4444");
    expect(config.progressBarColor).toBe("#10B981");
  });
});

describe("ColorTheme", () => {
  it("should support expected themes", () => {
    const themes: ColorTheme[] = [
      "light",
      "dark",
      "vibrant",
      "minimal",
      "elegant",
      "playful",
      "professional",
      "custom",
    ];

    expect(themes).toHaveLength(8);
    expect(themes).toContain("dark");
    expect(themes).toContain("custom");
  });
});

describe("ColorHarmony", () => {
  it("should support expected harmonies", () => {
    const harmonies: ColorHarmony[] = [
      "complementary",
      "analogous",
      "triadic",
      "split-complementary",
      "tetradic",
      "monochromatic",
    ];

    expect(harmonies).toHaveLength(6);
    expect(harmonies).toContain("complementary");
    expect(harmonies).toContain("triadic");
  });
});

describe("ColorValidationResult", () => {
  it("should support validation result structure", () => {
    const result: ColorValidationResult = {
      isValid: true,
      errors: [],
      warnings: ["Low contrast on button"],
      contrastRatios: {
        textOnBackground: 7.5,
        buttonTextOnButton: 4.5,
      },
    };

    expect(result.isValid).toBe(true);
    expect(result.warnings).toHaveLength(1);
    expect(result.contrastRatios?.textOnBackground).toBe(7.5);
  });
});

describe("ContrastCheckResult", () => {
  it("should support contrast check result", () => {
    const result: ContrastCheckResult = {
      ratio: 7.5,
      passesAA: true,
      passesAAA: true,
      level: "AAA",
    };

    expect(result.ratio).toBe(7.5);
    expect(result.passesAAA).toBe(true);
    expect(result.level).toBe("AAA");
  });

  it("should support fail level", () => {
    const result: ContrastCheckResult = {
      ratio: 2.0,
      passesAA: false,
      passesAAA: false,
      level: "fail",
    };

    expect(result.level).toBe("fail");
  });
});

