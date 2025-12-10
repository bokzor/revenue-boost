import { logger } from "~/lib/logger.server";
import prisma from "~/db.server";
import { logger } from "~/lib/logger.server";
import { ServiceError } from "~/lib/errors.server";
import type { PopupEventType, VariantKey, Prisma } from "@prisma/client";

export interface PopupEventInput {
  storeId: string;
  campaignId: string;
  experimentId?: string | null;
  variantKey?: VariantKey | null;
  leadId?: string | null;
  sessionId?: string | null;
  visitorId?: string | null;
  eventType: PopupEventType;
  pageUrl?: string | null;
  pageTitle?: string | null;
  referrer?: string | null;
  userAgent?: string | null;
  ipAddress?: string | null;
  deviceType?: string | null;
  metadata?: Prisma.InputJsonValue;
}

/**
 * PopupEventService
 *
 * Responsible for recording and aggregating popup analytics events
 * (impressions, submissions, coupon issuance, etc.).
 */
export class PopupEventService {
  /**
   * Record a single popup analytics event.
   *
   * This is the low-level primitive used by storefront tracking,
   * lead submission, and any other event producers.
   */
  static async recordEvent(input: PopupEventInput): Promise<void> {
    // Skip analytics for preview campaigns.
    // Preview campaigns use synthetic IDs (e.g. "preview-<token>") when
    // rendering popups from the admin preview flow. These impressions and
    // interactions should not count towards usage limits or analytics.
    if (input.campaignId.startsWith("preview-")) {
      return;
    }

    // Enforce monthly impression cap for VIEW events before recording.
    // This ensures impressions are hard-capped at write time.
    if (input.eventType === "VIEW") {
      const { PlanGuardService } = await import("~/domains/billing/services/plan-guard.server");
      await PlanGuardService.assertWithinMonthlyImpressionCap(input.storeId);
    }

    try {
      await prisma.popupEvent.create({
        data: {
          storeId: input.storeId,
          campaignId: input.campaignId,
          experimentId: input.experimentId ?? null,
          variantKey: input.variantKey ?? null,
          leadId: input.leadId ?? null,
          sessionId: input.sessionId || input.visitorId || "",
          visitorId: input.visitorId ?? null,
          eventType: input.eventType,
          pageUrl: input.pageUrl ?? null,
          pageTitle: input.pageTitle ?? null,
          referrer: input.referrer ?? null,
          userAgent: input.userAgent ?? null,
          ipAddress: input.ipAddress ?? null,
          deviceType: input.deviceType ?? null,
          metadata: input.metadata,
        },
      });
    } catch (error) {
      console.error("[Analytics] Failed to record popup event", {
        input,
        error,
      });
      throw new ServiceError("POPUP_EVENT_CREATE_FAILED", "Failed to record popup event", error);
    }
  }

  /**
   * Get impression (VIEW) counts per campaign.
   *
   * Used by CampaignAnalyticsService and plan/usage enforcement.
   */
  private static buildWhere(
    campaignIds: string[],
    eventType: PopupEventType,
    options?: { storeId?: string; from?: Date; to?: Date }
  ): Prisma.PopupEventWhereInput {
    const where: Prisma.PopupEventWhereInput = {
      campaignId: { in: campaignIds },
      eventType,
    };

    if (options?.storeId) {
      where.storeId = options.storeId;
    }

    if (options?.from || options?.to) {
      const dateRange: Prisma.DateTimeFilter = {};
      if (options.from) dateRange.gte = options.from;
      if (options.to) dateRange.lte = options.to;
      where.createdAt = dateRange;
    }

    return where;
  }

  static async getImpressionCountsByCampaign(
    campaignIds: string[],
    options?: { storeId?: string; from?: Date; to?: Date }
  ): Promise<Map<string, number>> {
    if (campaignIds.length === 0) return new Map();

    try {
      const where = PopupEventService.buildWhere(campaignIds, "VIEW", options);

      const rows = await prisma.popupEvent.groupBy({
        by: ["campaignId"],
        where,
        _count: { id: true },
      });

      const result = new Map<string, number>();
      rows.forEach((row) => {
        result.set(row.campaignId, row._count.id);
      });

      return result;
    } catch (error) {
      throw new ServiceError(
        "POPUP_EVENT_IMPRESSIONS_FAILED",
        "Failed to fetch impression counts",
        error
      );
    }
  }

