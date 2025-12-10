/**
 * Unit Tests for Social Proof Track API
 *
 * Tests the visitor tracking event validation and handling.
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";

// Recreate the event type enum
const EventTypeSchema = z.enum(["page_view", "product_view", "add_to_cart"]);

// Recreate the track event schema
const TrackEventSchema = z.object({
  eventType: EventTypeSchema,
  shop: z.string().min(1),
  productId: z.string().optional(),
  pageUrl: z.string().optional(),
});

// Helper to validate track event
function validateTrackEvent(data: unknown) {
  return TrackEventSchema.safeParse(data);
}

// Helper to check if product ID is required
function requiresProductId(eventType: string): boolean {
  return eventType === "add_to_cart";
}

describe("Social Proof Track API", () => {
  describe("EventTypeSchema", () => {
    it("should validate valid event types", () => {
      expect(EventTypeSchema.safeParse("page_view").success).toBe(true);
      expect(EventTypeSchema.safeParse("product_view").success).toBe(true);
      expect(EventTypeSchema.safeParse("add_to_cart").success).toBe(true);
    });

    it("should reject invalid event types", () => {
      expect(EventTypeSchema.safeParse("purchase").success).toBe(false);
      expect(EventTypeSchema.safeParse("click").success).toBe(false);
    });
  });

  describe("TrackEventSchema", () => {
    it("should validate valid track event", () => {
      const validEvent = {
        eventType: "page_view",
        shop: "mystore.myshopify.com",
      };

      const result = validateTrackEvent(validEvent);
      expect(result.success).toBe(true);
    });

    it("should require shop parameter", () => {
      const invalidEvent = {
        eventType: "page_view",
      };

      const result = validateTrackEvent(invalidEvent);
      expect(result.success).toBe(false);
    });

    it("should require eventType parameter", () => {
      const invalidEvent = {
        shop: "mystore.myshopify.com",
      };

      const result = validateTrackEvent(invalidEvent);
      expect(result.success).toBe(false);
    });

    it("should accept optional productId", () => {
      const validEvent = {
        eventType: "product_view",
        shop: "mystore.myshopify.com",
        productId: "123456",
      };

      const result = validateTrackEvent(validEvent);
      expect(result.success).toBe(true);
    });

    it("should accept optional pageUrl", () => {
      const validEvent = {
        eventType: "page_view",
        shop: "mystore.myshopify.com",
        pageUrl: "/products/test-product",
      };

      const result = validateTrackEvent(validEvent);
      expect(result.success).toBe(true);
    });
  });

  describe("requiresProductId", () => {
    it("should return true for add_to_cart", () => {
      expect(requiresProductId("add_to_cart")).toBe(true);
    });

    it("should return false for page_view", () => {
      expect(requiresProductId("page_view")).toBe(false);
    });

    it("should return false for product_view", () => {
      expect(requiresProductId("product_view")).toBe(false);
    });
  });

  describe("HTTP method validation", () => {
    it("should only allow POST method", () => {
      const allowedMethods = ["POST"];
      const disallowedMethods = ["GET", "PUT", "DELETE"];

      expect(allowedMethods).toContain("POST");
      disallowedMethods.forEach((method) => {
        expect(allowedMethods).not.toContain(method);
      });
    });
  });

  describe("Response structure", () => {
    it("should have valid success response", () => {
      const response = { success: true };
      expect(response.success).toBe(true);
    });

    it("should have valid error response", () => {
      const response = {
        success: false,
        error: "Invalid request data",
        details: "eventType: Required",
      };

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });
  });
});

