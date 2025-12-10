/**
 * Unit Tests for Shopify Customer Service
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  sanitizeCustomerData,
  extractCustomerId,
  buildCustomerTags,
} from "~/lib/shopify/customer.server";

describe("sanitizeCustomerData", () => {
  it("should lowercase and trim email", () => {
    const result = sanitizeCustomerData({
      email: "  TEST@EXAMPLE.COM  ",
    });

    expect(result.email).toBe("test@example.com");
  });

  it("should trim name fields", () => {
    const result = sanitizeCustomerData({
      email: "test@example.com",
      firstName: "  John  ",
      lastName: "  Doe  ",
    });

    expect(result.firstName).toBe("John");
    expect(result.lastName).toBe("Doe");
  });

  it("should handle undefined optional fields", () => {
    const result = sanitizeCustomerData({
      email: "test@example.com",
    });

    expect(result.firstName).toBeUndefined();
    expect(result.lastName).toBeUndefined();
    expect(result.phone).toBeUndefined();
    expect(result.marketingConsent).toBe(false);
    expect(result.tags).toEqual([]);
  });

  it("should preserve enhanced fields", () => {
    const result = sanitizeCustomerData({
      email: "test@example.com",
      campaignName: "  Summer Sale  ",
      templateType: "  NEWSLETTER  ",
      discountCode: "  SAVE10  ",
    });

    expect(result.campaignName).toBe("Summer Sale");
    expect(result.templateType).toBe("NEWSLETTER");
    expect(result.discountCode).toBe("SAVE10");
  });
});

describe("extractCustomerId", () => {
  it("should extract ID from Shopify GID", () => {
    const result = extractCustomerId("gid://shopify/Customer/123456789");

    expect(result).toBe("123456789");
  });

  it("should handle simple ID", () => {
    const result = extractCustomerId("123456789");

    expect(result).toBe("123456789");
  });
});

describe("buildCustomerTags", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-15T12:00:00Z"));
  });

  it("should always include revenue-boost master tag", () => {
    const tags = buildCustomerTags({});

    expect(tags).toContain("revenue-boost");
  });

  it("should include rb-popup for popup source", () => {
    const tags = buildCustomerTags({
      source: "revenue-boost-popup",
    });

    expect(tags).toContain("rb-popup");
  });

  it("should include template type tag", () => {
    const tags = buildCustomerTags({
      templateType: "SPIN_TO_WIN",
    });

    expect(tags).toContain("rb-template:spin-to-win");
  });

  it("should include campaign name tag", () => {
    const tags = buildCustomerTags({
      campaignName: "Summer Sale 2025",
    });

    expect(tags).toContain("rb-campaign:summer-sale-2025");
  });

  it("should include campaign ID tag", () => {
    const tags = buildCustomerTags({
      campaignId: "abc123",
    });

    expect(tags).toContain("rb-campaign-id:abc123");
  });

  it("should include date tag for cohort analysis", () => {
    const tags = buildCustomerTags({});

    expect(tags).toContain("rb-date:2025-06");
  });

  it("should include discount code tag", () => {
    const tags = buildCustomerTags({
      discountCode: "SAVE20",
    });

    expect(tags).toContain("rb-discount:save20");
  });

  it("should merge with existing tags without duplicates", () => {
    const tags = buildCustomerTags({
      existingTags: ["existing-tag", "revenue-boost"],
    });

    expect(tags).toContain("existing-tag");
    expect(tags.filter((t) => t === "revenue-boost")).toHaveLength(1);
  });

  it("should slugify special characters", () => {
    const tags = buildCustomerTags({
      campaignName: "Black Friday & Cyber Monday!",
    });

    expect(tags).toContain("rb-campaign:black-friday-cyber-monday");
  });
});

