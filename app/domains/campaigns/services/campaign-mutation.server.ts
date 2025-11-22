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
  prepareEntityJsonFields,
} from "../utils/json-helpers.js";
import { CampaignServiceError } from "~/lib/errors.server";
// Removed auto generation of discount codes at save time; codes are generated on lead submission
import { CampaignQueryService } from "./campaign-query.server.js";
// import { AdminApiContext } from "@shopify/shopify-app-remix/server";
import { MarketingEventsService } from "~/domains/marketing-events/services/marketing-events.server";

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
    data: CampaignCreateData,
    admin?: any,
    appUrl?: string
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

	    // Enforce plan limits
	    // Only check if we are trying to create an ACTIVE campaign
	    if (data.status === "ACTIVE") {
	      const { PlanGuardService } = await import("~/domains/billing/services/plan-guard.server");
	      await PlanGuardService.assertCanCreateCampaign(storeId);
	    }

	    // Enforce variant limits if part of an experiment
	    if (data.experimentId) {
	      const { PlanGuardService } = await import("~/domains/billing/services/plan-guard.server");
	      await PlanGuardService.assertCanAddVariant(storeId, data.experimentId);
	    }

	    // Enforce feature flags for advanced targeting if used
	    const hasAdvancedTargeting =
	      !!data.targetRules?.audienceTargeting?.enabled ||
	      !!data.targetRules?.audienceTargeting?.shopifySegmentIds?.length ||
	      !!data.targetRules?.audienceTargeting?.sessionRules;
	    if (hasAdvancedTargeting) {
	      const { PlanGuardService } = await import("~/domains/billing/services/plan-guard.server");
	      await PlanGuardService.assertFeatureEnabled(storeId, "advancedTargeting");
	    }

    try {
      // Auto-generate discount code if needed
      const discountConfig = ensureDiscountCode(data.discountConfig);
      const jsonFields = prepareEntityJsonFields(
        { ...data, discountConfig },
        [
          { key: "contentConfig", defaultValue: {} },
          { key: "designConfig", defaultValue: {} },
          { key: "targetRules", defaultValue: {} },
          { key: "discountConfig", defaultValue: {} },
        ],
      );

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
          contentConfig: jsonFields.contentConfig,
          designConfig: jsonFields.designConfig,
          targetRules: jsonFields.targetRules,
          discountConfig: jsonFields.discountConfig,

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

      // Sync to Shopify Marketing Events if admin context is provided
      if (admin && appUrl) {
        const marketingEventId = await MarketingEventsService.createMarketingEvent(
          admin,
          {
            id: campaign.id,
            name: campaign.name,
            description: campaign.description || undefined,
            status: campaign.status,
            startDate: campaign.startDate,
            endDate: campaign.endDate,
          },
          appUrl
        );

        if (marketingEventId) {
          await prisma.campaign.update({
            where: { id: campaign.id },
            data: { marketingEventId },
          });
          campaign.marketingEventId = marketingEventId;
        }
      }

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
    data: CampaignUpdateData,
    admin?: any
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

    // Enforce plan limits if activating
    if (data.status === "ACTIVE") {
      const currentCampaign = await prisma.campaign.findUnique({
        where: { id },
        select: { status: true },
      });

      // Only check if we are changing status to ACTIVE (and it wasn't already)
      if (currentCampaign && currentCampaign.status !== "ACTIVE") {
        const { PlanGuardService } = await import("~/domains/billing/services/plan-guard.server");
        await PlanGuardService.assertCanCreateCampaign(storeId);
      }
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

      // Sync to Shopify Marketing Events if admin context is provided
      if (admin) {
        const campaign = await CampaignQueryService.getById(id, storeId);
        if (campaign?.marketingEventId) {
          await MarketingEventsService.updateMarketingEvent(admin, campaign.marketingEventId, {
            name: data.name,
            startDate: data.startDate,
            endDate: data.endDate,
          });
        }
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
  static async delete(
    id: string,
    storeId: string,
    admin?: any
  ): Promise<boolean> {
    try {
      // Fetch campaign to check for marketing event and experiment
      const campaign = await prisma.campaign.findUnique({
        where: { id, storeId },
        select: { marketingEventId: true, experimentId: true },
      });

      if (!campaign) return false;

      // Sync to Shopify Marketing Events if admin context is provided
      if (admin && campaign.marketingEventId) {
        await MarketingEventsService.deleteMarketingEvent(admin, campaign.marketingEventId);
      }

      const result = await prisma.campaign.deleteMany({
        where: { id, storeId },
      });

      // Cleanup experiment if this was the last variant
      if (campaign.experimentId) {
        const remainingVariants = await prisma.campaign.count({
          where: { experimentId: campaign.experimentId },
        });

        if (remainingVariants === 0) {
          const experiment = await prisma.experiment.findUnique({
            where: { id: campaign.experimentId },
            select: { status: true },
          });

          if (experiment) {
            if (experiment.status === "DRAFT") {
              await prisma.experiment.delete({
                where: { id: campaign.experimentId },
              });
            } else {
              await prisma.experiment.update({
                where: { id: campaign.experimentId },
                data: { status: "ARCHIVED" },
              });
            }
          }
        }
      }

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

