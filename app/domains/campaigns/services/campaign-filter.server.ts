/**
 * Campaign Filter Service
 *
 * Server-side filtering of campaigns based on storefront context
 * This reduces the amount of data sent to the client and improves security
 */

import type { CampaignWithConfigs } from "~/domains/campaigns/types/campaign";
import type { StorefrontContext } from "~/domains/campaigns/types/storefront-context";
import { FrequencyCapService } from "~/domains/targeting/services/frequency-cap.server";
import {
  hasSegmentMembershipData,
  isCustomerInAnyShopifySegment,
} from "~/domains/targeting/services/segment-membership.server";
import prisma from "~/db.server";
import type { StoreSettings } from "~/domains/store/types/settings";
import { logger } from "~/lib/logger.server";

/**
 * Campaign Filter Service
 * Filters campaigns based on various targeting rules
 */
export class CampaignFilterService {
  /**
   * Filter campaigns by device type
   */
  static filterByDeviceType(
    campaigns: CampaignWithConfigs[],
    context: StorefrontContext
  ): CampaignWithConfigs[] {
    if (!context.deviceType) {
      logger.debug("[CampaignFilter] No device type in context, skipping device filter");
      return campaigns;
    }

    const device = context.deviceType!;
    logger.debug({ device }, "[CampaignFilter] Filtering by device type");

    return campaigns.filter((campaign) => {
      const deviceTargeting = campaign.targetRules?.enhancedTriggers?.device_targeting;

      // If no device targeting configured, include campaign
      if (!deviceTargeting || deviceTargeting.enabled === false) {
        return true;
      }

      const allowedDevices =
        Array.isArray(deviceTargeting.device_types) && deviceTargeting.device_types.length > 0
          ? deviceTargeting.device_types
          : ["desktop", "tablet", "mobile"];

      const matches = allowedDevices.includes(device);

      if (matches) {
        logger.debug({ campaignId: campaign.id, campaignName: campaign.name, device }, "[CampaignFilter] Device targeting matched");
      } else {
        logger.debug({ campaignId: campaign.id, campaignName: campaign.name, device, allowedDevices }, "[CampaignFilter] Device targeting not matched");
      }

      return matches;
    });
  }

  /**
   * Filter campaigns by geographic targeting
   *
   * Uses the country code from Shopify's X-Country-Code header
   * to include/exclude campaigns based on visitor location.
   */
  static filterByGeoTargeting(
    campaigns: CampaignWithConfigs[],
    context: StorefrontContext
  ): CampaignWithConfigs[] {
    const country = context.country?.toUpperCase();

    if (!country) {
      logger.debug("[CampaignFilter] No country code in context, skipping geo filter");
      return campaigns;
    }

    logger.debug({ country }, "[CampaignFilter] Filtering by geo targeting");

    return campaigns.filter((campaign) => {
      const geoTargeting = campaign.targetRules?.geoTargeting;

      // If no geo targeting configured or disabled, include campaign
      if (!geoTargeting || !geoTargeting.enabled) {
        return true;
      }

      const { mode, countries } = geoTargeting;

      // If no countries specified, include campaign (no filter applied)
      if (!countries || countries.length === 0) {
        logger.debug({ campaignId: campaign.id }, "[CampaignFilter] Geo targeting enabled but no countries specified");
        return true;
      }

      const isInList = countries.includes(country);
      let matches: boolean;

      if (mode === "include") {
        matches = isInList;
      } else {
        matches = !isInList;
      }

      if (matches) {
        logger.debug({ campaignId: campaign.id, mode, country }, "[CampaignFilter] Geo targeting matched");
      } else {
        logger.debug({ campaignId: campaign.id, mode, country, countries }, "[CampaignFilter] Geo targeting not matched");
      }

      return matches;
    });
  }

