/**
 * Campaign Query Service
 *
 * Handles all read operations for campaigns
 * Single Responsibility: Query operations only
 */

import prisma from "~/db.server";
import type { CampaignStatus, CampaignWithConfigs, TemplateType } from "../types/campaign.js";
import { parseCampaignFields } from "../utils/json-helpers.js";
import { CampaignServiceError } from "~/lib/errors.server";
import {
  CAMPAIGN_TEMPLATE_INCLUDE,
  CAMPAIGN_EXPERIMENT_INCLUDE,
  CAMPAIGN_TEMPLATE_INCLUDE_EXTENDED,
  CAMPAIGN_EXPERIMENT_INCLUDE_EXTENDED,
} from "~/lib/service-helpers.server";
import { isWithinSchedule } from "../utils/schedule-helpers.js";

/**
 * Campaign Query Service
 * Focused on read operations only
 */
export class CampaignQueryService {
  /**
   * Get all campaigns for a store
   */
  static async getAll(storeId: string): Promise<CampaignWithConfigs[]> {
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
  static async getById(id: string, storeId: string): Promise<CampaignWithConfigs | null> {
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
   * Get campaigns by template type
   */
  static async getByTemplateType(
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
      throw new CampaignServiceError(
        "FETCH_CAMPAIGNS_BY_TYPE_FAILED",
        "Failed to fetch campaigns by template type",
        error
      );
    }
  }

  /**
   * Get active campaigns for a store
   * Filters by status AND schedule (timezone-aware)
   */
  static async getActive(storeId: string): Promise<CampaignWithConfigs[]> {
    try {
      // Fetch store timezone for schedule filtering
      const store = await prisma.store.findUnique({
        where: { id: storeId },
        select: { timezone: true },
      });
      const timezone = store?.timezone || "UTC";

      const campaigns = await prisma.campaign.findMany({
        where: {
          storeId,
          status: "ACTIVE",
        },
        orderBy: { priority: "desc" },
        include: CAMPAIGN_TEMPLATE_INCLUDE,
      });

      // Parse JSON fields
      const parsedCampaigns = campaigns.map(parseCampaignFields);

      // Filter by schedule (timezone-aware)
      const activeCampaigns = parsedCampaigns.filter((campaign) => {
        const withinSchedule = isWithinSchedule(
          campaign.startDate,
          campaign.endDate,
          timezone
        );

        if (!withinSchedule) {
          console.log(
            `[CampaignQuery] Campaign "${campaign.name}" (${campaign.id}) excluded: outside schedule window`,
            {
              startDate: campaign.startDate,
              endDate: campaign.endDate,
              timezone,
            }
          );
        }

        return withinSchedule;
      });

      console.log(
        `[CampaignQuery] Active campaigns for store ${storeId}: ${activeCampaigns.length}/${parsedCampaigns.length} within schedule (timezone: ${timezone})`
      );

      return activeCampaigns;
    } catch (error) {
      throw new CampaignServiceError(
        "FETCH_ACTIVE_CAMPAIGNS_FAILED",
        "Failed to fetch active campaigns",
        error
      );
    }
  }

  /**
   * Get campaigns by status
   */
  static async getByStatus(
    storeId: string,
    status: CampaignStatus
  ): Promise<CampaignWithConfigs[]> {
    try {
      const campaigns = await prisma.campaign.findMany({
        where: {
          storeId,
          status,
        },
        orderBy: { createdAt: "desc" },
        include: CAMPAIGN_TEMPLATE_INCLUDE,
      });

      return campaigns.map(parseCampaignFields);
    } catch (error) {
      throw new CampaignServiceError(
        "FETCH_CAMPAIGNS_BY_STATUS_FAILED",
        `Failed to fetch ${status} campaigns`,
        error
      );
    }
  }

  /**
   * Get campaigns by experiment ID
   */
  static async getByExperiment(
    storeId: string,
    experimentId: string
  ): Promise<CampaignWithConfigs[]> {
    try {
      const campaigns = await prisma.campaign.findMany({
        where: {
          storeId,
          experimentId,
        },
        orderBy: { createdAt: "desc" },
        include: CAMPAIGN_EXPERIMENT_INCLUDE_EXTENDED,
      });

      return campaigns.map(parseCampaignFields);
    } catch (error) {
      throw new CampaignServiceError(
        "FETCH_CAMPAIGNS_BY_EXPERIMENT_FAILED",
        "Failed to fetch campaigns by experiment",
        error
      );
    }
  }
}
