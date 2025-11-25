import { describe, it, expect } from "vitest";
import { buildScopedCss } from "~/domains/storefront/shared/css";

describe("buildScopedCss", () => {
  it("returns empty string when both inputs are empty", () => {
    expect(buildScopedCss(undefined, undefined, "data-scope")).toBe("");
  });

  it("scopes selectors with the provided data attribute", () => {
    const result = buildScopedCss(".foo { color: red; }", ".bar, .baz { color: blue; }", "data-scope");
    expect(result).toContain("[data-scope] .foo");
    expect(result).toContain("[data-scope] .bar");
    expect(result).toContain("[data-scope] .baz");
  });

  it("preserves at-rules without scoping", () => {
    const result = buildScopedCss("@media (max-width: 600px) { .foo { color: red; } }", undefined, "data-scope");
    const normalized = result.replace(/\s+/g, " ").trim();
    expect(normalized).toBe("@media (max-width: 600px) { .foo { color: red; }}");
  });

  it("memoizes results when cacheKey is provided", () => {
    const first = buildScopedCss(".foo { color: red; }", ".bar { color: blue; }", "data-scope", "test-key");
    const second = buildScopedCss(".foo { color: red; }", ".bar { color: blue; }", "data-scope", "test-key");
    expect(second).toBe(first);
  });
});
