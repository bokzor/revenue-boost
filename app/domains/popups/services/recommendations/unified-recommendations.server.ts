/**
 * Template Recommendations Service
 */

import type { TemplateType } from "~/domains/campaigns/types/campaign";
import type { CampaignGoal } from "@prisma/client";

export interface TemplateRecommendation {
  templateId: string;
  templateType: TemplateType;
  score: number; // 0-100
}

// Alias for backward compatibility
export type UnifiedRecommendation = TemplateRecommendation & {
  reasoning?: string[];
  confidence?: number | string;
  templateName?: string;
  template?: {
    templateId: string;
    name: string;
    category: string;
    preview?: string;
    isPopular?: boolean;
    conversionRate?: number;
    id: string;
    title: string;
    description: string;
    buttonText: string;
    backgroundColor: string;
    textColor: string;
    buttonColor: string;
    buttonTextColor: string;
    position: string;
    size: string;
    showCloseButton: boolean;
    overlayOpacity: number;
  };
  expectedPerformance?: {
    conversionRate: number;
    conversionLift: number;
  };
  customizations?: {
    suggestedTitle?: string;
    suggestedDescription?: string;
    suggestedButtonText?: string;
    suggestedColors?: {
      backgroundColor?: string;
      buttonColor?: string;
    };
  };
  source?: string;
};

export interface RecommendationContext {
  goal?: CampaignGoal;
  industry?: string;
  targetAudience?: string;
  previousCampaigns?: string[];
}

export async function getRecommendationsForGoal(
  goal: CampaignGoal
): Promise<TemplateRecommendation[]> {
  if (goal === "NEWSLETTER_SIGNUP") {
    return [{ templateId: "newsletter-1", templateType: "NEWSLETTER", score: 95 }];
  }
  return [];
}

