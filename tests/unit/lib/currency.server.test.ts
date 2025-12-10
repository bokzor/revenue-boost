/**
 * Unit Tests for Currency Service
 */

import { describe, it, expect, vi } from "vitest";

import { getStoreCurrency } from "~/lib/currency.server";

describe("getStoreCurrency", () => {
  it("should return currency code from shop", async () => {
    const mockAdmin = {
      graphql: vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ data: { shop: { currencyCode: "EUR" } } }),
      }),
    };

    const result = await getStoreCurrency(mockAdmin);
    expect(result).toBe("EUR");
    expect(mockAdmin.graphql).toHaveBeenCalledWith(expect.stringContaining("currencyCode"));
  });

  it("should return USD as fallback on error", async () => {
    const mockAdmin = {
      graphql: vi.fn().mockRejectedValue(new Error("API Error")),
    };

    const result = await getStoreCurrency(mockAdmin);
    expect(result).toBe("USD");
  });

  it("should handle null response gracefully", async () => {
    const mockAdmin = {
      graphql: vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ data: null }),
      }),
    };

    // This will throw when accessing data.shop.currencyCode
    const result = await getStoreCurrency(mockAdmin);
    expect(result).toBe("USD");
  });
});

