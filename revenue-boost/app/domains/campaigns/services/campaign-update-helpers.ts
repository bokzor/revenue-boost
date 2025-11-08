/**
 * Campaign Update Helpers - Extract update logic into focused functions
 * 
 * SOLID PRINCIPLES APPLIED:
 * ✅ Single Responsibility: Each function handles one aspect of updates
 * ✅ Open/Closed: Easy to add new update types without modifying existing code
 * ✅ Dependency Inversion: Functions depend on abstractions (Prisma types)
 */

import type { Prisma } from "@prisma/client";
import type { CampaignUpdateData } from "../types/campaign";
import { stringifyJsonField } from "../utils/json-helpers";

/**
 * Build basic field updates
 */
export function buildBasicFieldUpdates(
  data: CampaignUpdateData
): Partial<Prisma.CampaignUpdateInput> {
  const updates: Partial<Prisma.CampaignUpdateInput> = {};

  if (data.name !== undefined) updates.name = data.name;
  if (data.description !== undefined) updates.description = data.description;
  if (data.goal !== undefined) updates.goal = data.goal;
  if (data.status !== undefined) updates.status = data.status;
  if (data.priority !== undefined) updates.priority = data.priority;

  return updates;
}

/**
 * Build template reference updates
 */
export function buildTemplateUpdates(
  data: CampaignUpdateData
): Partial<Prisma.CampaignUpdateInput> {
  const updates: Partial<Prisma.CampaignUpdateInput> = {};

  if (data.templateId !== undefined) {
    if (data.templateId === null) {
      updates.template = { disconnect: true };
    } else {
      updates.template = { connect: { id: data.templateId } };
    }
  }

  if (data.templateType !== undefined) {
    updates.templateType = data.templateType;
  }

  return updates;
}

/**
 * Build JSON configuration updates
 */
export function buildConfigUpdates(
  data: CampaignUpdateData
): Partial<Prisma.CampaignUpdateInput> {
  const updates: Partial<Prisma.CampaignUpdateInput> = {};

  if (data.contentConfig !== undefined) {
    updates.contentConfig = stringifyJsonField(data.contentConfig);
  }
  if (data.designConfig !== undefined) {
    updates.designConfig = stringifyJsonField(data.designConfig);
  }
  if (data.targetRules !== undefined) {
    updates.targetRules = stringifyJsonField(data.targetRules);
  }
  if (data.discountConfig !== undefined) {
    updates.discountConfig = stringifyJsonField(data.discountConfig);
  }

  return updates;
}

/**
 * Build A/B testing updates
 */
export function buildExperimentUpdates(
  data: CampaignUpdateData
): Partial<Prisma.CampaignUpdateInput> {
  const updates: Partial<Prisma.CampaignUpdateInput> = {};

  if (data.experimentId !== undefined) {
    if (data.experimentId === null) {
      updates.experiment = { disconnect: true };
    } else {
      updates.experiment = { connect: { id: data.experimentId } };
    }
  }

  if (data.variantKey !== undefined) updates.variantKey = data.variantKey;
  if (data.isControl !== undefined) updates.isControl = data.isControl;

  return updates;
}

/**
 * Build schedule updates
 */
export function buildScheduleUpdates(
  data: CampaignUpdateData
): Partial<Prisma.CampaignUpdateInput> {
  const updates: Partial<Prisma.CampaignUpdateInput> = {};

  if (data.startDate !== undefined) updates.startDate = data.startDate;
  if (data.endDate !== undefined) updates.endDate = data.endDate;

  return updates;
}

/**
 * Combine all update builders into a single update object
 */
export function buildCampaignUpdateData(
  data: CampaignUpdateData
): Prisma.CampaignUpdateInput {
  return {
    ...buildBasicFieldUpdates(data),
    ...buildTemplateUpdates(data),
    ...buildConfigUpdates(data),
    ...buildExperimentUpdates(data),
    ...buildScheduleUpdates(data),
    updatedAt: new Date(),
  };
}

