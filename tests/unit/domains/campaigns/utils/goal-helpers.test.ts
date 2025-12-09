/**
 * Unit Tests for Goal Helpers
 */

import { describe, it, expect } from "vitest";

import { getGoalDisplayName } from "~/domains/campaigns/utils/goal-helpers";

describe("getGoalDisplayName", () => {
  it("should return 'Newsletter Signup' for NEWSLETTER_SIGNUP", () => {
    expect(getGoalDisplayName("NEWSLETTER_SIGNUP")).toBe("Newsletter Signup");
  });

  it("should return 'Increase Revenue' for INCREASE_REVENUE", () => {
    expect(getGoalDisplayName("INCREASE_REVENUE")).toBe("Increase Revenue");
  });

  it("should return 'Engage Customers' for ENGAGEMENT", () => {
    expect(getGoalDisplayName("ENGAGEMENT")).toBe("Engage Customers");
  });

  it("should return the goal itself for unknown goals", () => {
    // @ts-expect-error - Testing unknown goal
    expect(getGoalDisplayName("UNKNOWN_GOAL")).toBe("UNKNOWN_GOAL");
  });
});

