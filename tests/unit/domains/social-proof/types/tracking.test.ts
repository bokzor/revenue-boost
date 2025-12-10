/**
 * Unit Tests for Social Proof Tracking Types
 */

import { describe, it, expect } from "vitest";

import {
  EventTypeSchema,
  TrackEventSchema,
  validateTrackEvent,
} from "~/domains/social-proof/types/tracking";

describe("EventTypeSchema", () => {
  it("should validate page_view", () => {
    const result = EventTypeSchema.safeParse("page_view");
    expect(result.success).toBe(true);
  });

  it("should validate product_view", () => {
    const result = EventTypeSchema.safeParse("product_view");
    expect(result.success).toBe(true);
  });

  it("should validate add_to_cart", () => {
    const result = EventTypeSchema.safeParse("add_to_cart");
    expect(result.success).toBe(true);
  });

  it("should reject invalid event type", () => {
    const result = EventTypeSchema.safeParse("invalid_event");
    expect(result.success).toBe(false);
  });
});

describe("TrackEventSchema", () => {
  it("should validate valid track event", () => {
    const result = TrackEventSchema.safeParse({
      eventType: "page_view",
      shop: "test-store.myshopify.com",
    });

    expect(result.success).toBe(true);
  });

  it("should validate track event with optional fields", () => {
    const result = TrackEventSchema.safeParse({
      eventType: "product_view",
      shop: "test-store.myshopify.com",
      productId: "product-123",
      pageUrl: "https://example.com/products/test",
    });

    expect(result.success).toBe(true);
  });

  it("should reject invalid shop domain", () => {
    const result = TrackEventSchema.safeParse({
      eventType: "page_view",
      shop: "invalid-domain.com",
    });

    expect(result.success).toBe(false);
  });

  it("should reject shop domain with uppercase", () => {
    const result = TrackEventSchema.safeParse({
      eventType: "page_view",
      shop: "Test-Store.myshopify.com",
    });

    expect(result.success).toBe(false);
  });

  it("should reject missing shop", () => {
    const result = TrackEventSchema.safeParse({
      eventType: "page_view",
    });

    expect(result.success).toBe(false);
  });

  it("should reject missing eventType", () => {
    const result = TrackEventSchema.safeParse({
      shop: "test-store.myshopify.com",
    });

    expect(result.success).toBe(false);
  });

  it("should reject invalid pageUrl", () => {
    const result = TrackEventSchema.safeParse({
      eventType: "page_view",
      shop: "test-store.myshopify.com",
      pageUrl: "not-a-url",
    });

    expect(result.success).toBe(false);
  });
});

describe("validateTrackEvent", () => {
  it("should return success for valid data", () => {
    const result = validateTrackEvent({
      eventType: "add_to_cart",
      shop: "my-store.myshopify.com",
      productId: "123",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.eventType).toBe("add_to_cart");
      expect(result.data.shop).toBe("my-store.myshopify.com");
      expect(result.data.productId).toBe("123");
    }
  });

  it("should return error for invalid data", () => {
    const result = validateTrackEvent({
      eventType: "invalid",
      shop: "bad-domain",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });

  it("should handle null input", () => {
    const result = validateTrackEvent(null);
    expect(result.success).toBe(false);
  });

  it("should handle undefined input", () => {
    const result = validateTrackEvent(undefined);
    expect(result.success).toBe(false);
  });
});