  /**
   * Filter campaigns by page targeting
   */
  static filterByPageTargeting(
    campaigns: CampaignWithConfigs[],
    context: StorefrontContext
  ): CampaignWithConfigs[] {
    if (!context.pageUrl) {
      logger.debug("[CampaignFilter] No page URL in context, skipping page filter");
      return campaigns;
    }

    logger.debug({ pageUrl: context.pageUrl }, "[CampaignFilter] Filtering by page targeting");

    return campaigns.filter((campaign) => {
      // Use dedicated pageTargeting config; legacy enhancedTriggers.page_targeting is no longer supported
      const pageTargeting = campaign.targetRules?.pageTargeting;

      // If no page targeting, include campaign
      if (!pageTargeting || !pageTargeting.enabled) {
        return true;
      }

      const targetPages = pageTargeting.pages || [];
      const customPatterns = pageTargeting.customPatterns || [];
      const excludePages = pageTargeting.excludePages || [];
      const productTags = pageTargeting.productTags || [];
      const collections = pageTargeting.collections || [];

      const pageUrl = context.pageUrl!;

      // Exclusion check first
      const isExcluded = excludePages.some((pattern: string) =>
        this.matchesPagePattern(pageUrl, pattern)
      );
      if (isExcluded) {
        logger.debug({ campaignId: campaign.id }, "[CampaignFilter] Page excluded by pattern");
        return false;
      }

      // Page URL / pattern match
      const allPatterns = [...targetPages, ...customPatterns];
      let urlMatches = true;
      if (allPatterns.length > 0) {
        urlMatches = allPatterns.some((pattern) => this.matchesPagePattern(pageUrl, pattern));
      }

      // Product tag match (only if configured and we have productTags in context)
      let tagsMatch = true;
      if (productTags.length > 0) {
        const ctxTags = Array.isArray(context.productTags) ? context.productTags : [];
        tagsMatch = ctxTags.length > 0 && productTags.some((tag) => ctxTags.includes(tag));
      }

      // Collection match (only if configured and we have collectionId in context)
      let collectionsMatch = true;
      if (collections.length > 0) {
        const ctxCollectionId = context.collectionId;
        if (!ctxCollectionId) {
          collectionsMatch = false;
        } else {
          collectionsMatch = collections.some((gid) => {
            const parts = gid.split("/");
            const idPart = parts[parts.length - 1];
            return idPart === ctxCollectionId;
          });
        }
      }

      const matches = urlMatches && tagsMatch && collectionsMatch;

      if (matches) {
        logger.debug({ campaignId: campaign.id }, "[CampaignFilter] Page targeting matched");
      } else {
        logger.debug({ campaignId: campaign.id, urlMatches, tagsMatch, collectionsMatch }, "[CampaignFilter] Page targeting not matched");
      }

      return matches;
    });
  }

