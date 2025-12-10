/**
 * Unit Tests for CSS Guards
 */

import { describe, it, expect } from "vitest";

import {
  CUSTOM_CSS_MAX_LENGTH,
  CustomCssSchema,
  validateCustomCss,
} from "~/lib/css-guards";

describe("CUSTOM_CSS_MAX_LENGTH", () => {
  it("should be 30000 characters", () => {
    expect(CUSTOM_CSS_MAX_LENGTH).toBe(30000);
  });
});

describe("CustomCssSchema", () => {
  it("should accept valid CSS", () => {
    const result = CustomCssSchema.safeParse(".popup { color: red; }");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(".popup { color: red; }");
    }
  });

  it("should trim whitespace", () => {
    const result = CustomCssSchema.safeParse("  .popup { color: red; }  ");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(".popup { color: red; }");
    }
  });

  it("should reject CSS with script tags", () => {
    const result = CustomCssSchema.safeParse("<script>alert('xss')</script>");
    expect(result.success).toBe(false);
  });

  it("should reject CSS with javascript: imports", () => {
    const result = CustomCssSchema.safeParse("@import url('javascript:alert(1)')");
    expect(result.success).toBe(false);
  });

  it("should reject CSS exceeding max length", () => {
    const longCss = "a".repeat(CUSTOM_CSS_MAX_LENGTH + 1);
    const result = CustomCssSchema.safeParse(longCss);
    expect(result.success).toBe(false);
  });
});

describe("validateCustomCss", () => {
  it("should return undefined for null/undefined", () => {
    expect(validateCustomCss(null)).toBeUndefined();
    expect(validateCustomCss(undefined)).toBeUndefined();
  });

  it("should return undefined for empty string", () => {
    expect(validateCustomCss("")).toBeUndefined();
    expect(validateCustomCss("   ")).toBeUndefined();
  });

  it("should return validated CSS for valid input", () => {
    expect(validateCustomCss(".popup { color: red; }")).toBe(".popup { color: red; }");
  });

  it("should throw for non-string input", () => {
    expect(() => validateCustomCss(123)).toThrow("must be a string");
    expect(() => validateCustomCss({})).toThrow("must be a string");
  });

  it("should throw for script tags", () => {
    expect(() => validateCustomCss("<script>")).toThrow();
  });

  it("should use custom field name in error", () => {
    expect(() => validateCustomCss(123, "myField")).toThrow("myField must be a string");
  });
});

