/**
 * Unified Template Service
 * 
 * Re-exports the main TemplateService for backward compatibility
 */

export { TemplateService } from "~/domains/templates/services/template.server";
export type { TemplateWithConfigs as UnifiedTemplate } from "~/domains/templates/types/template";
export type { TemplateType } from "~/domains/campaigns/types/campaign";

