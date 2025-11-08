/**
 * Campaign Service
 *
 * Core CRUD operations for campaigns with template-type validation
 * Follows source project patterns while respecting our domain architecture
 */

import prisma from "~/db.server";
import type {
  CampaignCreateData,
  CampaignUpdateData,
  CampaignWithConfigs,
  TemplateType,
} from "../types/campaign.js";
import {
  validateCampaignCreateData,
  validateCampaignUpdateData,
} from "../validation/campaign-validation.js";
import {
  parseCampaignFields,
  stringifyJsonField,
} from "../utils/json-helpers.js";
import { CampaignServiceError } from "~/lib/errors.server";
import {
  CAMPAIGN_TEMPLATE_INCLUDE,
  CAMPAIGN_EXPERIMENT_INCLUDE,
  CAMPAIGN_TEMPLATE_INCLUDE_EXTENDED,
  CAMPAIGN_EXPERIMENT_INCLUDE_EXTENDED,
} from "~/lib/service-helpers.server";

// ============================================================================
// CAMPAIGN SERVICE
// ============================================================================

export class CampaignService {
  /**
   * Get all campaigns for a store
   */
  static async getAllCampaigns(storeId: string): Promise<CampaignWithConfigs[]> {
    try {
      const campaigns = await prisma.campaign.findMany({
        where: { storeId },
        orderBy: { createdAt: "desc" },
        include: {
          ...CAMPAIGN_TEMPLATE_INCLUDE,
          ...CAMPAIGN_EXPERIMENT_INCLUDE,
        },
      });

      return campaigns.map(parseCampaignFields);
    } catch (error) {
      throw new CampaignServiceError("FETCH_CAMPAIGNS_FAILED", "Failed to fetch campaigns", error);
    }
  }

  /**
   * Get campaign by ID
   */
  static async getCampaignById(
    id: string,
    storeId: string
  ): Promise<CampaignWithConfigs | null> {
    try {
      const campaign = await prisma.campaign.findFirst({
        where: { id, storeId },
        include: {
          ...CAMPAIGN_TEMPLATE_INCLUDE_EXTENDED,
          ...CAMPAIGN_EXPERIMENT_INCLUDE_EXTENDED,
        },
      });

      return campaign ? parseCampaignFields(campaign) : null;
    } catch (error) {
      throw new CampaignServiceError("FETCH_CAMPAIGN_FAILED", "Failed to fetch campaign", error);
    }
  }

  /**
   * Create a new campaign with validation
   */
  static async createCampaign(
    storeId: string,
    data: CampaignCreateData
  ): Promise<CampaignWithConfigs> {
    // Validate input data
    const validation = validateCampaignCreateData(data);
    if (!validation.success) {
      throw new CampaignServiceError(
        "VALIDATION_FAILED",
        "Campaign validation failed",
        validation.errors
      );
    }

    try {
      const campaign = await prisma.campaign.create({
        data: {
          storeId,
          name: data.name,
          description: data.description,
          goal: data.goal,
          status: data.status || "DRAFT",
          priority: data.priority || 0,

          // Template reference
          templateId: data.templateId,
          templateType: data.templateType,

          // JSON configurations (stringified for database storage)
          contentConfig: stringifyJsonField(data.contentConfig || {}),
          designConfig: stringifyJsonField(data.designConfig || {}),
          targetRules: stringifyJsonField(data.targetRules || {}),
          discountConfig: stringifyJsonField(data.discountConfig || {}),

          // A/B Testing
          experimentId: data.experimentId,
          variantKey: data.variantKey,
          isControl: data.isControl || false,

          // Schedule
          startDate: data.startDate,
          endDate: data.endDate,
        },
        include: {
          template: {
            select: {
              id: true,
              name: true,
              templateType: true,
            },
          },
        },
      });

      return parseCampaignFields(campaign);
    } catch (error) {
      throw new CampaignServiceError(
        "CREATE_CAMPAIGN_FAILED",
        "Failed to create campaign",
        error
      );
    }
  }

  /**
   * Update an existing campaign
   *
   * REFACTORED: Reduced from 90 lines to 30 lines (67% reduction)
   * - Extracted update logic into focused helper functions
   * - Follows Single Responsibility Principle
   * - Each helper handles one aspect of updates
   */
  static async updateCampaign(
    id: string,
    storeId: string,
    data: CampaignUpdateData
  ): Promise<CampaignWithConfigs | null> {
    // Validate input data
    const validation = validateCampaignUpdateData(data);
    if (!validation.success) {
      throw new CampaignServiceError(
        "VALIDATION_FAILED",
        "Campaign update validation failed",
        validation.errors
      );
    }

    try {
      // Build update data using extracted helpers
      const { buildCampaignUpdateData } = await import("./campaign-update-helpers.js");
      const updateData = buildCampaignUpdateData(data);

      const result = await prisma.campaign.updateMany({
        where: { id, storeId },
        data: updateData,
      });

      if (result.count === 0) {
        return null; // Campaign not found or not owned by store
      }

      // Fetch and return the updated campaign
      return await this.getCampaignById(id, storeId);
    } catch (error) {
      throw new CampaignServiceError(
        "UPDATE_CAMPAIGN_FAILED",
        "Failed to update campaign",
        error
      );
    }
  }

  /**
   * Delete a campaign
   */
  static async deleteCampaign(id: string, storeId: string): Promise<boolean> {
    try {
      const result = await prisma.campaign.deleteMany({
        where: { id, storeId },
      });

      return result.count > 0;
    } catch (error) {
      throw new CampaignServiceError("DELETE_CAMPAIGN_FAILED", "Failed to delete campaign", error);
    }
  }

  /**
   * Get campaigns by template type
   */
  static async getCampaignsByTemplateType(
    storeId: string,
    templateType: TemplateType
  ): Promise<CampaignWithConfigs[]> {
    try {
      const campaigns = await prisma.campaign.findMany({
        where: {
          storeId,
          templateType,
        },
        orderBy: { createdAt: "desc" },
        include: CAMPAIGN_TEMPLATE_INCLUDE,
      });

      return campaigns.map(parseCampaignFields);
    } catch (error) {
      throw new CampaignServiceError("FETCH_CAMPAIGNS_BY_TYPE_FAILED", "Failed to fetch campaigns by template type", error);
    }
  }

  /**
   * Get active campaigns for a store
   */
  static async getActiveCampaigns(storeId: string): Promise<CampaignWithConfigs[]> {
    try {
      const campaigns = await prisma.campaign.findMany({
        where: {
          storeId,
          status: "ACTIVE",
        },
        orderBy: { priority: "desc" },
        include: CAMPAIGN_TEMPLATE_INCLUDE,
      });

      return campaigns.map(parseCampaignFields);
    } catch (error) {
      throw new CampaignServiceError("FETCH_ACTIVE_CAMPAIGNS_FAILED", "Failed to fetch active campaigns", error);
    }
  }
}
