import { describe, it, expect } from "vitest";
import { formatCurrency } from "~/domains/storefront/popups-new/utils/utils";

/**
 * Unit tests for storefront popup utils - formatCurrency
 */

describe("formatCurrency", () => {
  it("formats amount with default USD when no currency is provided", () => {
    const result = formatCurrency(10);
    expect(result).toBe("$10.00");
  });

  it("formats amount with a valid ISO currency code", () => {
    const result = formatCurrency(10, "EUR");
    expect(result).toBe("€10.00");
  });

  it("maps '$' symbol to USD without throwing", () => {
    expect(() => formatCurrency(10, "$")).not.toThrow();
    const result = formatCurrency(10, "$");
    expect(result).toBe("$10.00");
  });

  it("maps '€' symbol to EUR without throwing", () => {
    expect(() => formatCurrency(10, "€")).not.toThrow();
    const result = formatCurrency(10, "€");
    expect(result).toBe("€10.00");
  });

  it("falls back gracefully for unknown currency strings", () => {
    // "???" is not a valid ISO code or known symbol, should not throw
    expect(() => formatCurrency(10, "???")).not.toThrow();

    const result = formatCurrency(10, "???");
    // We default to USD formatting, so result should still be a valid
    // currency string containing the numeric amount.
    expect(result).toBe("$10.00");
  });
});
