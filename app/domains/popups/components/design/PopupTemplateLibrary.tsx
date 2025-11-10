/**
 * PopupTemplateLibrary - Simple Template Interface
 *
 * Clean wrapper around the unified TemplateService.
 * Provides backward compatibility for existing UI components.
 */

import type { PopupConfig } from "~/domains/storefront/popups/BasePopup";
import type { TemplateType } from "~/lib/unified-template-types";
import {
  TemplateService,
  type Template,
} from "~/domains/popups/services/templates.server";
import { CATEGORIES, type CategoryInfo } from "~/lib/template-categories";
import {
  convertTemplateToPopupTemplate,
  searchTemplatesByQuery,
  filterTemplatesByCategory,
  filterPopularTemplates,
} from "~/domains/popups/utils/template-helpers";

// Types for backward compatibility
export interface PopupTemplate extends PopupConfig {
  templateId: TemplateType;
  name: string;
  category: string; // Category from database (not validated)
  description: string;
  preview: string;
  isPopular?: boolean;
  conversionRate?: number;
}

export type TemplateCategoryInfo = CategoryInfo;

// Re-export categories
export const TEMPLATE_CATEGORIES = CATEGORIES;

/**
 * Simple template functions - all use TemplateService
 */
export async function getPopupTemplates(storeId?: string): Promise<PopupTemplate[]> {
  const templates = await TemplateService.getAllTemplates(storeId);
  return templates.map(convertTemplateToPopupTemplate);
}

export async function getTemplatesByCategory(
  category: string,
  storeId?: string
): Promise<PopupTemplate[]> {
  const templates = await TemplateService.getAllTemplates(storeId);
  return filterTemplatesByCategory(templates, category);
}

export async function getPopularTemplates(storeId?: string): Promise<PopupTemplate[]> {
  const templates = await TemplateService.getAllTemplates(storeId);
  return filterPopularTemplates(templates);
}

export async function getTemplateById(
  templateId: TemplateType,
  storeId?: string
): Promise<PopupTemplate | null> {
  const templates = await TemplateService.getTemplatesByType(templateId, storeId);
  return templates.length > 0 ? convertTemplateToPopupTemplate(templates[0]) : null;
}

export async function searchTemplates(query: string, storeId?: string): Promise<PopupTemplate[]> {
  const templates = await TemplateService.getAllTemplates(storeId);
  return searchTemplatesByQuery(templates, query);
}

export async function getRecommendedTemplates(
  category?: string,
): Promise<PopupTemplate[]> {
  if (category) {
    return await getTemplatesByCategory(category);
  }
  return await getPopularTemplates();
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
