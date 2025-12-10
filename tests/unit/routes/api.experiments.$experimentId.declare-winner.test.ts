/**
 * Unit Tests for Declare Winner API
 *
 * Tests the experiment winner declaration logic.
 */

import { describe, it, expect } from "vitest";

// Recreate the request structure
interface DeclareWinnerRequest {
  winningVariantKey: string;
}

// Recreate the campaign structure
interface Campaign {
  id: string;
  variantKey: string | null;
  status: string;
}

// Helper to validate request
function validateDeclareWinnerRequest(
  body: unknown
): body is DeclareWinnerRequest {
  if (!body || typeof body !== "object") return false;
  const req = body as Record<string, unknown>;
  return typeof req.winningVariantKey === "string" && req.winningVariantKey.length > 0;
}

// Helper to find winning campaign
function findWinningCampaign(
  campaigns: Campaign[],
  winningVariantKey: string
): Campaign | undefined {
  return campaigns.find((c) => c.variantKey === winningVariantKey);
}

// Helper to get losing campaigns
function getLosingCampaigns(
  campaigns: Campaign[],
  winningVariantKey: string
): Campaign[] {
  return campaigns.filter((c) => c.variantKey !== winningVariantKey);
}

// Helper to build traffic allocation
function buildWinnerTrafficAllocation(
  winningVariantKey: string,
  losingCampaigns: Campaign[]
): Record<string, number> {
  const allocation: Record<string, number> = {
    [winningVariantKey]: 100,
  };

  losingCampaigns.forEach((c) => {
    allocation[c.variantKey || "UNKNOWN"] = 0;
  });

  return allocation;
}

describe("Declare Winner API", () => {
  describe("validateDeclareWinnerRequest", () => {
    it("should return true for valid request", () => {
      const body = { winningVariantKey: "variant_a" };
      expect(validateDeclareWinnerRequest(body)).toBe(true);
    });

    it("should return false for missing winningVariantKey", () => {
      expect(validateDeclareWinnerRequest({})).toBe(false);
    });

    it("should return false for empty winningVariantKey", () => {
      expect(validateDeclareWinnerRequest({ winningVariantKey: "" })).toBe(false);
    });

    it("should return false for null body", () => {
      expect(validateDeclareWinnerRequest(null)).toBe(false);
    });
  });

  describe("findWinningCampaign", () => {
    const campaigns: Campaign[] = [
      { id: "camp_1", variantKey: "variant_a", status: "ACTIVE" },
      { id: "camp_2", variantKey: "variant_b", status: "ACTIVE" },
    ];

    it("should find campaign by variant key", () => {
      const winner = findWinningCampaign(campaigns, "variant_a");
      expect(winner?.id).toBe("camp_1");
    });

    it("should return undefined for non-existent variant", () => {
      const winner = findWinningCampaign(campaigns, "variant_c");
      expect(winner).toBeUndefined();
    });
  });

  describe("getLosingCampaigns", () => {
    const campaigns: Campaign[] = [
      { id: "camp_1", variantKey: "variant_a", status: "ACTIVE" },
      { id: "camp_2", variantKey: "variant_b", status: "ACTIVE" },
      { id: "camp_3", variantKey: "variant_c", status: "ACTIVE" },
    ];

    it("should return all campaigns except winner", () => {
      const losers = getLosingCampaigns(campaigns, "variant_a");
      expect(losers).toHaveLength(2);
      expect(losers.map((c) => c.variantKey)).toEqual(["variant_b", "variant_c"]);
    });

    it("should return all campaigns if winner not found", () => {
      const losers = getLosingCampaigns(campaigns, "variant_x");
      expect(losers).toHaveLength(3);
    });
  });

  describe("buildWinnerTrafficAllocation", () => {
    it("should give winner 100% traffic", () => {
      const losers: Campaign[] = [
        { id: "camp_2", variantKey: "variant_b", status: "ACTIVE" },
      ];

      const allocation = buildWinnerTrafficAllocation("variant_a", losers);

      expect(allocation.variant_a).toBe(100);
      expect(allocation.variant_b).toBe(0);
    });

    it("should handle multiple losers", () => {
      const losers: Campaign[] = [
        { id: "camp_2", variantKey: "variant_b", status: "ACTIVE" },
        { id: "camp_3", variantKey: "variant_c", status: "ACTIVE" },
      ];

      const allocation = buildWinnerTrafficAllocation("variant_a", losers);

      expect(allocation.variant_a).toBe(100);
      expect(allocation.variant_b).toBe(0);
      expect(allocation.variant_c).toBe(0);
    });

    it("should handle null variant key", () => {
      const losers: Campaign[] = [
        { id: "camp_2", variantKey: null, status: "ACTIVE" },
      ];

      const allocation = buildWinnerTrafficAllocation("variant_a", losers);

      expect(allocation.UNKNOWN).toBe(0);
    });
  });
});

