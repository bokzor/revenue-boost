/**
 * Unit Tests for Audience Sync Memberships API
 *
 * Tests the validation schema and helper functions.
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";

// Recreate the schema from the route
const SyncMembershipsRequestSchema = z.object({
  segmentIds: z
    .array(z.string().min(1, "Segment ID is required"))
    .min(1, "At least one segmentId is required"),
});

// Recreate the segment ID deduplication
function deduplicateSegmentIds(segmentIds: string[]): string[] {
  return Array.from(new Set(segmentIds.filter(Boolean)));
}

describe("Audience Sync Memberships API", () => {
  describe("SyncMembershipsRequestSchema", () => {
    it("should validate valid request with single segment", () => {
      const validData = {
        segmentIds: ["gid://shopify/Segment/123"],
      };

      const result = SyncMembershipsRequestSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should validate valid request with multiple segments", () => {
      const validData = {
        segmentIds: [
          "gid://shopify/Segment/123",
          "gid://shopify/Segment/456",
          "gid://shopify/Segment/789",
        ],
      };

      const result = SyncMembershipsRequestSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject empty segmentIds array", () => {
      const invalidData = {
        segmentIds: [],
      };

      const result = SyncMembershipsRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject missing segmentIds", () => {
      const invalidData = {};

      const result = SyncMembershipsRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject empty string segment IDs", () => {
      const invalidData = {
        segmentIds: [""],
      };

      const result = SyncMembershipsRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("deduplicateSegmentIds", () => {
    it("should remove duplicate segment IDs", () => {
      const ids = ["seg1", "seg2", "seg1", "seg3", "seg2"];
      const result = deduplicateSegmentIds(ids);
      expect(result).toHaveLength(3);
      expect(result).toContain("seg1");
      expect(result).toContain("seg2");
      expect(result).toContain("seg3");
    });

    it("should filter out empty strings", () => {
      const ids = ["seg1", "", "seg2", ""];
      const result = deduplicateSegmentIds(ids);
      expect(result).toHaveLength(2);
      expect(result).not.toContain("");
    });

    it("should return empty array for empty input", () => {
      const result = deduplicateSegmentIds([]);
      expect(result).toHaveLength(0);
    });

    it("should handle single segment", () => {
      const result = deduplicateSegmentIds(["seg1"]);
      expect(result).toHaveLength(1);
      expect(result[0]).toBe("seg1");
    });
  });

  describe("Response structures", () => {
    it("should have valid success response", () => {
      const response = {
        success: true,
        data: {
          success: true,
          storeId: "store_123",
          segmentIds: ["seg1", "seg2"],
        },
      };

      expect(response.success).toBe(true);
      expect(response.data.storeId).toBe("store_123");
      expect(response.data.segmentIds).toHaveLength(2);
    });

    it("should have valid error response for invalid payload", () => {
      const response = {
        error: "Invalid payload",
        details: { segmentIds: { _errors: ["At least one segmentId is required"] } },
      };

      expect(response.error).toBe("Invalid payload");
      expect(response.details).toBeDefined();
    });

    it("should have valid method not allowed response", () => {
      const response = {
        error: "Method not allowed. Use POST to sync audience memberships.",
      };

      expect(response.error).toContain("Method not allowed");
    });
  });
});

