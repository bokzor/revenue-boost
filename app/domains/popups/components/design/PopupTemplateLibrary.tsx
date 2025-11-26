/**
 * PopupTemplateLibrary - Simple Template Interface
 *
 * Clean wrapper around the unified TemplateService.
 * Provides backward compatibility for existing UI components.
 */

import { TemplateService, type Template } from "~/domains/popups/services/templates.server";

/**
 * Simple template functions - all use TemplateService
 */
export async function getPopupTemplates(storeId?: string): Promise<Template[]> {
  const templates = await TemplateService.getAllTemplates(storeId);
  return templates;
}

export async function getTemplateById(
  templateId: string,
  storeId?: string
): Promise<Template | null> {
  const template = await TemplateService.getTemplateById(templateId, storeId);
  return template ?? null;
}

export async function validatePopupTemplates(): Promise<boolean> {
  try {
    const templates = await getPopupTemplates();
    return templates.length > 0;
  } catch (error) {
    console.error("Template validation failed:", error);
    return false;
  }
}
