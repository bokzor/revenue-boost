/**
 * Unit Tests for Goal Options Configuration
 *
 * Tests the campaign goal options and difficulty color helper.
 */

import { describe, it, expect } from "vitest";

import {
  GOAL_OPTIONS,
  getDifficultyColor,
  type CampaignGoal,
  type DifficultyLevel,
  type GoalOption,
} from "~/domains/campaigns/config/goal-options.config";

describe("Goal Options Configuration", () => {
  describe("GOAL_OPTIONS", () => {
    it("should have all three goal types", () => {
      expect(Object.keys(GOAL_OPTIONS)).toHaveLength(3);
      expect(GOAL_OPTIONS.NEWSLETTER_SIGNUP).toBeDefined();
      expect(GOAL_OPTIONS.INCREASE_REVENUE).toBeDefined();
      expect(GOAL_OPTIONS.ENGAGEMENT).toBeDefined();
    });

    it("should have correct structure for NEWSLETTER_SIGNUP", () => {
      const goal = GOAL_OPTIONS.NEWSLETTER_SIGNUP;

      expect(goal.id).toBe("NEWSLETTER_SIGNUP");
      expect(goal.title).toBe("Grow Email List");
      expect(goal.subtitle).toBe("Build your subscriber base");
      expect(goal.description).toContain("email");
      expect(goal.icon).toBeDefined();
      expect(goal.iconColor).toBe("#4F46E5");
      expect(goal.benefits).toHaveLength(3);
      expect(goal.metrics).toContain("signup rate");
      expect(goal.difficulty).toBe("Easy");
      expect(goal.badge).toBe("Most Popular");
    });

    it("should have correct structure for INCREASE_REVENUE", () => {
      const goal = GOAL_OPTIONS.INCREASE_REVENUE;

      expect(goal.id).toBe("INCREASE_REVENUE");
      expect(goal.title).toBe("Increase Revenue");
      expect(goal.subtitle).toContain("sales");
      expect(goal.description).toContain("revenue");
      expect(goal.icon).toBeDefined();
      expect(goal.iconColor).toBe("#059669");
      expect(goal.benefits).toHaveLength(3);
      expect(goal.metrics).toContain("conversion");
      expect(goal.difficulty).toBe("Medium");
      expect(goal.badge).toBe("Highest ROI");
    });

    it("should have correct structure for ENGAGEMENT", () => {
      const goal = GOAL_OPTIONS.ENGAGEMENT;

      expect(goal.id).toBe("ENGAGEMENT");
      expect(goal.title).toBe("Engage Customers");
      expect(goal.subtitle).toContain("engagement");
      expect(goal.description).toContain("social proof");
      expect(goal.icon).toBeDefined();
      expect(goal.iconColor).toBe("#DC2626");
      expect(goal.benefits).toHaveLength(3);
      expect(goal.metrics).toContain("engagement rate");
      expect(goal.difficulty).toBe("Easy");
      expect(goal.badge).toBeUndefined();
    });

    it("should have valid icon colors (hex format)", () => {
      const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;

      Object.values(GOAL_OPTIONS).forEach((goal) => {
        expect(goal.iconColor).toMatch(hexColorRegex);
      });
    });

    it("should have valid difficulty levels", () => {
      const validDifficulties: DifficultyLevel[] = ["Easy", "Medium", "Advanced"];

      Object.values(GOAL_OPTIONS).forEach((goal) => {
        expect(validDifficulties).toContain(goal.difficulty);
      });
    });
  });

  describe("getDifficultyColor", () => {
    it("should return success for Easy difficulty", () => {
      expect(getDifficultyColor("Easy")).toBe("success");
    });

    it("should return attention for Medium difficulty", () => {
      expect(getDifficultyColor("Medium")).toBe("attention");
    });

    it("should return warning for Advanced difficulty", () => {
      expect(getDifficultyColor("Advanced")).toBe("warning");
    });
  });

  describe("Type Exports", () => {
    it("should export CampaignGoal type", () => {
      const goal: CampaignGoal = "NEWSLETTER_SIGNUP";
      expect(goal).toBe("NEWSLETTER_SIGNUP");
    });

    it("should export DifficultyLevel type", () => {
      const difficulty: DifficultyLevel = "Medium";
      expect(difficulty).toBe("Medium");
    });

    it("should export GoalOption interface", () => {
      const option: GoalOption = GOAL_OPTIONS.NEWSLETTER_SIGNUP;
      expect(option.id).toBeDefined();
      expect(option.title).toBeDefined();
    });
  });
});

