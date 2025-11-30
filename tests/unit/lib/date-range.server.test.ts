import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  getDaysFromRange,
  getDateRanges,
  getTimeRangeFromRequest,
} from "~/lib/date-range.server";

describe("date-range utilities", () => {
  describe("getDaysFromRange", () => {
    it("returns 7 for '7d'", () => {
      expect(getDaysFromRange("7d")).toBe(7);
    });

    it("returns 30 for '30d'", () => {
      expect(getDaysFromRange("30d")).toBe(30);
    });

    it("returns 90 for '90d'", () => {
      expect(getDaysFromRange("90d")).toBe(90);
    });

    it("returns 1095 (3 years) for 'all'", () => {
      expect(getDaysFromRange("all")).toBe(365 * 3);
    });

    it("returns 30 as default for unknown values", () => {
      expect(getDaysFromRange("unknown")).toBe(30);
      expect(getDaysFromRange("")).toBe(30);
    });
  });

  describe("getDateRanges", () => {
    beforeEach(() => {
      // Mock the current date to 2025-01-30
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-01-30T12:00:00.000Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("calculates correct date ranges for 7d", () => {
      const { current, previous } = getDateRanges("7d");

      // Current from should be 7 days before current to
      const currentFromDay = current.from!.getDate();
      const currentToDay = current.to!.getDate();

      // Verify both ranges exist and have valid dates
      expect(current.from).toBeInstanceOf(Date);
      expect(current.to).toBeInstanceOf(Date);
      expect(previous.from).toBeInstanceOf(Date);
      expect(previous.to).toBeInstanceOf(Date);

      // Current period should start at midnight (00:00:00.000)
      expect(current.from!.getHours()).toBe(0);
      expect(current.from!.getMinutes()).toBe(0);
      expect(current.from!.getSeconds()).toBe(0);

      // Current period should end at end of day (23:59:59.999)
      expect(current.to!.getHours()).toBe(23);
      expect(current.to!.getMinutes()).toBe(59);
    });

    it("calculates correct date ranges for 30d", () => {
      const { current, previous } = getDateRanges("30d");

      // Verify both ranges exist and have valid dates
      expect(current.from).toBeInstanceOf(Date);
      expect(current.to).toBeInstanceOf(Date);
      expect(previous.from).toBeInstanceOf(Date);
      expect(previous.to).toBeInstanceOf(Date);

      // The gap between current.from and previous.from should be 30 days
      // (since each period is 30 days, previous starts 30 days before current)
      const daysDiffBetweenFroms = Math.round(
        (current.from!.getTime() - previous.from!.getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(daysDiffBetweenFroms).toBe(30);
    });

    it("previous period ends just before current period starts", () => {
      const { current, previous } = getDateRanges("7d");

      // Previous.to should be 1ms before current.from
      expect(previous.to!.getTime()).toBeLessThan(current.from!.getTime());
    });

    it("current period includes today", () => {
      const { current } = getDateRanges("7d");
      const now = new Date();

      expect(current.to!.getTime()).toBeGreaterThanOrEqual(now.getTime());
    });
  });

  describe("getTimeRangeFromRequest", () => {
    it("extracts timeRange=7d from URL", () => {
      const request = new Request("https://example.com/api?timeRange=7d");
      expect(getTimeRangeFromRequest(request)).toBe("7d");
    });

    it("extracts timeRange=30d from URL", () => {
      const request = new Request("https://example.com/api?timeRange=30d");
      expect(getTimeRangeFromRequest(request)).toBe("30d");
    });

    it("extracts timeRange=90d from URL", () => {
      const request = new Request("https://example.com/api?timeRange=90d");
      expect(getTimeRangeFromRequest(request)).toBe("90d");
    });

    it("extracts timeRange=all from URL", () => {
      const request = new Request("https://example.com/api?timeRange=all");
      expect(getTimeRangeFromRequest(request)).toBe("all");
    });

    it("returns 30d as default when no timeRange param", () => {
      const request = new Request("https://example.com/api");
      expect(getTimeRangeFromRequest(request)).toBe("30d");
    });

    it("returns 30d as default for invalid timeRange values", () => {
      const request = new Request("https://example.com/api?timeRange=invalid");
      expect(getTimeRangeFromRequest(request)).toBe("30d");
    });
  });
});

