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
  return {
    ...rawTemplate,
    // Use template-type specific parsing for contentConfig
    contentConfig: parseTemplateContentConfig(rawTemplate.contentConfig, rawTemplate.templateType),
    fields: parseJsonField(rawTemplate.fields, z.array(TemplateFieldSchema), []),
    targetRules: parseJsonField(rawTemplate.targetRules, TargetRulesConfigSchema, {}),
    designConfig: parseJsonField(rawTemplate.designConfig, DesignConfigSchema, {
      theme: "professional-blue",
      position: "center",
      size: "medium",
      borderRadius: 8,
      overlayOpacity: 0.8,
      animation: "fade"
    }),
    discountConfig: parseJsonField(rawTemplate.discountConfig, DiscountConfigSchema, {
      enabled: false
    }),
  };
}

// ============================================================================
// TEMPLATE SERVICE
// ============================================================================

export class TemplateService {
  /**
   * Get all templates for a store (including global templates)
   */
  static async getAllTemplates(storeId?: string): Promise<TemplateWithConfigs[]> {
    try {
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

      return templates.map(parseTemplateEntity);
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
   */
  static async getTemplatesByType(
    templateType: TemplateType,
    storeId?: string
  ): Promise<TemplateWithConfigs[]> {
    try {
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

      return templates.map(parseTemplateEntity);
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
      const template = await prisma.template.create({
        data: {
          storeId: data.storeId,
            templateType: data.templateType,
            name: data.name,
            description: data.description,
            category: data.category,
            goals: data.goals,

            // JSON configurations (matching Prisma schema field names)
            contentConfig: stringifyJsonField(data.contentConfig || {}),
            fields: stringifyJsonField(data.fields || []),
            targetRules: stringifyJsonField(data.targetRules || {}),
            designConfig: stringifyJsonField(data.designConfig || {}),
            discountConfig: stringifyJsonField(data.discountConfig || {}),

            // Metadata
            isDefault: data.isDefault || false,
            isActive: data.isActive !== false, // Default to true
            priority: data.priority || 1,
            icon: data.icon,
            preview: data.preview,
            conversionRate: data.conversionRate,
          },
        });

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
