/**
 * Unit Tests for CSS Utilities
 */

import { describe, it, expect } from "vitest";

import { buildScopedCss } from "~/domains/storefront/shared/css";

describe("buildScopedCss", () => {
  it("should return empty string for empty input", () => {
    expect(buildScopedCss(undefined, undefined, "data-scope")).toBe("");
    expect(buildScopedCss("", "", "data-scope")).toBe("");
    expect(buildScopedCss("   ", "   ", "data-scope")).toBe("");
  });

  it("should scope simple CSS selectors", () => {
    const css = ".button { color: red }";
    const result = buildScopedCss(css, undefined, "data-popup");

    expect(result).toContain("[data-popup]");
    expect(result).toContain(".button");
    expect(result).toContain("color: red");
  });

  it("should scope multiple selectors", () => {
    const css = ".button, .link { color: blue }";
    const result = buildScopedCss(css, undefined, "data-popup");

    expect(result).toContain("[data-popup] .button");
    expect(result).toContain("[data-popup] .link");
  });

  it("should combine global and campaign CSS", () => {
    const globalCss = ".global { color: red }";
    const campaignCss = ".campaign { color: blue }";
    const result = buildScopedCss(globalCss, campaignCss, "data-popup");

    expect(result).toContain("[data-popup] .global");
    expect(result).toContain("[data-popup] .campaign");
  });

  it("should not scope @ rules", () => {
    const css = "@keyframes fade { from { opacity: 0 } to { opacity: 1 } }";
    const result = buildScopedCss(css, undefined, "data-popup");

    expect(result).toContain("@keyframes");
  });

  it("should cache results with cache key", () => {
    const css = ".test { color: green }";
    const result1 = buildScopedCss(css, undefined, "data-popup", "cache-key-1");
    const result2 = buildScopedCss(css, undefined, "data-popup", "cache-key-1");

    expect(result1).toBe(result2);
  });

  it("should handle multiple CSS blocks", () => {
    const css = ".a { color: red } .b { color: blue } .c { color: green }";
    const result = buildScopedCss(css, undefined, "data-popup");

    expect(result).toContain("[data-popup] .a");
    expect(result).toContain("[data-popup] .b");
    expect(result).toContain("[data-popup] .c");
  });

  it("should handle nested braces in CSS", () => {
    const css = ".container { display: flex } .item { flex: 1 }";
    const result = buildScopedCss(css, undefined, "data-popup");

    expect(result).toContain("[data-popup] .container");
    expect(result).toContain("[data-popup] .item");
  });
});