  /**
   * Filter campaigns by audience targeting (Shopify segments).
   *
   * Shopify segments are stored in our own database (SegmentMembership) via
   * background sync and are NEVER exposed to the storefront. This method does
   * NOT call the Shopify Admin API; it only reads from our database.
   *
   * Runtime behavior:
   * - If shopifySegmentIds are configured AND membership data exists for those
   *   segments, the visitor MUST belong to at least one of them.
   * - If NO membership data exists yet for the configured segments, we ignore
   *   the segment filter (fail-open).
   *
   * Note: Cart-based targeting is now handled by the cart_value trigger in
   * Enhanced Triggers (client-side) via polling /cart.js.
   */
  static async filterByAudienceSegments(
    campaigns: CampaignWithConfigs[],
    context: StorefrontContext,
    storeId: string
  ): Promise<CampaignWithConfigs[]> {
    logger.debug({ campaignCount: campaigns.length }, "[CampaignFilter] Filtering by audience segments");

    if (!campaigns || campaigns.length === 0) {
      return [];
    }

    const customerIdStr = context.customerId;
    let shopifyCustomerId: bigint | null = null;

    if (customerIdStr) {
      try {
        const numericPart = customerIdStr.includes("/")
          ? customerIdStr.split("/").pop()!
          : customerIdStr;
        shopifyCustomerId = BigInt(numericPart);
      } catch (error) {
        logger.warn({ customerIdStr, error }, "[CampaignFilter] Failed to parse customerId as BigInt");
      }
    }

    const result: CampaignWithConfigs[] = [];
    const membershipDataCache = new Map<string, boolean>();

    for (const campaign of campaigns) {
      const targeting = campaign.targetRules?.audienceTargeting;

      if (!targeting || !targeting.enabled) {
        logger.debug({ campaignId: campaign.id }, "[CampaignFilter] Audience targeting disabled, including");
        result.push(campaign);
        continue;
      }

      const segmentIds = targeting.shopifySegmentIds ?? [];
      let segmentsMatch = true;

      if (segmentIds.length > 0) {
        const key = segmentIds.slice().sort().join("|");
        let hasData = membershipDataCache.get(key);

        if (hasData === undefined) {
          hasData = await hasSegmentMembershipData({ storeId, segmentIds });
          membershipDataCache.set(key, hasData);
        }

        if (!hasData) {
          logger.debug({ campaignId: campaign.id, segmentIds, storeId }, "[CampaignFilter] No segment membership data, fail-open");
          segmentsMatch = true;
        } else if (!shopifyCustomerId) {
          logger.debug({ campaignId: campaign.id, segmentIds }, "[CampaignFilter] No customerId in context, excluding");
          segmentsMatch = false;
        } else {
          const inAnySegment = await isCustomerInAnyShopifySegment({
            storeId,
            shopifyCustomerId,
            segmentIds,
          });

          segmentsMatch = inAnySegment;

          if (segmentsMatch) {
            logger.debug({ campaignId: campaign.id, customerId: shopifyCustomerId.toString() }, "[CampaignFilter] Customer in segment");
          } else {
            logger.debug({ campaignId: campaign.id, customerId: shopifyCustomerId.toString(), segmentIds }, "[CampaignFilter] Customer not in segments");
          }
        }
      }

      if (!segmentsMatch) {
        continue;
      }

      logger.debug({ campaignId: campaign.id }, "[CampaignFilter] Audience targeting matched");
      result.push(campaign);
    }

    logger.debug({ matched: result.length, total: campaigns.length }, "[CampaignFilter] Audience filter result");

    return result;
  }

  /**
   * Filter campaigns by frequency capping (Redis-based)
   *
   * Server-side filtering using Redis to track frequency caps
   * Ensures campaigns respect session, daily, and cooldown limits
   */
  static async filterByFrequencyCapping(
    campaigns: CampaignWithConfigs[],
    context: StorefrontContext,
    storeSettings?: StoreSettings
  ): Promise<CampaignWithConfigs[]> {
    logger.debug({ campaignCount: campaigns.length }, "[FrequencyCap] Checking campaigns");

    const results = await Promise.all(
      campaigns.map(async (campaign) => {
        const result = await FrequencyCapService.checkFrequencyCapping(
          campaign,
          context,
          storeSettings
        );

        logger.debug({ campaignId: campaign.id, allowed: result.allowed, reason: result.reason }, "[FrequencyCap] Result");

        return result.allowed ? campaign : null;
      })
    );

    const filtered = results.filter((campaign): campaign is CampaignWithConfigs => campaign !== null);
    logger.debug({ passed: filtered.length, total: campaigns.length }, "[FrequencyCap] Final result");

    return filtered;
  }

