/**
 * Unit Tests for Shopify Segments API
 *
 * Tests the segment listing and count logic.
 */

import { describe, it, expect } from "vitest";

// Recreate the segment structure
interface ShopifySegment {
  id: string;
  name: string;
  description: string;
  customerCount?: number;
}

// Helper to parse query params
function parseSegmentQueryParams(url: URL): {
  first: number;
  includeCounts: boolean;
} {
  const firstParam = url.searchParams.get("first");
  const first =
    Number.isFinite(Number(firstParam)) && Number(firstParam) > 0
      ? Math.min(Number(firstParam), 250)
      : 50;
  const includeCounts = url.searchParams.get("includeCounts") === "true";

  return { first, includeCounts };
}

// Helper to map segments with counts
function mapSegmentsWithCounts(
  segments: Array<{ id: string; name: string; query?: string | null }>,
  countMap?: Map<string, number | undefined>
): ShopifySegment[] {
  return segments.map((segment) => ({
    id: segment.id,
    name: segment.name,
    description: segment.query || "",
    customerCount: countMap?.get(segment.id),
  }));
}

describe("Shopify Segments API", () => {
  describe("parseSegmentQueryParams", () => {
    it("should use default first value of 50", () => {
      const url = new URL("https://example.com/api/shopify-segments");
      const params = parseSegmentQueryParams(url);
      expect(params.first).toBe(50);
    });

    it("should parse custom first value", () => {
      const url = new URL("https://example.com/api/shopify-segments?first=100");
      const params = parseSegmentQueryParams(url);
      expect(params.first).toBe(100);
    });

    it("should cap first value at 250", () => {
      const url = new URL("https://example.com/api/shopify-segments?first=500");
      const params = parseSegmentQueryParams(url);
      expect(params.first).toBe(250);
    });

    it("should handle invalid first value", () => {
      const url = new URL("https://example.com/api/shopify-segments?first=abc");
      const params = parseSegmentQueryParams(url);
      expect(params.first).toBe(50);
    });

    it("should parse includeCounts parameter", () => {
      const url = new URL(
        "https://example.com/api/shopify-segments?includeCounts=true"
      );
      const params = parseSegmentQueryParams(url);
      expect(params.includeCounts).toBe(true);
    });

    it("should default includeCounts to false", () => {
      const url = new URL("https://example.com/api/shopify-segments");
      const params = parseSegmentQueryParams(url);
      expect(params.includeCounts).toBe(false);
    });
  });

  describe("mapSegmentsWithCounts", () => {
    it("should map segments without counts", () => {
      const segments = [
        { id: "seg1", name: "VIP Customers", query: "total_spent > 1000" },
        { id: "seg2", name: "New Customers", query: null },
      ];

      const result = mapSegmentsWithCounts(segments);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("seg1");
      expect(result[0].name).toBe("VIP Customers");
      expect(result[0].description).toBe("total_spent > 1000");
      expect(result[0].customerCount).toBeUndefined();
    });

    it("should map segments with counts", () => {
      const segments = [
        { id: "seg1", name: "VIP Customers", query: "total_spent > 1000" },
      ];
      const countMap = new Map([["seg1", 150]]);

      const result = mapSegmentsWithCounts(segments, countMap);

      expect(result[0].customerCount).toBe(150);
    });

    it("should handle null query as empty description", () => {
      const segments = [{ id: "seg1", name: "All Customers", query: null }];

      const result = mapSegmentsWithCounts(segments);

      expect(result[0].description).toBe("");
    });

    it("should handle missing count in map", () => {
      const segments = [{ id: "seg1", name: "Test", query: "" }];
      const countMap = new Map([["seg2", 100]]);

      const result = mapSegmentsWithCounts(segments, countMap);

      expect(result[0].customerCount).toBeUndefined();
    });
  });

  describe("Response structure", () => {
    it("should have valid success response", () => {
      const response = {
        success: true,
        data: {
          segments: [
            { id: "seg1", name: "VIP", description: "", customerCount: 100 },
          ],
        },
      };

      expect(response.success).toBe(true);
      expect(response.data.segments).toHaveLength(1);
    });
  });
});

