/**
 * Unit Tests for Storefront URL Utilities
 *
 * Tests the URL manipulation and UTM parameter handling.
 */

import { describe, it, expect } from "vitest";

// Recreate the UTMParams interface
interface UTMParams {
  utmCampaign?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
}

// Recreate the addUTMParams helper
function addUTMParams(
  url: string | null | undefined,
  params: UTMParams
): string | null | undefined {
  if (!url || !params?.utmCampaign) return url;

  try {
    const urlObj = new URL(
      url,
      url.startsWith("http") ? undefined : "https://placeholder.local"
    );
    urlObj.searchParams.set("utm_campaign", params.utmCampaign);
    if (params.utmSource) urlObj.searchParams.set("utm_source", params.utmSource);
    if (params.utmMedium) urlObj.searchParams.set("utm_medium", params.utmMedium);

    if (!url.startsWith("http")) {
      return `${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
    }
    return urlObj.toString();
  } catch {
    return url;
  }
}

// Recreate the normalizePath helper
function normalizePath(path: string): string {
  return path.replace(/^\//, "");
}

// Recreate the buildUrl helper
function buildUrl(root: string, path: string, queryString?: string): string {
  const normalizedPath = normalizePath(path);
  const base = `${root}${normalizedPath}`;
  return queryString ? `${base}${queryString}` : base;
}

// Recreate the decorateUrlWithDiscount helper
function decorateUrlWithDiscount(url: string, discountCode?: string): string {
  if (!discountCode) return url;

  try {
    const urlObj = new URL(
      url,
      url.startsWith("http") ? undefined : "https://placeholder.local"
    );
    urlObj.searchParams.set("discount", discountCode);

    if (!url.startsWith("http")) {
      return `${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
    }
    return urlObj.toString();
  } catch {
    return url;
  }
}

describe("Storefront URL Utilities", () => {
  describe("addUTMParams", () => {
    it("should add UTM campaign parameter", () => {
      const result = addUTMParams("/products/test", { utmCampaign: "summer-sale" });
      expect(result).toContain("utm_campaign=summer-sale");
    });

    it("should add all UTM parameters", () => {
      const result = addUTMParams("/products/test", {
        utmCampaign: "summer-sale",
        utmSource: "popup",
        utmMedium: "email",
      });
      expect(result).toContain("utm_campaign=summer-sale");
      expect(result).toContain("utm_source=popup");
      expect(result).toContain("utm_medium=email");
    });

    it("should return original URL if no campaign", () => {
      const result = addUTMParams("/products/test", {});
      expect(result).toBe("/products/test");
    });

    it("should return null for null URL", () => {
      const result = addUTMParams(null, { utmCampaign: "test" });
      expect(result).toBeNull();
    });

    it("should handle absolute URLs", () => {
      const result = addUTMParams("https://example.com/products", { utmCampaign: "test" });
      expect(result).toBe("https://example.com/products?utm_campaign=test");
    });
  });

  describe("normalizePath", () => {
    it("should remove leading slash", () => {
      expect(normalizePath("/products")).toBe("products");
    });

    it("should not modify path without leading slash", () => {
      expect(normalizePath("products")).toBe("products");
    });

    it("should handle empty string", () => {
      expect(normalizePath("")).toBe("");
    });
  });

  describe("buildUrl", () => {
    it("should build URL from root and path", () => {
      const result = buildUrl("https://example.com/", "products");
      expect(result).toBe("https://example.com/products");
    });

    it("should include query string", () => {
      const result = buildUrl("https://example.com/", "products", "?id=123");
      expect(result).toBe("https://example.com/products?id=123");
    });

    it("should normalize path with leading slash", () => {
      const result = buildUrl("https://example.com/", "/products");
      expect(result).toBe("https://example.com/products");
    });
  });

  describe("decorateUrlWithDiscount", () => {
    it("should add discount parameter", () => {
      const result = decorateUrlWithDiscount("/checkout", "SAVE10");
      expect(result).toContain("discount=SAVE10");
    });

    it("should return original URL if no discount", () => {
      const result = decorateUrlWithDiscount("/checkout");
      expect(result).toBe("/checkout");
    });

    it("should handle absolute URLs", () => {
      const result = decorateUrlWithDiscount("https://example.com/checkout", "SAVE10");
      expect(result).toBe("https://example.com/checkout?discount=SAVE10");
    });
  });
});

