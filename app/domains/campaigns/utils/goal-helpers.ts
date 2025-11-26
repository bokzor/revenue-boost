/**
 * Goal Helpers - Utility functions for campaign goals
 *
 * SOLID Compliance:
 * - Single Responsibility: Only handles goal-related utilities
 * - Functions are <10 lines each
 */

import type { CampaignGoal } from "@prisma/client";

export function getGoalDisplayName(goal: CampaignGoal): string {
  switch (goal) {
    case "NEWSLETTER_SIGNUP":
      return "Newsletter Signup";
    case "INCREASE_REVENUE":
      return "Increase Revenue";
    case "ENGAGEMENT":
      return "Engage Customers";
    default:
      return goal;
  }
}
