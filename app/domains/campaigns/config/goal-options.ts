/**
 * Goal Options Configuration
 *
 * SOLID Compliance:
 * - Single Responsibility: Defines goal options data
 * - Extracted from GoalSelectorV2 component
 * - Easier to maintain and test
 */

import { EmailIcon, CashDollarIcon, HeartIcon } from "@shopify/polaris-icons";
import type { CampaignGoal } from "@prisma/client";

import type { IconProps } from "@shopify/polaris";

export interface GoalOption {
  id: CampaignGoal;
  title: string;
  subtitle: string;
  description: string;
  icon: IconProps["source"];
  iconColor: string;
  benefits: string[];
  metrics: string;
  difficulty: "Easy" | "Medium" | "Advanced";
  badge?: string;
  recommended?: boolean;
}

export const GOAL_OPTIONS: GoalOption[] = [
  {
    id: "NEWSLETTER_SIGNUP",
    title: "Grow Email List",
    subtitle: "Build your subscriber base",
    description: "Collect customer emails to build a direct marketing channel with 3-5x ROI",
    icon: EmailIcon,
    iconColor: "#4F46E5", // Indigo
    benefits: ["Direct communication", "Higher conversions", "Owned audience"],
    metrics: "15-25% signup rate",
    difficulty: "Easy",
    badge: "Most Popular",
    recommended: true,
  },
  {
    id: "INCREASE_REVENUE",
    title: "Increase Revenue",
    subtitle: "Boost sales & average order value",
    description:
      "Drive immediate revenue through upsells, cross-sells, bundles, and special offers",
    icon: CashDollarIcon,
    iconColor: "#059669", // Green
    benefits: ["Instant revenue", "Higher AOV", "Clear ROI tracking"],
    metrics: "10-30% conversion lift",
    difficulty: "Medium",
    badge: "Highest ROI",
  },
  {
    id: "ENGAGEMENT",
    title: "Engage Customers",
    subtitle: "Grow engagement & loyalty",
    description: "Build social proof, increase engagement, and create a loyal brand community",
    icon: HeartIcon,
    iconColor: "#DC2626", // Red
    benefits: ["Social proof", "Customer loyalty", "Brand advocacy"],
    metrics: "20-40% engagement rate",
    difficulty: "Easy",
  },
];

export function getDifficultyColor(difficulty: string): "success" | "attention" | "warning" {
  switch (difficulty) {
    case "Easy":
      return "success";
    case "Medium":
      return "attention";
    case "Advanced":
      return "warning";
    default:
      return "success";
  }
}
