/**
 * Unit Tests for Color Utilities
 */

import { describe, it, expect } from "vitest";

import {
  isValidHexColor,
  validateColors,
  calculateContrastRatio,
  hexToRgb,
  getContrastingTextColor,
} from "~/shared/utils/color-utilities";

describe("isValidHexColor", () => {
  it("should return true for valid 6-digit hex colors", () => {
    expect(isValidHexColor("#FFFFFF")).toBe(true);
    expect(isValidHexColor("#000000")).toBe(true);
    expect(isValidHexColor("#ff5733")).toBe(true);
    expect(isValidHexColor("#ABC123")).toBe(true);
  });

  it("should return true for valid 3-digit hex colors", () => {
    expect(isValidHexColor("#FFF")).toBe(true);
    expect(isValidHexColor("#000")).toBe(true);
    expect(isValidHexColor("#abc")).toBe(true);
  });

  it("should return false for invalid colors", () => {
    expect(isValidHexColor("FFFFFF")).toBe(false); // Missing #
    expect(isValidHexColor("#GGGGGG")).toBe(false); // Invalid characters
    expect(isValidHexColor("#12345")).toBe(false); // Wrong length
    expect(isValidHexColor("red")).toBe(false); // Named color
    expect(isValidHexColor("rgb(255,0,0)")).toBe(false); // RGB format
  });
});

describe("hexToRgb", () => {
  it("should convert hex to RGB", () => {
    expect(hexToRgb("#FFFFFF")).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb("#000000")).toEqual({ r: 0, g: 0, b: 0 });
    expect(hexToRgb("#FF0000")).toEqual({ r: 255, g: 0, b: 0 });
    expect(hexToRgb("#00FF00")).toEqual({ r: 0, g: 255, b: 0 });
    expect(hexToRgb("#0000FF")).toEqual({ r: 0, g: 0, b: 255 });
  });

  it("should return null for invalid hex", () => {
    expect(hexToRgb("invalid")).toBeNull();
    expect(hexToRgb("#GGG")).toBeNull();
  });
});

describe("calculateContrastRatio", () => {
  it("should calculate contrast ratio between black and white", () => {
    const ratio = calculateContrastRatio("#000000", "#FFFFFF");
    expect(ratio).toBeCloseTo(21, 0); // Maximum contrast ratio
  });

  it("should return 1 for same colors", () => {
    const ratio = calculateContrastRatio("#FFFFFF", "#FFFFFF");
    expect(ratio).toBeCloseTo(1, 0);
  });

  it("should calculate contrast for colored pairs", () => {
    const ratio = calculateContrastRatio("#0000FF", "#FFFFFF");
    expect(ratio).toBeGreaterThan(1);
  });
});

describe("getContrastingTextColor", () => {
  it("should return dark text for light backgrounds", () => {
    expect(getContrastingTextColor("#FFFFFF")).toBe("#111827");
    expect(getContrastingTextColor("#EEEEEE")).toBe("#111827");
    expect(getContrastingTextColor("#FFFF00")).toBe("#111827"); // Yellow
  });

  it("should return white text for dark backgrounds", () => {
    expect(getContrastingTextColor("#000000")).toBe("#FFFFFF");
    expect(getContrastingTextColor("#333333")).toBe("#FFFFFF");
    expect(getContrastingTextColor("#0000FF")).toBe("#FFFFFF"); // Blue
  });

  it("should return white for invalid colors", () => {
    expect(getContrastingTextColor("invalid")).toBe("#FFFFFF");
  });
});

describe("validateColors", () => {
  it("should validate correct colors", () => {
    const result = validateColors({
      backgroundColor: "#FFFFFF",
      textColor: "#000000",
      buttonColor: "#0066CC",
      buttonTextColor: "#FFFFFF",
    });

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should report errors for invalid hex colors", () => {
    const result = validateColors({
      backgroundColor: "invalid",
      textColor: "#000000",
      buttonColor: "#0066CC",
      buttonTextColor: "#FFFFFF",
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("should warn about low contrast ratios", () => {
    const result = validateColors({
      backgroundColor: "#FFFFFF",
      textColor: "#EEEEEE", // Very low contrast
      buttonColor: "#0066CC",
      buttonTextColor: "#FFFFFF",
    });

    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain("Low contrast ratio");
  });

  it("should calculate contrast ratios", () => {
    const result = validateColors({
      backgroundColor: "#FFFFFF",
      textColor: "#000000",
      buttonColor: "#0066CC",
      buttonTextColor: "#FFFFFF",
    });

    expect(result.contrastRatios).toBeDefined();
    expect(result.contrastRatios!.textOnBackground).toBeGreaterThan(4.5);
    expect(result.contrastRatios!.buttonTextOnButton).toBeGreaterThan(4.5);
  });
});
