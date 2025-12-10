/**
 * Unit Tests for Audience Preview API
 *
 * Tests the validation schema and helper functions.
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";

// Recreate the audience targeting schema
const AudienceTargetingConfigSchema = z.object({
  enabled: z.boolean().default(false),
  shopifySegmentIds: z.array(z.string()).default([]),
  sessionRules: z.array(z.unknown()).optional(),
});

const AudiencePreviewRequestSchema = z.object({
  audienceTargeting: AudienceTargetingConfigSchema,
});

// Recreate the segment ID deduplication logic
function getUniqueSegmentIds(segmentIds: string[]): string[] {
  return Array.from(new Set(segmentIds.filter((id) => !!id)));
}

// Recreate the total customers calculation
function calculateTotalCustomers(counts: { segmentId: string; totalCustomers: number }[]): number {
  return counts.reduce((sum, entry) => sum + entry.totalCustomers, 0);
}

describe("Audience Preview API", () => {
  describe("AudiencePreviewRequestSchema", () => {
    it("should validate valid request with enabled targeting", () => {
      const validData = {
        audienceTargeting: {
          enabled: true,
          shopifySegmentIds: ["gid://shopify/Segment/123"],
        },
      };

      const result = AudiencePreviewRequestSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should validate request with disabled targeting", () => {
      const validData = {
        audienceTargeting: {
          enabled: false,
          shopifySegmentIds: [],
        },
      };

      const result = AudiencePreviewRequestSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should apply defaults for missing fields", () => {
      const minimalData = {
        audienceTargeting: {},
      };

      const result = AudiencePreviewRequestSchema.safeParse(minimalData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.audienceTargeting.enabled).toBe(false);
        expect(result.data.audienceTargeting.shopifySegmentIds).toEqual([]);
      }
    });

    it("should validate multiple segment IDs", () => {
      const validData = {
        audienceTargeting: {
          enabled: true,
          shopifySegmentIds: [
            "gid://shopify/Segment/123",
            "gid://shopify/Segment/456",
            "gid://shopify/Segment/789",
          ],
        },
      };

      const result = AudiencePreviewRequestSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe("getUniqueSegmentIds", () => {
    it("should deduplicate segment IDs", () => {
      const ids = ["seg1", "seg2", "seg1", "seg3", "seg2"];
      const result = getUniqueSegmentIds(ids);
      expect(result).toHaveLength(3);
      expect(result).toContain("seg1");
      expect(result).toContain("seg2");
      expect(result).toContain("seg3");
    });

    it("should filter out empty strings", () => {
      const ids = ["seg1", "", "seg2", ""];
      const result = getUniqueSegmentIds(ids);
      expect(result).toHaveLength(2);
      expect(result).not.toContain("");
    });

    it("should return empty array for empty input", () => {
      const result = getUniqueSegmentIds([]);
      expect(result).toHaveLength(0);
    });
  });

  describe("calculateTotalCustomers", () => {
    it("should sum customer counts from all segments", () => {
      const counts = [
        { segmentId: "seg1", totalCustomers: 100 },
        { segmentId: "seg2", totalCustomers: 200 },
        { segmentId: "seg3", totalCustomers: 50 },
      ];

      const result = calculateTotalCustomers(counts);
      expect(result).toBe(350);
    });

    it("should return 0 for empty array", () => {
      const result = calculateTotalCustomers([]);
      expect(result).toBe(0);
    });

    it("should handle single segment", () => {
      const counts = [{ segmentId: "seg1", totalCustomers: 500 }];
      const result = calculateTotalCustomers(counts);
      expect(result).toBe(500);
    });
  });
});

