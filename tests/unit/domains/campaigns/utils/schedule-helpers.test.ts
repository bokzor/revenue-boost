/**
 * Unit Tests for Schedule Helpers
 *
 * Tests scheduling utility functions for campaigns
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  getStatusOptions,
  getStatusDescription,
  getPriorityDescription,
  formatDateForInput,
  formatDateRange,
  validateScheduleDates,
  isWithinSchedule,
} from "~/domains/campaigns/utils/schedule-helpers";

// ==========================================================================
// STATUS HELPERS TESTS
// ==========================================================================

describe("getStatusOptions", () => {
  it("should return all status options", () => {
    const options = getStatusOptions();

    expect(options).toHaveLength(4);
    expect(options.map((o) => o.value)).toEqual(["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"]);
  });
});

describe("getStatusDescription", () => {
  it("should return draft description", () => {
    const desc = getStatusDescription("DRAFT");

    expect(desc.title).toContain("Draft");
    expect(desc.tone).toBe("info");
  });

  it("should return active description", () => {
    const desc = getStatusDescription("ACTIVE");

    expect(desc.title).toContain("Active");
    expect(desc.tone).toBe("success");
  });

  it("should return paused description", () => {
    const desc = getStatusDescription("PAUSED");

    expect(desc.title).toContain("Paused");
    expect(desc.tone).toBe("warning");
  });

  it("should return archived description", () => {
    const desc = getStatusDescription("ARCHIVED");

    expect(desc.title).toContain("Archived");
    expect(desc.tone).toBe("info");
  });
});

// ==========================================================================
// PRIORITY HELPERS TESTS
// ==========================================================================

describe("getPriorityDescription", () => {
  it("should return default description for priority 0", () => {
    expect(getPriorityDescription(0)).toContain("Default");
  });

  it("should return low priority description for 1-3", () => {
    expect(getPriorityDescription(1)).toContain("Low");
    expect(getPriorityDescription(3)).toContain("Low");
  });

  it("should return medium priority description for 4-6", () => {
    expect(getPriorityDescription(4)).toContain("Medium");
    expect(getPriorityDescription(6)).toContain("Medium");
  });

  it("should return high priority description for 7-9", () => {
    expect(getPriorityDescription(7)).toContain("High");
    expect(getPriorityDescription(9)).toContain("High");
  });

  it("should return maximum priority description for 10", () => {
    expect(getPriorityDescription(10)).toContain("Maximum");
  });
});

// ==========================================================================
// DATE FORMAT HELPERS TESTS
// ==========================================================================

describe("formatDateForInput", () => {
  it("should return empty string for undefined date", () => {
    expect(formatDateForInput()).toBe("");
    expect(formatDateForInput(undefined)).toBe("");
  });

  it("should format date for input without timezone", () => {
    const result = formatDateForInput("2024-06-15T14:30:00Z");
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });

  it("should format date with timezone", () => {
    const result = formatDateForInput("2024-06-15T14:30:00Z", "America/New_York");
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });

  it("should return empty string for invalid date", () => {
    expect(formatDateForInput("invalid-date")).toBe("");
  });
});

describe("formatDateRange", () => {
  it("should return null if startDate is missing", () => {
    expect(formatDateRange(undefined, "2024-06-15T14:30:00Z")).toBeNull();
  });

  it("should return null if endDate is missing", () => {
    expect(formatDateRange("2024-06-15T14:30:00Z", undefined)).toBeNull();
  });

  it("should format date range without timezone", () => {
    const result = formatDateRange("2024-06-10T10:00:00Z", "2024-06-20T18:00:00Z");
    expect(result).toContain("from");
    expect(result).toContain("to");
  });

  it("should format date range with timezone", () => {
    const result = formatDateRange("2024-06-10T10:00:00Z", "2024-06-20T18:00:00Z", "America/New_York");
    expect(result).toContain("America/New_York");
  });
});

// ==========================================================================
// SCHEDULE VALIDATION TESTS
// ==========================================================================

describe("validateScheduleDates", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return no errors for valid future dates", () => {
    const errors = validateScheduleDates("2024-06-20T10:00:00Z", "2024-06-25T10:00:00Z");
    expect(errors.startDateError).toBeUndefined();
    expect(errors.endDateError).toBeUndefined();
  });

  it("should return error for start date in the past", () => {
    const errors = validateScheduleDates("2024-06-10T10:00:00Z", "2024-06-25T10:00:00Z");
    expect(errors.startDateError).toContain("past");
  });

  it("should return error for end date in the past", () => {
    const errors = validateScheduleDates("2024-06-20T10:00:00Z", "2024-06-10T10:00:00Z");
    expect(errors.endDateError).toContain("past");
  });

  it("should return error when end date is before start date", () => {
    const errors = validateScheduleDates("2024-06-20T10:00:00Z", "2024-06-18T10:00:00Z");
    expect(errors.endDateError).toContain("after");
  });

  it("should return no errors when no dates provided", () => {
    const errors = validateScheduleDates();
    expect(errors.startDateError).toBeUndefined();
    expect(errors.endDateError).toBeUndefined();
  });
});

// ==========================================================================
// IS WITHIN SCHEDULE TESTS
// ==========================================================================

describe("isWithinSchedule", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return true when no schedule constraints", () => {
    expect(isWithinSchedule()).toBe(true);
    expect(isWithinSchedule(null, null)).toBe(true);
    expect(isWithinSchedule(undefined, undefined)).toBe(true);
  });

  it("should return true when current time is after start date", () => {
    expect(isWithinSchedule("2024-06-10T10:00:00Z", undefined)).toBe(true);
  });

  it("should return false when current time is before start date", () => {
    expect(isWithinSchedule("2024-06-20T10:00:00Z", undefined)).toBe(false);
  });

  it("should return true when current time is before end date", () => {
    expect(isWithinSchedule(undefined, "2024-06-20T10:00:00Z")).toBe(true);
  });

  it("should return false when current time is after end date", () => {
    expect(isWithinSchedule(undefined, "2024-06-10T10:00:00Z")).toBe(false);
  });

  it("should return true when within date range", () => {
    expect(isWithinSchedule("2024-06-10T10:00:00Z", "2024-06-20T10:00:00Z")).toBe(true);
  });

  it("should return false when outside date range", () => {
    // Before start
    expect(isWithinSchedule("2024-06-20T10:00:00Z", "2024-06-25T10:00:00Z")).toBe(false);
    // After end
    expect(isWithinSchedule("2024-06-05T10:00:00Z", "2024-06-10T10:00:00Z")).toBe(false);
  });

  it("should handle Date objects", () => {
    const startDate = new Date("2024-06-10T10:00:00Z");
    const endDate = new Date("2024-06-20T10:00:00Z");
    expect(isWithinSchedule(startDate, endDate)).toBe(true);
  });

  it("should handle timezone parameter", () => {
    // Test with America/New_York timezone
    expect(isWithinSchedule("2024-06-10T10:00:00Z", "2024-06-20T10:00:00Z", "America/New_York")).toBe(true);
  });
});