  /**
   * Get submit (SUBMIT) counts per campaign.
   */
  static async getSubmitCountsByCampaign(
    campaignIds: string[],
    options?: { storeId?: string; from?: Date; to?: Date }
  ): Promise<Map<string, number>> {
    if (campaignIds.length === 0) return new Map();

    try {
      const where = PopupEventService.buildWhere(campaignIds, "SUBMIT", options);

      const rows = await prisma.popupEvent.groupBy({
        by: ["campaignId"],
        where,
        _count: { id: true },
      });

      const result = new Map<string, number>();
      rows.forEach((row) => {
        result.set(row.campaignId, row._count.id);
      });

      return result;
    } catch (error) {
      throw new ServiceError("POPUP_EVENT_SUBMITS_FAILED", "Failed to fetch submit counts", error);
    }
  }

  /**
   * Get coupon issuance (COUPON_ISSUED) counts per campaign.
   */
  static async getCouponIssuedCountsByCampaign(
    campaignIds: string[],
    options?: { storeId?: string; from?: Date; to?: Date }
  ): Promise<Map<string, number>> {
    if (campaignIds.length === 0) return new Map();

    try {
      const where = PopupEventService.buildWhere(campaignIds, "COUPON_ISSUED", options);

      const rows = await prisma.popupEvent.groupBy({
        by: ["campaignId"],
        where,
        _count: { id: true },
      });

      const result = new Map<string, number>();
      rows.forEach((row) => {
        result.set(row.campaignId, row._count.id);
      });

      return result;
    } catch (error) {
      throw new ServiceError(
        "POPUP_EVENT_COUPONS_FAILED",
        "Failed to fetch coupon issuance counts",
        error
      );
    }
  }

  /**
   * Get click (CLICK) counts per campaign.
   */
  static async getClickCountsByCampaign(
    campaignIds: string[],
    options?: { storeId?: string; from?: Date; to?: Date }
  ): Promise<Map<string, number>> {
    if (campaignIds.length === 0) return new Map();

    try {
      const where = PopupEventService.buildWhere(campaignIds, "CLICK", options);

      const rows = await prisma.popupEvent.groupBy({
        by: ["campaignId"],
        where,
        _count: { id: true },
      });

      const result = new Map<string, number>();
      rows.forEach((row) => {
        result.set(row.campaignId, row._count.id);
      });

      return result;
    } catch (error) {
      throw new ServiceError("POPUP_EVENT_CLICKS_FAILED", "Failed to fetch click counts", error);
    }
  }

  /**
   * Get simple funnel stats (views  submits  coupons issued) per campaign.
   */
  static async getFunnelStatsByCampaign(
    campaignIds: string[],
    options?: { storeId?: string; from?: Date; to?: Date }
  ): Promise<Map<string, { views: number; submits: number; couponsIssued: number }>> {
    if (campaignIds.length === 0) return new Map();

    try {
      const [views, submits, coupons] = await Promise.all([
        this.getImpressionCountsByCampaign(campaignIds, options),
        this.getSubmitCountsByCampaign(campaignIds, options),
        this.getCouponIssuedCountsByCampaign(campaignIds, options),
      ]);

      const result = new Map<string, { views: number; submits: number; couponsIssued: number }>();

      for (const campaignId of campaignIds) {
        result.set(campaignId, {
          views: views.get(campaignId) ?? 0,
          submits: submits.get(campaignId) ?? 0,
          couponsIssued: coupons.get(campaignId) ?? 0,
        });
      }

      return result;
    } catch (error) {
      throw new ServiceError("POPUP_EVENT_FUNNEL_FAILED", "Failed to fetch funnel stats", error);
    }
  }
}
