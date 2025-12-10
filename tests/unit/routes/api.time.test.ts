/**
 * Unit Tests for Time API Route
 *
 * Tests the time synchronization endpoint used by countdown timers.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock ShopService
vi.mock("~/domains/shops/services/shop.server", () => ({
  ShopService: {
    getTimezoneByShopDomain: vi.fn().mockResolvedValue("America/New_York"),
  },
}));

import { loader, options } from "~/routes/api.time";
import { ShopService } from "~/domains/shops/services/shop.server";

describe("api.time", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loader", () => {
    it("should return server time in ISO format", async () => {
      const request = new Request("http://localhost/api/time?shop=test.myshopify.com");

      const response = await loader({ request, params: {}, context: {} });
      const data = await response.json();

      expect(data.serverTimeISO).toBeDefined();
      expect(data.serverTimeISO).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it("should return server time as Unix timestamp", async () => {
      const request = new Request("http://localhost/api/time?shop=test.myshopify.com");

      const response = await loader({ request, params: {}, context: {} });
      const data = await response.json();

      expect(data.serverTimeUnix).toBeDefined();
      expect(typeof data.serverTimeUnix).toBe("number");
      expect(data.serverTimeUnix).toBeGreaterThan(0);
    });

    it("should return shop timezone when shop domain provided", async () => {
      // Use unique shop domain to avoid cache
      const request = new Request("http://localhost/api/time?shop=unique-shop-1.myshopify.com");

      const response = await loader({ request, params: {}, context: {} });
      const data = await response.json();

      expect(data.shopTimezone).toBe("America/New_York");
      expect(ShopService.getTimezoneByShopDomain).toHaveBeenCalledWith("unique-shop-1.myshopify.com");
    });

    it("should default to UTC when no shop domain provided", async () => {
      const request = new Request("http://localhost/api/time");

      const response = await loader({ request, params: {}, context: {} });
      const data = await response.json();

      expect(data.shopTimezone).toBe("UTC");
    });

    it("should accept shopDomain as alternative parameter", async () => {
      // Use unique shop domain to avoid cache
      const request = new Request("http://localhost/api/time?shopDomain=unique-shop-2.myshopify.com");

      const response = await loader({ request, params: {}, context: {} });
      const data = await response.json();

      expect(ShopService.getTimezoneByShopDomain).toHaveBeenCalledWith("unique-shop-2.myshopify.com");
    });

    it("should set CORS headers for cross-origin requests", async () => {
      const request = new Request("http://localhost/api/time?shop=test.myshopify.com");

      const response = await loader({ request, params: {}, context: {} });

      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    });

    it("should set cache control headers", async () => {
      const request = new Request("http://localhost/api/time?shop=test.myshopify.com");

      const response = await loader({ request, params: {}, context: {} });

      expect(response.headers.get("Cache-Control")).toBe("public, max-age=5");
    });

    it("should return JSON content type", async () => {
      const request = new Request("http://localhost/api/time?shop=test.myshopify.com");

      const response = await loader({ request, params: {}, context: {} });

      expect(response.headers.get("Content-Type")).toBe("application/json");
    });
  });

  describe("options", () => {
    it("should return CORS preflight headers", async () => {
      const response = await options();

      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
      expect(response.headers.get("Access-Control-Allow-Methods")).toBe("GET, OPTIONS");
      expect(response.headers.get("Access-Control-Allow-Headers")).toBe("Content-Type");
    });

    it("should return empty body", async () => {
      const response = await options();
      const body = await response.text();

      expect(body).toBe("");
    });
  });
});

