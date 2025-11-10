/**
 * Template Configurations
 */

import type {
  NewsletterContent,
  SpinToWinContent,
  SocialProofContent,
  ScratchCardContent,
} from "~/domains/campaigns/types/campaign";

// Re-export base types
export type {
  NewsletterContent,
  SpinToWinContent,
  SocialProofContent,
  ScratchCardContent,
} from "~/domains/campaigns/types/campaign";

// Template config aliases for backward compatibility
export type NewsletterTemplateConfig = NewsletterContent & {
  inputBackgroundColor?: string;
};

export type LotteryTemplateConfig = SpinToWinContent;
export type ScratchCardTemplateConfig = ScratchCardContent;
export type SocialProofConfig = SocialProofContent;
