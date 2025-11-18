/**
 * Template Service
 *
 * Core CRUD operations for templates
 * Lean and focused on essential template management
 */

import prisma from "~/db.server";
import type { Template } from "@prisma/client";
import type {
  TemplateCreateData,
  TemplateWithConfigs,
} from "../types/template.js";
import { z } from "zod";
import {
  parseJsonField,
  stringifyJsonField,
  parseEntityJsonFields,
  stringifyEntityJsonFields,
} from "../../campaigns/utils/json-helpers.js";
import {
  TemplateFieldSchema,
  parseTemplateContentConfig,
} from "../types/template.js";
import {
  DesignConfigSchema,
  TargetRulesConfigSchema,
  DiscountConfigSchema,
  TemplateTypeSchema,
} from "../../campaigns/types/campaign.js";

type TemplateType = z.infer<typeof TemplateTypeSchema>;
import { TemplateServiceError } from "~/lib/errors.server";
import { globalOrStoreWhere } from "~/lib/service-helpers.server";

// ============================================================================
// TYPES & UTILITIES
// ============================================================================

// TemplateServiceError is now imported from ~/lib/errors.server

/**
 * Parse template entity from database with proper JSON field parsing
 * Uses template-type specific parsing for contentConfig
 */
function parseTemplateEntity(rawTemplate: Template): TemplateWithConfigs {
  const parsed = parseEntityJsonFields(rawTemplate, [
    {
      key: "fields",
      schema: z.array(TemplateFieldSchema),
      defaultValue: [],
    },
    {
      key: "targetRules",
      schema: TargetRulesConfigSchema,
      defaultValue: {},
    },
    {
      key: "designConfig",
      schema: DesignConfigSchema,
      defaultValue: {
        theme: "modern",
        position: "center",
        size: "medium",
        borderRadius: 8,
        imagePosition: "left",
        overlayOpacity: 0.8,
        animation: "fade",
      },
    },
    {
      key: "discountConfig",
      schema: DiscountConfigSchema,
      defaultValue: {
        enabled: false,
        showInPreview: true,
        autoApplyMode: "ajax",
        codePresentation: "show_code",
      },
    },
  ]);

  return {
    ...parsed,
    // Use template-type specific parsing for contentConfig
    contentConfig: parseTemplateContentConfig(
      rawTemplate.contentConfig,
      rawTemplate.templateType,
    ),
  } as TemplateWithConfigs;
}

// ============================================================================
// TEMPLATE CACHING
// ============================================================================

/**
 * Simple in-memory cache for templates
 * Templates rarely change, so caching provides significant performance improvement
 */