  /**
   * Filter campaigns by A/B test variant assignment
   *
   * For campaigns that are part of an experiment, only return ONE variant per visitor
   * Uses visitor ID to consistently assign the same variant to the same user
   */
  static filterByVariantAssignment(
    campaigns: CampaignWithConfigs[],
    context: StorefrontContext
  ): CampaignWithConfigs[] {
    logger.debug({ campaignCount: campaigns.length }, "[CampaignFilter] Filtering by variant assignment");

    // Group campaigns by experimentId
    const experimentGroups = new Map<string, CampaignWithConfigs[]>();
    const standaloneCampaigns: CampaignWithConfigs[] = [];

    campaigns.forEach((campaign) => {
      if (campaign.experimentId) {
        const existing = experimentGroups.get(campaign.experimentId) || [];
        existing.push(campaign);
        experimentGroups.set(campaign.experimentId, existing);
      } else {
        standaloneCampaigns.push(campaign);
      }
    });

    // For each experiment, select ONE variant based on visitor ID
    const selectedVariants: CampaignWithConfigs[] = [];

    experimentGroups.forEach((variants, experimentId) => {
      logger.debug({ experimentId, variantCount: variants.length }, "[CampaignFilter] Experiment variants");

      const visitorId = context.visitorId || context.sessionId || "anonymous";
      const hash = this.hashString(visitorId + experimentId);
      const selectedIndex = hash % variants.length;
      const selected = variants[selectedIndex];

      logger.debug({ experimentId, selectedVariant: selected.variantKey, visitorId: visitorId.substring(0, 8) }, "[CampaignFilter] Selected variant");
      selectedVariants.push(selected);
    });

    const result = [...standaloneCampaigns, ...selectedVariants];
    logger.debug({ total: result.length, standalone: standaloneCampaigns.length, variants: selectedVariants.length }, "[CampaignFilter] Variant assignment result");

    return result;
  }

  /**
   * Simple string hash function for consistent variant assignment
   */
  private static hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Apply all filters to campaigns
   * Now async to support Redis-based frequency capping
   */
  static async filterCampaigns(
    campaigns: CampaignWithConfigs[],
    context: StorefrontContext,
    storeId: string
  ): Promise<CampaignWithConfigs[]> {
    logger.debug({ campaignCount: campaigns.length, campaignIds: campaigns.map((c) => c.id) }, "[CampaignFilter] Starting filtering");

    let filtered = campaigns;

    // Fetch store settings for global frequency capping
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { settings: true },
    });
    const storeSettings = store?.settings as StoreSettings | undefined;

    filtered = await this.runFilterStep("DEVICE_TYPE", (cs, ctx) => this.filterByDeviceType(cs, ctx), filtered, context);
    filtered = await this.runFilterStep("GEO_TARGETING", (cs, ctx) => this.filterByGeoTargeting(cs, ctx), filtered, context);
    filtered = await this.runFilterStep("PAGE_TARGETING", (cs, ctx) => this.filterByPageTargeting(cs, ctx), filtered, context);
    filtered = await this.runFilterStep("AUDIENCE_SEGMENTS", (cs, ctx) => this.filterByAudienceSegments(cs, ctx, storeId), filtered, context);
    filtered = await this.runFilterStep("VARIANT_ASSIGNMENT", (cs, ctx) => this.filterByVariantAssignment(cs, ctx), filtered, context);
    filtered = await this.runFilterStep("FREQUENCY_CAPPING", (cs, ctx) => this.filterByFrequencyCapping(cs, ctx, storeSettings), filtered, context);

    logger.info({ finalCount: filtered.length, campaignIds: filtered.map((c) => c.id) }, "[CampaignFilter] Filtering complete");

    return filtered;
  }

  /**
   * Apply a single filter step with standardized logging.
   */
  private static async runFilterStep(
    label: string,
    filter: (
      campaigns: CampaignWithConfigs[],
      context: StorefrontContext
    ) => CampaignWithConfigs[] | Promise<CampaignWithConfigs[]>,
    campaigns: CampaignWithConfigs[],
    context: StorefrontContext
  ): Promise<CampaignWithConfigs[]> {
    const result = await filter(campaigns, context);

    if (campaigns.length !== result.length) {
      const resultIds = new Set(result.map(c => c.id));
      const excluded = campaigns.filter(c => !resultIds.has(c.id)).map(c => c.id);
      logger.debug({ filter: label, input: campaigns.length, output: result.length, excluded }, "[CampaignFilter] Filter step");
    }

    return result;
  }

  /**
   * Helper: Match page URL against pattern (supports wildcards)
   */
  private static matchesPagePattern(pageUrl: string, pattern: string): boolean {
    // Convert wildcard pattern to regex
    const regexPattern = pattern.replace(/\*/g, ".*").replace(/\?/g, ".");

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(pageUrl);
  }
}
