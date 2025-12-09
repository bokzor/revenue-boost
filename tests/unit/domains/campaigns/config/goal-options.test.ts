/**
 * Unit Tests for Goal Options Configuration
 */

import { describe, it, expect } from "vitest";

import { GOAL_OPTIONS, getDifficultyColor } from "~/domains/campaigns/config/goal-options";

describe("GOAL_OPTIONS", () => {
  it("should have three goal options", () => {
    expect(GOAL_OPTIONS).toHaveLength(3);
  });

  it("should have NEWSLETTER_SIGNUP goal", () => {
    const newsletter = GOAL_OPTIONS.find((g) => g.id === "NEWSLETTER_SIGNUP");

    expect(newsletter).toBeDefined();
    expect(newsletter?.title).toBe("Grow Email List");
    expect(newsletter?.recommended).toBe(true);
    expect(newsletter?.badge).toBe("Most Popular");
  });

  it("should have INCREASE_REVENUE goal", () => {
    const revenue = GOAL_OPTIONS.find((g) => g.id === "INCREASE_REVENUE");

    expect(revenue).toBeDefined();
    expect(revenue?.title).toBe("Increase Revenue");
    expect(revenue?.badge).toBe("Highest ROI");
  });

  it("should have ENGAGEMENT goal", () => {
    const engagement = GOAL_OPTIONS.find((g) => g.id === "ENGAGEMENT");

    expect(engagement).toBeDefined();
    expect(engagement?.title).toBe("Engage Customers");
  });

  it("should have required properties for each goal", () => {
    for (const goal of GOAL_OPTIONS) {
      expect(goal.id).toBeDefined();
      expect(goal.title).toBeDefined();
      expect(goal.subtitle).toBeDefined();
      expect(goal.description).toBeDefined();
      expect(goal.icon).toBeDefined();
      expect(goal.iconColor).toBeDefined();
      expect(goal.benefits).toBeDefined();
      expect(Array.isArray(goal.benefits)).toBe(true);
      expect(goal.metrics).toBeDefined();
      expect(goal.difficulty).toBeDefined();
    }
  });

  it("should have valid difficulty levels", () => {
    const validDifficulties = ["Easy", "Medium", "Advanced"];

    for (const goal of GOAL_OPTIONS) {
      expect(validDifficulties).toContain(goal.difficulty);
    }
  });
});

describe("getDifficultyColor", () => {
  it("should return success for Easy", () => {
    expect(getDifficultyColor("Easy")).toBe("success");
  });

  it("should return attention for Medium", () => {
    expect(getDifficultyColor("Medium")).toBe("attention");
  });

  it("should return warning for Advanced", () => {
    expect(getDifficultyColor("Advanced")).toBe("warning");
  });

  it("should return success for unknown difficulty", () => {
    expect(getDifficultyColor("Unknown")).toBe("success");
  });
});

