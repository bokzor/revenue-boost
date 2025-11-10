/**
 * Template Types Enum
 *
 * Re-export of TemplateType from the campaigns domain for convenience.
 * This file exists to maintain backward compatibility with existing imports.
 */

// Re-export the TemplateType type and enum values from the campaigns domain
export type { TemplateType } from "~/domains/campaigns/types/campaign";
export { TemplateTypeEnum } from "~/domains/campaigns/types/campaign";
