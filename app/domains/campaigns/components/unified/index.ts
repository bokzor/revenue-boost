/**
 * Unified Campaign Creator Components
 *
 * V2 campaign creation flow with:
 * - Mode selection (single vs experiment)
 * - 2-column layout (preview left, form right)
 * - Collapsible sections for progressive disclosure
 */

export { ModeSelector, type CreationMode } from "./ModeSelector";
export { SingleCampaignFlow, type SingleCampaignFlowProps, type CampaignData } from "./SingleCampaignFlow";
export { CollapsibleSection, type CollapsibleSectionProps } from "./CollapsibleSection";
export { FormSections, type FormSectionsProps } from "./FormSections";
export { ExperimentFlow, type ExperimentFlowProps } from "./ExperimentFlow";

// Re-export types from types.ts
export type { Experiment, Variant, TrafficAllocation, SuccessMetric } from "./types";
export { SUCCESS_METRICS } from "./types";

