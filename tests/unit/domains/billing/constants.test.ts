/**
 * Unit Tests for Billing Constants
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock shopify.server to avoid import issues
vi.mock("~/shopify.server", () => ({
  BILLING_PLANS: {
    STARTER: "Starter",
    GROWTH: "Growth",
    PRO: "Pro",
    ENTERPRISE: "Enterprise",
  },
}));

import {
  PLAN_NAME_TO_TIER,
  SHOPIFY_STATUS_TO_PLAN_STATUS,
  getPlanTierFromName,
  getPlanStatusFromShopifyStatus,
  isSubscriptionBeingCancelled,
  BILLING_SYNC_TTL_MS,
} from "~/domains/billing/constants";

describe("PLAN_NAME_TO_TIER", () => {
  it("should map plan names to tiers", () => {
    expect(PLAN_NAME_TO_TIER["Starter"]).toBe("STARTER");
    expect(PLAN_NAME_TO_TIER["Growth"]).toBe("GROWTH");
    expect(PLAN_NAME_TO_TIER["Pro"]).toBe("PRO");
    expect(PLAN_NAME_TO_TIER["Enterprise"]).toBe("ENTERPRISE");
  });
});

describe("SHOPIFY_STATUS_TO_PLAN_STATUS", () => {
  it("should map Shopify statuses to plan statuses", () => {
    expect(SHOPIFY_STATUS_TO_PLAN_STATUS["ACTIVE"]).toBe("ACTIVE");
    expect(SHOPIFY_STATUS_TO_PLAN_STATUS["PENDING"]).toBe("TRIALING");
    expect(SHOPIFY_STATUS_TO_PLAN_STATUS["ACCEPTED"]).toBe("ACTIVE");
    expect(SHOPIFY_STATUS_TO_PLAN_STATUS["DECLINED"]).toBe("CANCELLED");
    expect(SHOPIFY_STATUS_TO_PLAN_STATUS["EXPIRED"]).toBe("CANCELLED");
    expect(SHOPIFY_STATUS_TO_PLAN_STATUS["FROZEN"]).toBe("PAST_DUE");
    expect(SHOPIFY_STATUS_TO_PLAN_STATUS["CANCELLED"]).toBe("CANCELLED");
  });
});

describe("getPlanTierFromName", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("should return correct tier for known plan names", () => {
    expect(getPlanTierFromName("Starter")).toBe("STARTER");
    expect(getPlanTierFromName("Growth")).toBe("GROWTH");
    expect(getPlanTierFromName("Pro")).toBe("PRO");
  });

  it("should return FREE for unknown plan names", () => {
    expect(getPlanTierFromName("Unknown Plan")).toBe("FREE");
    expect(console.warn).toHaveBeenCalled();
  });
});

describe("getPlanStatusFromShopifyStatus", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("should return correct status for known Shopify statuses", () => {
    expect(getPlanStatusFromShopifyStatus("ACTIVE")).toBe("ACTIVE");
    expect(getPlanStatusFromShopifyStatus("PENDING")).toBe("TRIALING");
    expect(getPlanStatusFromShopifyStatus("FROZEN")).toBe("PAST_DUE");
  });

  it("should return CANCELLED for unknown statuses", () => {
    expect(getPlanStatusFromShopifyStatus("UNKNOWN")).toBe("CANCELLED");
    expect(console.warn).toHaveBeenCalled();
  });
});

describe("isSubscriptionBeingCancelled", () => {
  it("should return true for cancellation statuses", () => {
    expect(isSubscriptionBeingCancelled("CANCELLED")).toBe(true);
    expect(isSubscriptionBeingCancelled("EXPIRED")).toBe(true);
    expect(isSubscriptionBeingCancelled("DECLINED")).toBe(true);
  });

  it("should return false for active statuses", () => {
    expect(isSubscriptionBeingCancelled("ACTIVE")).toBe(false);
    expect(isSubscriptionBeingCancelled("PENDING")).toBe(false);
    expect(isSubscriptionBeingCancelled("FROZEN")).toBe(false);
  });
});

describe("BILLING_SYNC_TTL_MS", () => {
  it("should be 5 minutes in milliseconds", () => {
    expect(BILLING_SYNC_TTL_MS).toBe(5 * 60 * 1000);
  });
});

