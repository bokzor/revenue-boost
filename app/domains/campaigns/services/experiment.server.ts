/**
 * Experiment Service
 *
 * A/B testing operations for campaigns
 * Lean implementation focused on essential experiment management
 */

import prisma from "~/db.server";
import type {
  ExperimentCreateData,
  ExperimentWithVariants,
} from "../types/experiment.js";
import {
  validateExperimentCreateData,
} from "../validation/campaign-validation.js";
import {
  parseExperimentFields,
  stringifyEntityJsonFields,
} from "../utils/json-helpers.js";
import { ExperimentServiceError } from "~/lib/errors.server";
import {
  EXPERIMENT_CAMPAIGNS_INCLUDE,
  EXPERIMENT_CAMPAIGNS_INCLUDE_EXTENDED,
  mapCampaignsToVariants,
} from "~/lib/service-helpers.server";

// ============================================================================
// EXPERIMENT SERVICE
// ============================================================================

export class ExperimentService {
  /**
   * Get all experiments for a store
   */
  static async getAllExperiments(storeId: string): Promise<ExperimentWithVariants[]> {
    try {
      const experiments = await prisma.experiment.findMany({
        where: { storeId },
        orderBy: { createdAt: "desc" },
        include: EXPERIMENT_CAMPAIGNS_INCLUDE,
      });

      return experiments.map((exp) => {
        const parsed = parseExperimentFields(exp);
        return {
          ...parsed,
          variants: mapCampaignsToVariants(exp.campaigns, parsed.trafficAllocation),
        };
      });
    } catch (error) {
      throw new ExperimentServiceError("FETCH_EXPERIMENTS_FAILED", "Failed to fetch experiments", error);
    }
  }

  /**
   * Get experiments by IDs
   * Optimized query to fetch only specific experiments (avoids N+1 query)
   */
  static async getExperimentsByIds(
    storeId: string,
    experimentIds: string[]
  ): Promise<ExperimentWithVariants[]> {
    try {
      if (experimentIds.length === 0) {
        return [];
      }

      const experiments = await prisma.experiment.findMany({
        where: {
          storeId,
          id: { in: experimentIds },
        },
        orderBy: { createdAt: "desc" },
        include: EXPERIMENT_CAMPAIGNS_INCLUDE,
      });

      return experiments.map((exp) => {
        const parsed = parseExperimentFields(exp);
        return {
          ...parsed,
          variants: mapCampaignsToVariants(exp.campaigns, parsed.trafficAllocation),
        };
      });
    } catch (error) {
      throw new ExperimentServiceError(
        "FETCH_EXPERIMENTS_BY_IDS_FAILED",
        "Failed to fetch experiments by IDs",
        error
      );
    }
  }

  /**
   * Get experiment by ID
   */
  static async getExperimentById(
    id: string,
    storeId: string
  ): Promise<ExperimentWithVariants | null> {
    try {
      const experiment = await prisma.experiment.findFirst({
        where: { id, storeId },
        include: EXPERIMENT_CAMPAIGNS_INCLUDE_EXTENDED,
      });

      if (!experiment) return null;

      const parsed = parseExperimentFields(experiment);

      return {
        ...parsed,
        variants: mapCampaignsToVariants(experiment.campaigns, parsed.trafficAllocation),
      };
    } catch (error) {
      throw new ExperimentServiceError("FETCH_EXPERIMENT_FAILED", "Failed to fetch experiment", error);
    }
  }

  /**
   * Create a new experiment
   */
  static async createExperiment(
    storeId: string,
    data: ExperimentCreateData
  ): Promise<ExperimentWithVariants> {
    // Validate input data
    const validation = validateExperimentCreateData(data);
    if (!validation.success) {
      throw new ExperimentServiceError(
        "VALIDATION_FAILED",
        "Experiment validation failed",
        validation.errors
      );
    }

    // Enforce plan limits
    const { PlanGuardService } = await import("~/domains/billing/services/plan-guard.server");
    await PlanGuardService.assertCanCreateExperiment(storeId);

    try {
      const jsonFields = stringifyEntityJsonFields(data, [
        {
          key: "trafficAllocation",
          defaultValue: {
            A: 50,
            B: 50,
          },
        },
        { key: "statisticalConfig", defaultValue: {} },
        { key: "successMetrics", defaultValue: {} },
      ]);

      const experiment = await prisma.experiment.create({
        data: {
          storeId,
          name: data.name,
          description: data.description,
          hypothesis: data.hypothesis,

          // JSON configurations
          trafficAllocation: jsonFields.trafficAllocation,
          statisticalConfig: jsonFields.statisticalConfig,
          successMetrics: jsonFields.successMetrics,

          // Timeline
          startDate: data.startDate,
          endDate: data.endDate,
          plannedDurationDays: data.plannedDurationDays,
        },
        include: {
          campaigns: {
            select: {
              id: true,
              name: true,
              variantKey: true,
              isControl: true,
              status: true,
            },
          },
        },
      });

      const parsed = parseExperimentFields(experiment);

      return {
        ...parsed,
        variants: [], // No variants initially
      };
    } catch (error) {
      throw new ExperimentServiceError(
        "CREATE_EXPERIMENT_FAILED",
        "Failed to create experiment",
        error
      );
    }
  }

  /**
   * Get running experiments for a store
   */
  static async getRunningExperiments(storeId: string): Promise<ExperimentWithVariants[]> {
    try {
      const experiments = await prisma.experiment.findMany({
        where: {
          storeId,
          status: "RUNNING",
        },
        orderBy: { startDate: "desc" },
        include: {
          campaigns: {
            where: {
              status: "ACTIVE",
            },
            select: {
              id: true,
              name: true,
              variantKey: true,
              isControl: true,
              status: true,
            },
          },
        },
      });

      return experiments.map((exp) => {
        const parsed = parseExperimentFields(exp);
        return {
          ...parsed,
          variants: mapCampaignsToVariants(exp.campaigns, parsed.trafficAllocation),
        };
      });
    } catch (error) {
      throw new ExperimentServiceError("FETCH_RUNNING_EXPERIMENTS_FAILED", "Failed to fetch running experiments", error);
    }
  }
}
