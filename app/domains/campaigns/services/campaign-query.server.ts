/**
 * Campaign Query Service
 * 
 * Handles all read operations for campaigns
 * Single Responsibility: Query operations only
 */

import prisma from "~/db.server";
import type { CampaignWithConfigs, TemplateType } from "../types/campaign.js";
import { parseCampaignFields } from "../utils/json-helpers.js";
import { CampaignServiceError } from "~/lib/errors.server";
import {
  CAMPAIGN_TEMPLATE_INCLUDE,
  CAMPAIGN_EXPERIMENT_INCLUDE,
  CAMPAIGN_TEMPLATE_INCLUDE_EXTENDED,
  CAMPAIGN_EXPERIMENT_INCLUDE_EXTENDED,
} from "~/lib/service-helpers.server";

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
  static async getById(
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
   */
  static async getActive(storeId: string): Promise<CampaignWithConfigs[]> {
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
    status: string
  ): Promise<CampaignWithConfigs[]> {
    try {
      const campaigns = await prisma.campaign.findMany({
        where: {
          storeId,
          status: status as any,
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