const templateCache = new Map<string, { data: TemplateWithConfigs[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(storeId?: string, templateType?: TemplateType): string {
  return `${storeId || 'global'}_${templateType || 'all'}`;
}

function getFromCache(key: string): TemplateWithConfigs[] | null {
  const cached = templateCache.get(key);
  if (!cached) return null;

  const isExpired = Date.now() - cached.timestamp > CACHE_TTL;
  if (isExpired) {
    templateCache.delete(key);
    return null;
  }

  return cached.data;
}

function setCache(key: string, data: TemplateWithConfigs[]): void {
  templateCache.set(key, { data, timestamp: Date.now() });
}

/**
 * Clear template cache (useful after template updates)
 */
export function clearTemplateCache(): void {
  templateCache.clear();
  console.log('[Template Cache] Cache cleared');
}

// ============================================================================
// TEMPLATE SERVICE
// ============================================================================

export class TemplateService {
  /**
   * Get all templates for a store (including global templates)
   * Uses in-memory caching for performance (5 minute TTL)
   */
  static async getAllTemplates(storeId?: string): Promise<TemplateWithConfigs[]> {
    try {
      // Check cache first
      const cacheKey = getCacheKey(storeId);
      const cached = getFromCache(cacheKey);
      if (cached) {
        console.log(`[Template Cache] HIT for key: ${cacheKey} (${cached.length} templates)`);
        return cached;
      }

      console.log(`[Template Cache] MISS for key: ${cacheKey}`);
      const startTime = Date.now();

      const templates = await prisma.template.findMany({
        where: {
          ...globalOrStoreWhere(storeId),
          isActive: true,
        },
        orderBy: [
          { priority: "desc" },
          { createdAt: "desc" },
        ],
      });

      const result = templates.map(parseTemplateEntity);

      console.log(`[Performance] Template query took ${Date.now() - startTime}ms (${result.length} templates)`);

      // Cache the result
      setCache(cacheKey, result);

      return result;
    } catch (error) {
      throw new TemplateServiceError("FETCH_TEMPLATES_FAILED", "Failed to fetch templates", error);
    }
  }

  /**
   * Get template by ID
   */
  static async getTemplateById(
    id: string,
    storeId?: string
  ): Promise<TemplateWithConfigs | null> {
    try {
      const template = await prisma.template.findFirst({
        where: {
          id,
          ...globalOrStoreWhere(storeId),
        },
      });

      return template ? parseTemplateEntity(template) : null;
    } catch (error) {
      throw new TemplateServiceError("FETCH_TEMPLATE_FAILED", "Failed to fetch template", error);
    }
  }

  /**
   * Get templates by type
   * Uses in-memory caching for performance (5 minute TTL)
   */
  static async getTemplatesByType(
    templateType: TemplateType,
    storeId?: string
  ): Promise<TemplateWithConfigs[]> {
    try {
      // Check cache first
      const cacheKey = getCacheKey(storeId, templateType);
      const cached = getFromCache(cacheKey);
      if (cached) {
        console.log(`[Template Cache] HIT for key: ${cacheKey} (${cached.length} templates)`);
        return cached;
      }

      console.log(`[Template Cache] MISS for key: ${cacheKey}`);
      const startTime = Date.now();

      const templates = await prisma.template.findMany({
        where: {
          templateType,
          ...globalOrStoreWhere(storeId),
          isActive: true,
        },
        orderBy: [
          { priority: "desc" },
          { createdAt: "desc" },
        ],
      });

      const result = templates.map(parseTemplateEntity);

      console.log(`[Performance] Template query (type: ${templateType}) took ${Date.now() - startTime}ms (${result.length} templates)`);

      // Cache the result
      setCache(cacheKey, result);

      return result;
    } catch (error) {
      throw new TemplateServiceError("FETCH_TEMPLATES_BY_TYPE_FAILED", "Failed to fetch templates by type", error);
    }
  }

  /**
   * Create a new template
   */
  static async createTemplate(
    data: TemplateCreateData
  ): Promise<TemplateWithConfigs> {
    try {
      const jsonFields = stringifyEntityJsonFields(data, [
        { key: "contentConfig", defaultValue: {} },
        { key: "fields", defaultValue: [] },
        { key: "targetRules", defaultValue: {} },
        { key: "designConfig", defaultValue: {} },
        { key: "discountConfig", defaultValue: {} },
      ]);

      const template = await prisma.template.create({
        data: {
          storeId: data.storeId,
          templateType: data.templateType,
          name: data.name,
          description: data.description,
          category: data.category,
          goals: data.goals,

          // JSON configurations (matching Prisma schema field names)
          ...jsonFields,

          // Metadata
          isDefault: data.isDefault || false,
          isActive: data.isActive !== false, // Default to true
          priority: data.priority || 1,
          icon: data.icon,
          preview: data.preview,
          conversionRate: data.conversionRate,
        },
      });

      // Clear cache after creating template
      clearTemplateCache();

        return parseTemplateEntity(template);
    } catch (error) {
      throw new TemplateServiceError("CREATE_TEMPLATE_FAILED", "Failed to create template", error);
    }
  }

  /**
   * Get default template for a template type
   */
  static async getDefaultTemplate(
    templateType: TemplateType
  ): Promise<TemplateWithConfigs | null> {
    try {
      const template = await prisma.template.findFirst({
        where: {
          templateType,
          isDefault: true,
          isActive: true,
          storeId: null, // Global templates only
        },
        orderBy: { priority: "desc" },
      });

      return template ? parseTemplateEntity(template) : null;
    } catch (error) {
      throw new TemplateServiceError("FETCH_DEFAULT_TEMPLATE_FAILED", "Failed to fetch default template", error);
    }
  }
}
