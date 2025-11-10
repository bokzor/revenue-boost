/**
 * Popup Templates Service
 * 
 * Re-exports the main TemplateService for backward compatibility
 */

export { TemplateService } from "~/domains/templates/services/template.server";
export type { TemplateWithConfigs as Template } from "~/domains/templates/types/template";
export type { TemplateType } from "~/domains/campaigns/types/campaign";

