/**
 * Template Helper Utilities
 *
 * Shared utility functions for template operations
 */

import type { Template } from "~/domains/popups/services/templates.server";
import type { PopupTemplate } from "~/domains/popups/components/design/PopupTemplateLibrary";

/**
 * Convert Template to PopupTemplate for UI compatibility
 */
export function convertTemplateToPopupTemplate(template: Template): PopupTemplate {
  const design = template.designConfig || {};
  const content = template.contentConfig || {};

  return {
    templateId: template.templateType,
    name: template.name,
    category: template.category,
    description: template.description,
    preview: template.preview || `/templates/${template.templateType}-preview.png`,
    isPopular: template.isDefault,
    conversionRate: template.conversionRate ?? undefined,

    id: template.id,
    title: (content.headline as string) ?? template.name,
    buttonText: (content.buttonText as string) ?? "Click Here",
    backgroundColor: (design.backgroundColor as string) ?? "#FFFFFF",
    textColor: (design.textColor as string) ?? "#000000",
    buttonColor: (design.buttonColor as string) ?? "#0066CC",
    buttonTextColor: "#FFFFFF",
    position: (design.position as "center" | "top" | "bottom" | "left" | "right") ?? "center",
    size: (design.size as "small" | "medium" | "large") ?? "medium",
    showCloseButton: true,
    overlayOpacity: (design.overlayOpacity as number) ?? 0.8,
  };
}

/**
 * Filter templates by predicate and convert to PopupTemplate
 */
export function filterAndConvertTemplates(
  templates: Template[],
  predicate: (template: Template) => boolean
): PopupTemplate[] {
  return templates.filter(predicate).map(convertTemplateToPopupTemplate);
}

/**
 * Search templates by query string
 */
export function searchTemplatesByQuery(
  templates: Template[],
  query: string
): PopupTemplate[] {
  const lowerQuery = query.toLowerCase();
  return filterAndConvertTemplates(
    templates,
    (t) =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Filter templates by category
 */
export function filterTemplatesByCategory(
  templates: Template[],
  category: string
): PopupTemplate[] {
  return filterAndConvertTemplates(templates, (t) => t.category === category);
}

/**
 * Filter popular/default templates
 */
export function filterPopularTemplates(templates: Template[]): PopupTemplate[] {
  return filterAndConvertTemplates(templates, (t) => t.isDefault);
}

