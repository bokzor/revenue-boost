/**
 * Schedule Helpers Unit Tests
 *
 * Tests timezone-aware schedule validation logic
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isWithinSchedule } from "~/domains/campaigns/utils/schedule-helpers";

describe("isWithinSchedule", () => {
  let originalDate: DateConstructor;

  beforeEach(() => {
    originalDate = global.Date;
  });

  afterEach(() => {
    global.Date = originalDate;
  });

  it("should return true when no schedule constraints exist", () => {
    const result = isWithinSchedule(undefined, undefined, "UTC");
    expect(result).toBe(true);
  });

  it("should return true when both dates are null", () => {
    const result = isWithinSchedule(null, null, "UTC");
    expect(result).toBe(true);
  });

  it("should return false when current time is before start date", () => {
    // Mock current time: 2024-01-01 12:00 UTC
    const mockNow = new Date("2024-01-01T12:00:00Z");
    vi.setSystemTime(mockNow);

    // Start date: 2024-01-02 12:00 UTC (tomorrow)
    const startDate = new Date("2024-01-02T12:00:00Z");

    const result = isWithinSchedule(startDate, undefined, "UTC");
    expect(result).toBe(false);
  });

  it("should return true when current time is after start date", () => {
    // Mock current time: 2024-01-02 12:00 UTC
    const mockNow = new Date("2024-01-02T12:00:00Z");
    vi.setSystemTime(mockNow);

    // Start date: 2024-01-01 12:00 UTC (yesterday)
    const startDate = new Date("2024-01-01T12:00:00Z");

    const result = isWithinSchedule(startDate, undefined, "UTC");
    expect(result).toBe(true);
  });

  it("should return false when current time is after end date", () => {
    // Mock current time: 2024-01-03 12:00 UTC
    const mockNow = new Date("2024-01-03T12:00:00Z");
    vi.setSystemTime(mockNow);

    // End date: 2024-01-02 12:00 UTC (yesterday)
    const endDate = new Date("2024-01-02T12:00:00Z");

    const result = isWithinSchedule(undefined, endDate, "UTC");
    expect(result).toBe(false);
  });

  it("should return true when current time is before end date", () => {
    // Mock current time: 2024-01-01 12:00 UTC
    const mockNow = new Date("2024-01-01T12:00:00Z");
    vi.setSystemTime(mockNow);

    // End date: 2024-01-02 12:00 UTC (tomorrow)
    const endDate = new Date("2024-01-02T12:00:00Z");

    const result = isWithinSchedule(undefined, endDate, "UTC");
    expect(result).toBe(true);
  });

  it("should return true when current time is within start and end dates", () => {
    // Mock current time: 2024-01-02 12:00 UTC
    const mockNow = new Date("2024-01-02T12:00:00Z");
    vi.setSystemTime(mockNow);

    // Start: 2024-01-01, End: 2024-01-03
    const startDate = new Date("2024-01-01T12:00:00Z");
    const endDate = new Date("2024-01-03T12:00:00Z");

    const result = isWithinSchedule(startDate, endDate, "UTC");
    expect(result).toBe(true);
  });

  it("should return false when current time is before start date (with end date)", () => {
    // Mock current time: 2023-12-31 12:00 UTC
    const mockNow = new Date("2023-12-31T12:00:00Z");
    vi.setSystemTime(mockNow);

    // Start: 2024-01-01, End: 2024-01-03
    const startDate = new Date("2024-01-01T12:00:00Z");
    const endDate = new Date("2024-01-03T12:00:00Z");

    const result = isWithinSchedule(startDate, endDate, "UTC");
    expect(result).toBe(false);
  });

  it("should return false when current time is after end date (with start date)", () => {
    // Mock current time: 2024-01-04 12:00 UTC
    const mockNow = new Date("2024-01-04T12:00:00Z");
    vi.setSystemTime(mockNow);

    // Start: 2024-01-01, End: 2024-01-03
    const startDate = new Date("2024-01-01T12:00:00Z");
    const endDate = new Date("2024-01-03T12:00:00Z");

    const result = isWithinSchedule(startDate, endDate, "UTC");
    expect(result).toBe(false);
  });

  it("should handle ISO string dates", () => {
    // Mock current time: 2024-01-02 12:00 UTC
    const mockNow = new Date("2024-01-02T12:00:00Z");
    vi.setSystemTime(mockNow);

    const startDate = "2024-01-01T12:00:00Z";
    const endDate = "2024-01-03T12:00:00Z";

    const result = isWithinSchedule(startDate, endDate, "UTC");
    expect(result).toBe(true);
  });

  it("should default to UTC when no timezone provided", () => {
    // Mock current time: 2024-01-02 12:00 UTC
    const mockNow = new Date("2024-01-02T12:00:00Z");
    vi.setSystemTime(mockNow);

    const startDate = new Date("2024-01-01T12:00:00Z");
    const endDate = new Date("2024-01-03T12:00:00Z");

    const result = isWithinSchedule(startDate, endDate); // No timezone
    expect(result).toBe(true);
  });

  it("should return true on error (fail open)", () => {
    // Pass invalid date to trigger error
    const result = isWithinSchedule("invalid-date" as any, undefined, "UTC");
    expect(result).toBe(true);
  });
});

