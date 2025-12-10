/**
 * Unit Tests for Frequency Capping Helpers
 */

import { describe, it, expect } from "vitest";

import {
  TIME_WINDOW_OPTIONS,
  COOLDOWN_OPTIONS,
} from "~/domains/targeting/utils/frequency-capping-helpers";

describe("TIME_WINDOW_OPTIONS", () => {
  it("should have expected time window options", () => {
    expect(TIME_WINDOW_OPTIONS).toHaveLength(5);
  });

  it("should have per session option", () => {
    const session = TIME_WINDOW_OPTIONS.find((o) => o.label === "Per session");
    expect(session).toBeDefined();
    expect(session?.value).toBe("0");
  });

  it("should have per day option", () => {
    const day = TIME_WINDOW_OPTIONS.find((o) => o.label === "Per day");
    expect(day).toBeDefined();
    expect(day?.value).toBe("24");
  });

  it("should have per week option", () => {
    const week = TIME_WINDOW_OPTIONS.find((o) => o.label === "Per week");
    expect(week).toBeDefined();
    expect(week?.value).toBe("168"); // 24 * 7
  });

  it("should have per month option", () => {
    const month = TIME_WINDOW_OPTIONS.find((o) => o.label === "Per month");
    expect(month).toBeDefined();
    expect(month?.value).toBe("720"); // 24 * 30
  });
});

describe("COOLDOWN_OPTIONS", () => {
  it("should have expected cooldown options", () => {
    expect(COOLDOWN_OPTIONS.length).toBeGreaterThan(5);
  });

  it("should have no cooldown option", () => {
    const noCooldown = COOLDOWN_OPTIONS.find((o) => o.label === "No cooldown");
    expect(noCooldown).toBeDefined();
    expect(noCooldown?.value).toBe("0");
  });

  it("should have 15 minutes option", () => {
    const option = COOLDOWN_OPTIONS.find((o) => o.label === "15 minutes");
    expect(option).toBeDefined();
    expect(option?.value).toBe("0.25");
  });

  it("should have 1 hour option", () => {
    const option = COOLDOWN_OPTIONS.find((o) => o.label === "1 hour");
    expect(option).toBeDefined();
    expect(option?.value).toBe("1");
  });

  it("should have 24 hours option", () => {
    const option = COOLDOWN_OPTIONS.find((o) => o.label === "24 hours");
    expect(option).toBeDefined();
    expect(option?.value).toBe("24");
  });

  it("should have all options with label and value", () => {
    for (const option of COOLDOWN_OPTIONS) {
      expect(option).toHaveProperty("label");
      expect(option).toHaveProperty("value");
      expect(typeof option.label).toBe("string");
      expect(typeof option.value).toBe("string");
    }
  });
});

