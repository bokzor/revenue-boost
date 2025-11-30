/**
 * Campaign Domain Server Exports
 *
 * Central export point for all campaign domain functionality.
 * Re-exports shared types/schemas plus server-only services.
 */

// ============================================================================
// SHARED EXPORTS (Types, Schemas, Validation, Utilities)
// ============================================================================

export * from "./types.shared.js";

// ============================================================================
// SERVER-ONLY TYPES
// ============================================================================

// Storefront context types (server-only due to validation dependencies)
export type { StorefrontContext } from "./types/storefront-context.js";

export { buildStorefrontContext, validateStorefrontContext } from "./types/storefront-context.js";

// ============================================================================
// SERVER-ONLY SERVICES
// ============================================================================

export { CampaignService } from "./services/campaign.server.js";

export { CampaignFilterService } from "./services/campaign-filter.server.js";

export { ExperimentService } from "./services/experiment.server.js";

export { CampaignAnalyticsService } from "./services/campaign-analytics.server.js";
export type {
  GlobalMetrics,
  GlobalMetricsWithComparison,
  CampaignRanking,
  TemplatePerformance,
  DateRangeOptions,
} from "./services/campaign-analytics.server.js";

// Service errors are now exported from ~/lib/errors.server
export { CampaignServiceError, ExperimentServiceError } from "~/lib/errors.server";
