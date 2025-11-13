/**
 * Campaign Mutation Service
 * 
 * Handles all write operations for campaigns (create, update, delete)
 * Single Responsibility: Mutation operations only
 */

import prisma from "~/db.server";
import type {
  CampaignCreateData,
  CampaignUpdateData,
  CampaignWithConfigs,
  DiscountConfig,
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
// Removed auto generation of discount codes at save time; codes are generated on lead submission
import { CampaignQueryService } from "./campaign-query.server.js";

/**
 * Preserve discount config as-is; codes are generated at lead submission time.
 */
function ensureDiscountCode(discountConfig?: DiscountConfig): DiscountConfig | undefined {
  return discountConfig;
}

/**
 * Campaign Mutation Service
 * Focused on write operations only
 */
export class CampaignMutationService {
  /**
   * Create a new campaign with validation
   */
  static async create(
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
      // Auto-generate discount code if needed
      const discountConfig = ensureDiscountCode(data.discountConfig);

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
          discountConfig: stringifyJsonField(discountConfig || {}),

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
   */
  static async update(
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
      return await CampaignQueryService.getById(id, storeId);
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
  static async delete(id: string, storeId: string): Promise<boolean> {
    try {
      const result = await prisma.campaign.deleteMany({
        where: { id, storeId },
      });

      return result.count > 0;
    } catch (error) {
      throw new CampaignServiceError(
        "DELETE_CAMPAIGN_FAILED",
        "Failed to delete campaign",
        error
      );
    }
  }
}

