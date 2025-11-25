/**
 * Experiment Types for A/B Testing
 *
 * Part of the Campaign domain - experiments are tightly coupled to campaigns
 */

import { z } from "zod";

// ============================================================================
// EXPERIMENT STATUS
// ============================================================================

export const ExperimentStatusSchema = z.enum([
  "DRAFT",
  "RUNNING",
  "PAUSED",
  "COMPLETED",
  "ARCHIVED",
]);

export type ExperimentStatus = z.infer<typeof ExperimentStatusSchema>;

// ============================================================================
// EXPERIMENT CONFIGURATION SCHEMAS
// ============================================================================

/**
 * Traffic Allocation Configuration
 * Defines how traffic is split between variants
 */
export const TrafficAllocationSchema = z
  .object({
    A: z.number().min(0).max(100),
    B: z.number().min(0).max(100),
    C: z.number().min(0).max(100).optional(),
    D: z.number().min(0).max(100).optional(),
  })
  .refine(
    (data) => {
      const total = data.A + data.B + (data.C || 0) + (data.D || 0);
      return total === 100;
    },
    {
      message: "Traffic allocation must sum to 100%",
    }
  );

/**
 * Statistical Configuration
 */
export const StatisticalConfigSchema = z.object({
  confidenceLevel: z.number().min(0.8).max(0.99).default(0.95),
  minimumSampleSize: z.number().int().min(100).default(1000),
  minimumDetectableEffect: z.number().min(0.01).max(1).default(0.05), // 5% minimum effect
  maxDurationDays: z.number().int().min(1).max(90).default(30),
});

/**
 * Success Metrics Configuration
 */
export const SuccessMetricsSchema = z.object({
  primaryMetric: z.enum([
    "conversion_rate",
    "revenue_per_visitor",
    "email_signups",
    "click_through_rate",
    "engagement_rate",
  ]),
  secondaryMetrics: z
    .array(
      z.enum([
        "conversion_rate",
        "revenue_per_visitor",
        "email_signups",
        "click_through_rate",
        "engagement_rate",
        "bounce_rate",
        "time_on_page",
      ])
    )
    .optional(),
});

// ============================================================================
// EXPERIMENT SCHEMAS
// ============================================================================

/**
 * Base Experiment Schema
 */
export const BaseExperimentSchema = z.object({
  id: z.string().cuid(),
  storeId: z.string().cuid(),
  name: z.string().min(1, "Experiment name is required").max(255),
  description: z.string().max(1000).nullable(),
  hypothesis: z.string().max(2000).nullable(),
  status: ExperimentStatusSchema.default("DRAFT"),

  // Configuration
  trafficAllocation: TrafficAllocationSchema,
  statisticalConfig: StatisticalConfigSchema,
  successMetrics: SuccessMetricsSchema,

  // Timeline
  startDate: z.date().nullable(),
  endDate: z.date().nullable(),
  plannedDurationDays: z.number().int().min(1).max(90).nullable(),

  // Results
  winnerId: z.string().cuid().nullable(), // Campaign ID of winning variant
  winnerDeclaredAt: z.date().nullable(),

  // Timestamps
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

/**
 * Experiment with Variants Schema
 * Includes the associated campaign variants
 */
export const ExperimentWithVariantsSchema = BaseExperimentSchema.extend({
  variants: z.array(
    z.object({
      id: z.string().cuid(),
      variantKey: z.enum(["A", "B", "C", "D"]),
      name: z.string(),
      isControl: z.boolean(),
      trafficPercentage: z.number().min(0).max(100),
      status: z.string(), // Campaign status (DRAFT, ACTIVE, PAUSED, ARCHIVED)
    })
  ),
});

/**
 * Experiment Create Data Schema
 */
export const ExperimentCreateDataSchema = z.object({
  name: z.string().min(1, "Experiment name is required").max(255),
  description: z.string().max(1000).optional(),
  hypothesis: z.string().max(2000).optional(),

  // Configuration
  trafficAllocation: TrafficAllocationSchema,
  statisticalConfig: StatisticalConfigSchema.optional(),
  successMetrics: SuccessMetricsSchema,

  // Timeline
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  plannedDurationDays: z.number().int().min(1).max(90).optional(),
});

export const ExperimentUpdateDataSchema = ExperimentCreateDataSchema.partial().extend({
  id: z.string().cuid(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type TrafficAllocation = z.infer<typeof TrafficAllocationSchema>;
export type StatisticalConfig = z.infer<typeof StatisticalConfigSchema>;
export type SuccessMetrics = z.infer<typeof SuccessMetricsSchema>;
export type BaseExperiment = z.infer<typeof BaseExperimentSchema>;
export type ExperimentWithVariants = z.infer<typeof ExperimentWithVariantsSchema>;
export type ExperimentCreateData = z.infer<typeof ExperimentCreateDataSchema>;
export type ExperimentUpdateData = z.infer<typeof ExperimentUpdateDataSchema>;
