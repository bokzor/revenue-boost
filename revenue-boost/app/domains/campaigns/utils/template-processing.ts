/**
 * Template Processing Utilities
 * 
 * SOLID Compliance:
 * - Single Responsibility: Each function processes one aspect of templates
 * - All functions are <50 lines
 * - Extracted from TemplateSelector for better reusability and testability
 */

import type { UnifiedTemplate } from "~/domains/popups/services/templates/unified-template-service.server";

// ============================================================================
// TYPES
// ============================================================================

export interface ProcessedTemplate {
  templateId: string;
  name: string;
  category: string;
  description: string | null;
  preview: string;
  isPopular: boolean;
  conversionRate: number;
  id: string;
  title: string;
  buttonText: string;
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  position: string;
  size: string;
  showCloseButton: boolean;
  overlayOpacity: number;
}

// ============================================================================
// JSON PARSING HELPERS
// ============================================================================

export function safeParseJSON<T = Record<string, unknown>>(
  value: unknown,
  fallback: T = {} as T,
  templateId?: string,
  fieldName?: string
): T {
  try {
    if (typeof value === "string") {
      return JSON.parse(value) as T;
    }
    if (typeof value === "object" && value !== null) {
      return value as T;
    }
    return fallback;
  } catch (e) {
    if (process.env.NODE_ENV === "development" && templateId) {
      console.warn(`Failed to parse ${fieldName} for template ${templateId}`, e);
    }
    return fallback;
  }
}

// ============================================================================
// TEMPLATE FIELD EXTRACTORS
// ============================================================================

function getStringField(obj: unknown, field: string, fallback: string): string {
  if (obj && typeof obj === 'object' && field in obj) {
    const value = (obj as Record<string, unknown>)[field];
    return typeof value === 'string' ? value : fallback;
  }
  return fallback;
}

function getBooleanField(obj: unknown, field: string, fallback: boolean): boolean {
  if (obj && typeof obj === 'object' && field in obj) {
    const value = (obj as Record<string, unknown>)[field];
    return typeof value === 'boolean' ? value : fallback;
  }
  return fallback;
}

function getNumberField(obj: unknown, field: string, fallback: number): number {
  if (obj && typeof obj === 'object' && field in obj) {
    const value = (obj as Record<string, unknown>)[field];
    return typeof value === 'number' ? value : fallback;
  }
  return fallback;
}

// ============================================================================
// TEMPLATE PROCESSING
// ============================================================================

export function processTemplate(template: UnifiedTemplate): ProcessedTemplate {
  const contentDefaults = safeParseJSON(
    template.contentConfig,
    {},
    template.id,
    "contentConfig"
  );
  
  const design = safeParseJSON(
    template.designConfig,
    {},
    template.id,
    "designConfig"
  );

  return {
    templateId: template.id,
    name: template.name,
    category: template.category as string,
    description: template.description,
    preview: template.preview || "/templates/default-preview.png",
    isPopular: template.priority > 10,
    conversionRate: template.conversionRate || 0,
    id: `template-${template.id}`,
    title: getStringField(contentDefaults, 'headline', template.name),
    buttonText: getStringField(contentDefaults, 'ctaLabel', "Get Started"),
    backgroundColor: getStringField(design, 'backgroundColor', "#FFFFFF"),
    textColor: getStringField(design, 'textColor', "#000000"),
    buttonColor: getStringField(design, 'buttonColor', "#007BFF"),
    buttonTextColor: getStringField(design, 'buttonTextColor', "#FFFFFF"),
    position: getStringField(design, 'position', "center"),
    size: getStringField(design, 'size', "medium"),
    showCloseButton: getBooleanField(design, 'showCloseButton', true),
    overlayOpacity: getNumberField(design, 'overlayOpacity', 0.6),
  };
}

export function processTemplates(
  templates: UnifiedTemplate[],
  selectedTemplateId?: string
): Array<{ originalTemplate: UnifiedTemplate; processedTemplate: ProcessedTemplate }> {
  return templates.map((template) => {
    const processedTemplate = processTemplate(template);
    
    // Log template comparison for debugging
    if (process.env.NODE_ENV === "development") {
      const isSelected = processedTemplate.templateId === selectedTemplateId;
      console.log(
        `[TemplateSelector] ${template.name}: templateId=${processedTemplate.templateId}, selectedTemplateId=${selectedTemplateId}, isSelected=${isSelected}`
      );
    }

    return {
      originalTemplate: template,
      processedTemplate,
    };
  });
}

