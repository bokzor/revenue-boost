/**
 * A/B Testing Analytics Types
 * 
 * Re-exports experiment types from the campaigns domain for analytics purposes.
 * This file exists to maintain backward compatibility with existing imports.
 */

// Re-export experiment types from campaigns domain
export type {
  ExperimentStatus,
  TrafficAllocation,
  StatisticalConfig,
  SuccessMetrics,
  BaseExperiment,
  ExperimentWithVariants,
  ExperimentCreateData,
  ExperimentUpdateData,
} from "~/domains/campaigns/types/experiment";

export type {
  ExperimentStatusSchema,
  TrafficAllocationSchema,
  StatisticalConfigSchema,
  SuccessMetricsSchema,
  BaseExperimentSchema,
  ExperimentWithVariantsSchema,
  ExperimentCreateDataSchema,
  ExperimentUpdateDataSchema,
} from "~/domains/campaigns/types/experiment";

// Additional analytics-specific types
export type ExperimentType = "A/B" | "A/B/C" | "A/B/C/D" | "MULTIVARIATE";

export type SuccessMetric = 
  | "conversion_rate"
  | "revenue_per_visitor"
  | "email_signups"
  | "click_through_rate"
  | "engagement_rate"
  | "bounce_rate"
  | "time_on_page";

export interface ExperimentMetrics {
  variant: string;
  impressions: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  revenuePerVisitor: number;
  confidence: number;
  isWinner: boolean;
}

export interface ExperimentResults {
  experimentId: string;
  status: import("~/domains/campaigns/types/experiment").ExperimentStatus;
  startDate: Date;
  endDate?: Date;
  metrics: ExperimentMetrics[];
  winnerId?: string;
  winnerDeclaredAt?: Date;
  statisticalSignificance: number;
}

