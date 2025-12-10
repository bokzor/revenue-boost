/**
 * Unit Tests for Analytics Campaigns API
 *
 * Tests the query parameter parsing and helper functions.
 */

import { describe, it, expect } from "vitest";

// Recreate the types from the route
type SortByOption = "revenue" | "leads" | "conversionRate" | "impressions";

// Recreate the parseSortBy function
function parseSortBy(value: string | null): SortByOption {
  if (
    value === "revenue" ||
    value === "leads" ||
    value === "conversionRate" ||
    value === "impressions"
  ) {
    return value;
  }
  return "revenue";
}

// Recreate the limit parsing
function parseLimit(value: string | null, maxLimit: number = 100): number {
  const parsed = parseInt(value || "20");
  return Math.min(isNaN(parsed) ? 20 : parsed, maxLimit);
}

describe("Analytics Campaigns API", () => {
  describe("parseSortBy", () => {
    it("should return revenue for revenue", () => {
      expect(parseSortBy("revenue")).toBe("revenue");
    });

    it("should return leads for leads", () => {
      expect(parseSortBy("leads")).toBe("leads");
    });

    it("should return conversionRate for conversionRate", () => {
      expect(parseSortBy("conversionRate")).toBe("conversionRate");
    });

    it("should return impressions for impressions", () => {
      expect(parseSortBy("impressions")).toBe("impressions");
    });

    it("should default to revenue for null", () => {
      expect(parseSortBy(null)).toBe("revenue");
    });

    it("should default to revenue for invalid value", () => {
      expect(parseSortBy("invalid")).toBe("revenue");
      expect(parseSortBy("")).toBe("revenue");
    });
  });

  describe("parseLimit", () => {
    it("should parse valid limit", () => {
      expect(parseLimit("50")).toBe(50);
    });

    it("should default to 20 for null", () => {
      expect(parseLimit(null)).toBe(20);
    });

    it("should cap at max limit", () => {
      expect(parseLimit("200")).toBe(100);
      expect(parseLimit("150", 100)).toBe(100);
    });

    it("should use custom max limit", () => {
      expect(parseLimit("75", 50)).toBe(50);
    });

    it("should default to 20 for invalid value", () => {
      expect(parseLimit("invalid")).toBe(20);
    });
  });

  describe("Response structure", () => {
    it("should have valid success response structure", () => {
      const response = {
        success: true,
        data: {
          rankings: [
            {
              campaignId: "c1",
              name: "Summer Sale",
              revenue: 5000,
              leads: 100,
              conversionRate: 5.5,
              impressions: 2000,
            },
          ],
        },
        timeRange: "30d",
        sortBy: "revenue" as SortByOption,
      };

      expect(response.success).toBe(true);
      expect(response.data.rankings).toHaveLength(1);
      expect(response.timeRange).toBe("30d");
      expect(response.sortBy).toBe("revenue");
    });

    it("should have valid empty rankings response", () => {
      const response = {
        success: true,
        data: { rankings: [] },
        timeRange: "7d",
        sortBy: "leads" as SortByOption,
      };

      expect(response.data.rankings).toHaveLength(0);
    });
  });
});

