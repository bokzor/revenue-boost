/**
 * Goal Options Configuration
 */

import { EmailIcon, CashDollarIcon, HeartIcon } from "@shopify/polaris-icons";
import type { IconSource } from "@shopify/polaris";

export type CampaignGoal = "NEWSLETTER_SIGNUP" | "INCREASE_REVENUE" | "ENGAGEMENT";
export type DifficultyLevel = "Easy" | "Medium" | "Advanced";

export interface GoalOption {
  id: CampaignGoal;
  title: string;
  subtitle: string;
  description: string;
  icon: IconSource;
  iconColor: string;
  benefits: string[];
  metrics: string;
  difficulty: DifficultyLevel;
  badge?: string;
}

export const GOAL_OPTIONS: Record<CampaignGoal, GoalOption> = {
  NEWSLETTER_SIGNUP: {
    id: "NEWSLETTER_SIGNUP",
    title: "Grow Email List",
    subtitle: "Build your subscriber base",
    description: "Collect customer emails to build a direct marketing channel with 3-5x ROI",
    icon: EmailIcon,
    iconColor: "#4F46E5",
    benefits: ["Direct communication", "Higher conversions", "Owned audience"],
    metrics: "15-25% signup rate",
    difficulty: "Easy",
    badge: "Most Popular",
  },

  INCREASE_REVENUE: {
    id: "INCREASE_REVENUE",
    title: "Increase Revenue",
    subtitle: "Boost sales & average order value",
    description:
      "Drive immediate revenue through upsells, cross-sells, bundles, and special offers",
    icon: CashDollarIcon,
    iconColor: "#059669",
    benefits: ["Instant revenue", "Higher AOV", "Clear ROI tracking"],
    metrics: "10-30% conversion lift",
    difficulty: "Medium",
    badge: "Highest ROI",
  },

  ENGAGEMENT: {
    id: "ENGAGEMENT",
    title: "Engage Customers",
    subtitle: "Grow engagement & loyalty",
    description: "Build social proof, increase engagement, and create a loyal brand community",
    icon: HeartIcon,
    iconColor: "#DC2626",
    benefits: ["Social proof", "Customer loyalty", "Brand advocacy"],
    metrics: "20-40% engagement rate",
    difficulty: "Easy",
  },
};

export const getDifficultyColor = (
  difficulty: DifficultyLevel
): "success" | "attention" | "warning" => {
  const colors = {
    Easy: "success",
    Medium: "attention",
    Advanced: "warning",
  } as const;
  return colors[difficulty];
};
