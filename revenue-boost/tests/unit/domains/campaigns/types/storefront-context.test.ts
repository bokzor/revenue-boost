/**
 * Storefront Context Tests
 */

import { describe, it, expect } from "vitest";
import {
  buildStorefrontContext,
  validateStorefrontContext,
  type StorefrontContext,
} from "~/domains/campaigns/types/storefront-context";

describe("StorefrontContext", () => {
  describe("buildStorefrontContext", () => {
    it("should build context from URL params and headers", () => {
      const searchParams = new URLSearchParams({
        pageUrl: "/products/example",
        pageType: "product",
        customerId: "123",
        sessionId: "abc",
        cartValue: "99.99",
        cartItemCount: "3",
      });

      const headers = new Headers({
        "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)",
      });

      const context = buildStorefrontContext(searchParams, headers);

      expect(context.pageUrl).toBe("/products/example");
      expect(context.pageType).toBe("product");
      expect(context.customerId).toBe("123");
      expect(context.sessionId).toBe("abc");
      expect(context.cartValue).toBe(99.99);
      expect(context.cartItemCount).toBe(3);
      expect(context.deviceType).toBe("mobile");
    });

    it("should handle missing optional params", () => {
      const searchParams = new URLSearchParams();
      const headers = new Headers();

      const context = buildStorefrontContext(searchParams, headers);

      expect(context.pageUrl).toBeUndefined();
      expect(context.customerId).toBeUndefined();
      expect(context.cartValue).toBeUndefined();
    });

    it("should parse customer tags from comma-separated string", () => {
      const searchParams = new URLSearchParams({
        customerTags: "vip,subscriber,wholesale",
      });
      const headers = new Headers();

      const context = buildStorefrontContext(searchParams, headers);

      expect(context.customerTags).toEqual(["vip", "subscriber", "wholesale"]);
    });

    it("should detect mobile device", () => {
      const searchParams = new URLSearchParams();
      const headers = new Headers({
        "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)",
      });

      const context = buildStorefrontContext(searchParams, headers);

      expect(context.deviceType).toBe("mobile");
    });

    it("should detect tablet device", () => {
      const searchParams = new URLSearchParams();
      const headers = new Headers({
        "user-agent": "Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)",
      });

      const context = buildStorefrontContext(searchParams, headers);

      expect(context.deviceType).toBe("tablet");
    });

    it("should detect desktop device", () => {
      const searchParams = new URLSearchParams();
      const headers = new Headers({
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      });

      const context = buildStorefrontContext(searchParams, headers);

      expect(context.deviceType).toBe("desktop");
    });

    it("should include timestamp", () => {
      const searchParams = new URLSearchParams();
      const headers = new Headers();

      const before = Date.now();
      const context = buildStorefrontContext(searchParams, headers);
      const after = Date.now();

      expect(context.timestamp).toBeGreaterThanOrEqual(before);
      expect(context.timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe("validateStorefrontContext", () => {
    it("should validate valid context", () => {
      const validContext: StorefrontContext = {
        pageUrl: "/products/example",
        pageType: "product",
        customerId: "123",
        sessionId: "abc",
        cartValue: 99.99,
        deviceType: "mobile",
      };

      expect(() => validateStorefrontContext(validContext)).not.toThrow();
    });

    it("should reject invalid email", () => {
      const invalidContext = {
        customerEmail: "not-an-email",
      };

      expect(() => validateStorefrontContext(invalidContext)).toThrow();
    });

    it("should reject negative cart value", () => {
      const invalidContext = {
        cartValue: -10,
      };

      expect(() => validateStorefrontContext(invalidContext)).toThrow();
    });

    it("should reject invalid device type", () => {
      const invalidContext = {
        deviceType: "smartwatch",
      };

      expect(() => validateStorefrontContext(invalidContext)).toThrow();
    });

    it("should allow empty context", () => {
      const emptyContext = {};

      expect(() => validateStorefrontContext(emptyContext)).not.toThrow();
    });
  });
});

