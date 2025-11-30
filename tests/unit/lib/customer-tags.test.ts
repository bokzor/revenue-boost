/**
 * Tests for buildCustomerTags function
 *
 * These tags are used for email marketing platform integration.
 * When a lead signs up via a popup, we create a Shopify customer with tags
 * that sync to Klaviyo, Mailchimp, and other platforms.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { buildCustomerTags } from "~/lib/shopify/customer.server";

describe("buildCustomerTags", () => {
  beforeEach(() => {
    // Mock date to ensure consistent tag generation
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should include master revenue-boost tag", () => {
    const tags = buildCustomerTags({});
    expect(tags).toContain("revenue-boost");
  });

  it("should include rb-popup tag when source is revenue-boost-popup", () => {
    const tags = buildCustomerTags({ source: "revenue-boost-popup" });
    expect(tags).toContain("rb-popup");
  });

  it("should not include rb-popup tag for other sources", () => {
    const tags = buildCustomerTags({ source: "other-source" });
    expect(tags).not.toContain("rb-popup");
  });

  it("should include slugified template type", () => {
    const tags = buildCustomerTags({ templateType: "SPIN_TO_WIN" });
    expect(tags).toContain("rb-template:spin-to-win");
  });

  it("should include slugified campaign name", () => {
    const tags = buildCustomerTags({ campaignName: "Black Friday Sale 2025!" });
    expect(tags).toContain("rb-campaign:black-friday-sale-2025");
  });

  it("should include campaign ID for backwards compatibility", () => {
    const tags = buildCustomerTags({ campaignId: "clx123abc" });
    expect(tags).toContain("rb-campaign-id:clx123abc");
  });

  it("should include signup month for cohort analysis", () => {
    const tags = buildCustomerTags({});
    expect(tags).toContain("rb-date:2025-01");
  });

  it("should include slugified discount code", () => {
    const tags = buildCustomerTags({ discountCode: "SAVE10OFF" });
    expect(tags).toContain("rb-discount:save10off");
  });

  it("should merge with existing tags without duplicates", () => {
    const tags = buildCustomerTags({
      source: "revenue-boost-popup",
      existingTags: ["existing-tag", "revenue-boost"], // revenue-boost should not duplicate
    });

    expect(tags).toContain("existing-tag");
    expect(tags).toContain("revenue-boost");
    expect(tags).toContain("rb-popup");

    // Check no duplicates
    const revenueBoostCount = tags.filter((t) => t === "revenue-boost").length;
    expect(revenueBoostCount).toBe(1);
  });

  it("should generate complete tag set for full data", () => {
    const tags = buildCustomerTags({
      source: "revenue-boost-popup",
      campaignId: "clx123abc",
      campaignName: "Summer Newsletter",
      templateType: "NEWSLETTER",
      discountCode: "SUMMER20",
    });

    expect(tags).toEqual(
      expect.arrayContaining([
        "revenue-boost",
        "rb-popup",
        "rb-template:newsletter",
        "rb-campaign:summer-newsletter",
        "rb-campaign-id:clx123abc",
        "rb-date:2025-01",
        "rb-discount:summer20",
      ])
    );
  });

  it("should truncate long campaign names to 40 characters", () => {
    const longName =
      "This Is A Very Long Campaign Name That Should Be Truncated To Forty Characters";
    const tags = buildCustomerTags({ campaignName: longName });

    const campaignTag = tags.find((t) => t.startsWith("rb-campaign:"));
    expect(campaignTag).toBeDefined();

    // rb-campaign: is 12 chars, so the slug portion should be <= 40
    const slug = campaignTag!.replace("rb-campaign:", "");
    expect(slug.length).toBeLessThanOrEqual(40);
  });

  it("should handle special characters in campaign names", () => {
    const tags = buildCustomerTags({
      campaignName: "50% OFF!!! 🎉 Special & More",
    });

    const campaignTag = tags.find((t) => t.startsWith("rb-campaign:"));
    expect(campaignTag).toBe("rb-campaign:50-off-special-more");
  });
});

