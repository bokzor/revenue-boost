/**
 * Unit Tests for Goal Defaults
 */

import { describe, it, expect } from "vitest";

import { GOAL_DEFAULTS, getGoalDefaults } from "~/lib/goal-defaults";

describe("GOAL_DEFAULTS", () => {
  it("should have defaults for all goals", () => {
    expect(GOAL_DEFAULTS.NEWSLETTER_SIGNUP).toBeDefined();
    expect(GOAL_DEFAULTS.INCREASE_REVENUE).toBeDefined();
    expect(GOAL_DEFAULTS.ENGAGEMENT).toBeDefined();
  });

  describe("NEWSLETTER_SIGNUP", () => {
    const defaults = GOAL_DEFAULTS.NEWSLETTER_SIGNUP;

    it("should have discount enabled", () => {
      expect(defaults.discount?.enabled).toBe(true);
      expect(defaults.discount?.type).toBe("percentage");
      expect(defaults.discount?.value).toBe(10);
    });

    it("should have medium size design", () => {
      expect(defaults.design.size).toBe("medium");
      expect(defaults.design.style).toBe("minimal");
    });

    it("should recommend newsletter templates", () => {
      expect(defaults.templates.recommended).toContain("newsletter");
    });
  });

  describe("INCREASE_REVENUE", () => {
    const defaults = GOAL_DEFAULTS.INCREASE_REVENUE;

    it("should have higher discount value", () => {
      expect(defaults.discount?.enabled).toBe(true);
      expect(defaults.discount?.value).toBe(20);
    });

    it("should have high urgency design", () => {
      expect(defaults.design.size).toBe("large");
      expect(defaults.design.urgencyLevel).toBe("high");
    });

    it("should have higher priority", () => {
      expect(defaults.campaign.priority).toBe(10);
    });
  });

  describe("ENGAGEMENT", () => {
    const defaults = GOAL_DEFAULTS.ENGAGEMENT;

    it("should have discount disabled by default", () => {
      expect(defaults.discount?.enabled).toBe(false);
    });

    it("should have playful style", () => {
      expect(defaults.design.style).toBe("playful");
      expect(defaults.design.urgencyLevel).toBe("none");
    });

    it("should recommend gamification templates", () => {
      expect(defaults.templates.categories).toContain("gamification");
    });
  });
});

describe("getGoalDefaults", () => {
  it("should return defaults for valid goals", () => {
    expect(getGoalDefaults("NEWSLETTER_SIGNUP")).toBe(GOAL_DEFAULTS.NEWSLETTER_SIGNUP);
    expect(getGoalDefaults("INCREASE_REVENUE")).toBe(GOAL_DEFAULTS.INCREASE_REVENUE);
    expect(getGoalDefaults("ENGAGEMENT")).toBe(GOAL_DEFAULTS.ENGAGEMENT);
  });

  it("should return NEWSLETTER_SIGNUP defaults for unknown goal", () => {
    expect(getGoalDefaults("UNKNOWN" as any)).toBe(GOAL_DEFAULTS.NEWSLETTER_SIGNUP);
  });
});

