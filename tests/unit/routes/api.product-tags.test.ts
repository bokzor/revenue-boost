/**
 * Unit Tests for Product Tags API
 *
 * Tests the tag filtering and limiting logic.
 */

import { describe, it, expect } from "vitest";

// Recreate the filtering logic from the route
function filterTags(tags: string[], query: string): string[] {
  if (!query) return tags;
  return tags.filter((tag) => tag.toLowerCase().includes(query.toLowerCase()));
}

function parseFirstParam(firstParam: string | null): number {
  const num = Number(firstParam);
  if (Number.isFinite(num) && num > 0) {
    return Math.min(num, 5000);
  }
  return 500;
}

function limitTags(tags: string[], limit: number = 20): string[] {
  return tags.slice(0, limit);
}

describe("Product Tags API", () => {
  describe("filterTags", () => {
    const sampleTags = ["Summer", "Winter", "Spring", "Fall", "Sale", "New Arrival", "Bestseller"];

    it("should return all tags when query is empty", () => {
      const result = filterTags(sampleTags, "");
      expect(result).toEqual(sampleTags);
    });

    it("should filter tags case-insensitively", () => {
      const result = filterTags(sampleTags, "summer");
      expect(result).toEqual(["Summer"]);
    });

    it("should match partial strings", () => {
      const result = filterTags(sampleTags, "er");
      expect(result).toEqual(["Summer", "Winter", "Bestseller"]);
    });

    it("should return empty array when no matches", () => {
      const result = filterTags(sampleTags, "xyz");
      expect(result).toEqual([]);
    });

    it("should handle uppercase query", () => {
      const result = filterTags(sampleTags, "SALE");
      expect(result).toEqual(["Sale"]);
    });
  });

  describe("parseFirstParam", () => {
    it("should return default 500 for null", () => {
      expect(parseFirstParam(null)).toBe(500);
    });

    it("should return default 500 for empty string", () => {
      expect(parseFirstParam("")).toBe(500);
    });

    it("should return default 500 for non-numeric string", () => {
      expect(parseFirstParam("abc")).toBe(500);
    });

    it("should return default 500 for zero", () => {
      expect(parseFirstParam("0")).toBe(500);
    });

    it("should return default 500 for negative number", () => {
      expect(parseFirstParam("-10")).toBe(500);
    });

    it("should return parsed number for valid input", () => {
      expect(parseFirstParam("100")).toBe(100);
    });

    it("should cap at 5000", () => {
      expect(parseFirstParam("10000")).toBe(5000);
    });

    it("should handle edge case at 5000", () => {
      expect(parseFirstParam("5000")).toBe(5000);
    });
  });

  describe("limitTags", () => {
    it("should limit to 20 by default", () => {
      const tags = Array.from({ length: 50 }, (_, i) => `Tag${i}`);
      const result = limitTags(tags);
      expect(result).toHaveLength(20);
    });

    it("should return all tags if less than limit", () => {
      const tags = ["Tag1", "Tag2", "Tag3"];
      const result = limitTags(tags);
      expect(result).toEqual(tags);
    });

    it("should respect custom limit", () => {
      const tags = Array.from({ length: 50 }, (_, i) => `Tag${i}`);
      const result = limitTags(tags, 10);
      expect(result).toHaveLength(10);
    });
  });
});

