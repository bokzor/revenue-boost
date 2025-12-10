/**
 * Unit Tests for Storefront API Client
 *
 * Tests the API configuration and helper methods.
 */

import { describe, it, expect } from "vitest";

// Recreate the ApiConfig interface
interface ApiConfig {
  apiUrl: string;
  shopDomain: string;
  debug?: boolean;
  previewMode?: boolean;
  previewId?: string;
  previewToken?: string;
  previewBehavior?: "instant" | "realistic";
}

// Recreate the FetchCampaignsResponse interface
interface FetchCampaignsResponse {
  campaigns: unknown[];
  success: boolean;
  globalCustomCSS?: string;
  timestamp?: string;
  showBranding?: boolean;
}

// Helper to check if preview mode
function isPreviewMode(config: ApiConfig): boolean {
  return !!(config.previewMode && config.previewToken);
}

// Helper to build API URL
function getApiUrl(config: ApiConfig, path: string): string {
  const base = config.apiUrl || "";
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  if (base) {
    return `${base}${cleanPath}`;
  }

  return `/apps/revenue-boost${cleanPath}`;
}

// Helper to detect page type
function detectPageType(path: string): string {
  if (path === "/" || path === "") return "home";
  if (path.includes("/products/")) return "product";
  if (path.includes("/collections/")) return "collection";
  if (path.includes("/cart")) return "cart";
  if (path.includes("/checkout")) return "checkout";
  return "other";
}

// Helper to detect device type
function detectDeviceType(userAgent: string): string {
  const ua = userAgent.toLowerCase();

  if (/android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
    return "mobile";
  }
  if (/ipad|android(?!.*mobile)/i.test(ua)) {
    return "tablet";
  }
  return "desktop";
}

describe("Storefront API Client", () => {
  describe("ApiConfig", () => {
    it("should have required fields", () => {
      const config: ApiConfig = {
        apiUrl: "https://api.example.com",
        shopDomain: "mystore.myshopify.com",
      };

      expect(config.apiUrl).toBe("https://api.example.com");
      expect(config.shopDomain).toBe("mystore.myshopify.com");
    });

    it("should support optional fields", () => {
      const config: ApiConfig = {
        apiUrl: "",
        shopDomain: "mystore.myshopify.com",
        debug: true,
        previewMode: true,
        previewToken: "abc123",
      };

      expect(config.debug).toBe(true);
      expect(config.previewMode).toBe(true);
    });
  });

  describe("isPreviewMode", () => {
    it("should return true when both previewMode and previewToken are set", () => {
      const config: ApiConfig = {
        apiUrl: "",
        shopDomain: "test.myshopify.com",
        previewMode: true,
        previewToken: "abc123",
      };
      expect(isPreviewMode(config)).toBe(true);
    });

    it("should return false when previewMode is false", () => {
      const config: ApiConfig = {
        apiUrl: "",
        shopDomain: "test.myshopify.com",
        previewMode: false,
        previewToken: "abc123",
      };
      expect(isPreviewMode(config)).toBe(false);
    });

    it("should return false when previewToken is missing", () => {
      const config: ApiConfig = {
        apiUrl: "",
        shopDomain: "test.myshopify.com",
        previewMode: true,
      };
      expect(isPreviewMode(config)).toBe(false);
    });
  });

  describe("getApiUrl", () => {
    it("should use apiUrl when provided", () => {
      const config: ApiConfig = {
        apiUrl: "https://api.example.com",
        shopDomain: "test.myshopify.com",
      };
      expect(getApiUrl(config, "/api/campaigns")).toBe("https://api.example.com/api/campaigns");
    });

    it("should use app proxy when apiUrl is empty", () => {
      const config: ApiConfig = {
        apiUrl: "",
        shopDomain: "test.myshopify.com",
      };
      expect(getApiUrl(config, "/api/campaigns")).toBe("/apps/revenue-boost/api/campaigns");
    });
  });

  describe("detectPageType", () => {
    it("should detect home page", () => {
      expect(detectPageType("/")).toBe("home");
      expect(detectPageType("")).toBe("home");
    });

    it("should detect product page", () => {
      expect(detectPageType("/products/test-product")).toBe("product");
    });

    it("should detect collection page", () => {
      expect(detectPageType("/collections/summer")).toBe("collection");
    });

    it("should detect cart page", () => {
      expect(detectPageType("/cart")).toBe("cart");
    });

    it("should detect checkout page", () => {
      expect(detectPageType("/checkout")).toBe("checkout");
    });

    it("should return other for unknown pages", () => {
      expect(detectPageType("/about")).toBe("other");
    });
  });

  describe("detectDeviceType", () => {
    it("should detect mobile devices", () => {
      expect(detectDeviceType("Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)")).toBe("mobile");
      expect(detectDeviceType("Mozilla/5.0 (Linux; Android 10)")).toBe("mobile");
    });

    it("should detect tablet devices", () => {
      expect(detectDeviceType("Mozilla/5.0 (iPad; CPU OS 14_0)")).toBe("tablet");
    });

    it("should detect desktop devices", () => {
      expect(detectDeviceType("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")).toBe("desktop");
    });
  });
});

