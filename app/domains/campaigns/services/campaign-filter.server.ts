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
      console.log("[Revenue Boost] ⚠️ No device type in context, skipping device filter");
      return campaigns;
    }

    const device = context.deviceType!;
    console.log(
      `[Revenue Boost] 📱 Filtering campaigns by device type (enhancedTriggers.device_targeting): ${device}`
    );

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
        console.log(
          `[Revenue Boost] ✅ Campaign "${campaign.name}" (${campaign.id}): matches device targeting (${device})`
        );
      } else {
        console.log(
          `[Revenue Boost] ❌ Campaign "${campaign.name}" (${campaign.id}): does NOT match device targeting`
        );
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
      console.log(
        "[Revenue Boost] ⚠️ No country code in context, skipping geo targeting filter"
      );
      return campaigns;
    }

    console.log(
      `[Revenue Boost] 🌍 Filtering campaigns by geographic targeting. Visitor country: ${country}`
    );

    return campaigns.filter((campaign) => {
      const geoTargeting = campaign.targetRules?.geoTargeting;

      // If no geo targeting configured or disabled, include campaign
      if (!geoTargeting || !geoTargeting.enabled) {
        return true;
      }

      const { mode, countries } = geoTargeting;

      // If no countries specified, include campaign (no filter applied)
      if (!countries || countries.length === 0) {
        console.log(
          `[Revenue Boost] ⚠️ Campaign "${campaign.name}" (${campaign.id}): Geo targeting enabled but no countries specified, including`
        );
        return true;
      }

      const isInList = countries.includes(country);
      let matches: boolean;

      if (mode === "include") {
        // Show only to visitors from selected countries
        matches = isInList;
      } else {
        // Exclude mode: show to all except selected countries
        matches = !isInList;
      }

      if (matches) {
        console.log(
          `[Revenue Boost] ✅ Campaign "${campaign.name}" (${campaign.id}): Geo targeting matched (${mode} mode, country=${country})`
        );
      } else {
        console.log(
          `[Revenue Boost] ❌ Campaign "${campaign.name}" (${campaign.id}): Geo targeting did NOT match (${mode} mode, country=${country}, countries=${countries.join(",")})`
        );
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
      console.log("[Revenue Boost] ⚠️ No page URL in context, skipping page targeting filter");
      return campaigns;
    }

    console.log(
      `[Revenue Boost] 📄 Filtering campaigns by page targeting. Current page: ${context.pageUrl}`
    );

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
        console.log(
          `[Revenue Boost] ❌ Campaign "${campaign.name}" (${campaign.id}): Page is excluded by pattern`
        );
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
        console.log(
          `[Revenue Boost] ✅ Campaign "${campaign.name}" (${campaign.id}): Page targeting MATCHED`
        );
      } else {
        console.log(
          `[Revenue Boost] ❌ Campaign "${campaign.name}" (${campaign.id}): Page targeting did NOT match`
        );
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
    console.log("[Revenue Boost] 👥 Filtering campaigns by audience targeting (Shopify segments)");

    if (!campaigns || campaigns.length === 0) {
      return [];
    }

    const customerIdStr = context.customerId;
    let shopifyCustomerId: bigint | null = null;

    if (customerIdStr) {
      try {
        // Support either a plain numeric ID ("123") or a Shopify GID
        // ("gid://shopify/Customer/123").
        const numericPart = customerIdStr.includes("/")
          ? customerIdStr.split("/").pop()!
          : customerIdStr;
        shopifyCustomerId = BigInt(numericPart);
      } catch (error) {
        console.warn("[Revenue Boost] ⚠️ Failed to parse customerId as BigInt", {
          customerIdStr,
          error,
        });
      }
    }

    const result: CampaignWithConfigs[] = [];
    const membershipDataCache = new Map<string, boolean>();

    for (const campaign of campaigns) {
      const targeting = campaign.targetRules?.audienceTargeting;

      // If no audience targeting, include campaign
      if (!targeting || !targeting.enabled) {
        console.log(
          `[Revenue Boost] ✅ Campaign "${campaign.name}" (${campaign.id}): Audience targeting disabled, including`
        );
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
          console.log(
            `[Revenue Boost] ⚠️ Campaign "${campaign.name}" (${campaign.id}): Shopify segments configured (${JSON.stringify(segmentIds)}) but no membership data found for store ${storeId}; ignoring segment filter (fail-open)`
          );
          segmentsMatch = true;
        } else if (!shopifyCustomerId) {
          console.log(
            `[Revenue Boost] ❌ Campaign "${campaign.name}" (${campaign.id}): Shopify segments configured (${JSON.stringify(segmentIds)}) and membership data exists, but no valid customerId in context; excluding`
          );
          segmentsMatch = false;
        } else {
          const inAnySegment = await isCustomerInAnyShopifySegment({
            storeId,
            shopifyCustomerId,
            segmentIds,
          });

          segmentsMatch = inAnySegment;

          if (segmentsMatch) {
            console.log(
              `[Revenue Boost] ✅ Campaign "${campaign.name}" (${campaign.id}): customer ${shopifyCustomerId.toString()} is in at least one required Shopify segment`
            );
          } else {
            console.log(
              `[Revenue Boost] ❌ Campaign "${campaign.name}" (${campaign.id}): customer ${shopifyCustomerId.toString()} is NOT in any of required Shopify segments ${JSON.stringify(segmentIds)}`
            );
          }
        }
      }

      if (!segmentsMatch) {
        continue;
      }

      console.log(
        `[Revenue Boost] ✅ Campaign "${campaign.name}" (${campaign.id}): audience targeting matched`
      );
      result.push(campaign);
    }

    console.log(
      `[Revenue Boost] 👥 Audience targeting filter result: ${result.length} of ${campaigns.length} campaigns matched`
    );

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
    console.log(`[FrequencyCap Filter] 🔍 Checking ${campaigns.length} campaigns`);

    const results = await Promise.all(
      campaigns.map(async (campaign) => {
        console.log(`[FrequencyCap Filter] Checking campaign: ${campaign.name} (${campaign.id})`);

        const result = await FrequencyCapService.checkFrequencyCapping(
          campaign,
          context,
          storeSettings
        );

        console.log(`[FrequencyCap Filter] ${campaign.name}: ${result.allowed ? '✅ ALLOWED' : '❌ BLOCKED'}`,
          result.reason ? `(${result.reason})` : '');

        return result.allowed ? campaign : null;
      })
    );

    const filtered = results.filter((campaign): campaign is CampaignWithConfigs => campaign !== null);
    console.log(`[FrequencyCap Filter] Final: ${filtered.length}/${campaigns.length} campaigns passed`);

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
    console.log("[Revenue Boost] 🧪 Filtering campaigns by variant assignment");

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
      console.log(
        `[Revenue Boost] 🧪 Experiment ${experimentId}: ${variants.length} variants found`
      );
      console.log(
        `[Revenue Boost] 📋 Variants:`,
        variants.map((v) => `${v.name} (${v.variantKey})`)
      );

      // Use visitor ID to deterministically select a variant
      // This ensures the same visitor always sees the same variant
      const visitorId = context.visitorId || context.sessionId || "anonymous";
      const hash = this.hashString(visitorId + experimentId);
      const selectedIndex = hash % variants.length;
      const selected = variants[selectedIndex];

      console.log(
        `[Revenue Boost] ✅ Selected variant: ${selected.name} (${selected.variantKey}) for visitor ${visitorId.substring(0, 8)}...`
      );
      selectedVariants.push(selected);
    });

    const result = [...standaloneCampaigns, ...selectedVariants];
    console.log(
      `[Revenue Boost] 🧪 After variant assignment: ${result.length} campaigns (${standaloneCampaigns.length} standalone + ${selectedVariants.length} experiment variants)\n`
    );

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
    console.log(
      `[Revenue Boost] 🔍 Starting campaign filtering. Total campaigns: ${campaigns.length}`
    );
    console.log(
      "[Revenue Boost] 📋 Campaign IDs:",
      campaigns.map((c) => `${c.name} (${c.id})`)
    );

    let filtered = campaigns;

    // Fetch store settings for global frequency capping
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { settings: true },
    });
    const storeSettings = store?.settings as StoreSettings | undefined;

    filtered = await this.runFilterStep(
      "DEVICE TYPE",
      (cs, ctx) => this.filterByDeviceType(cs, ctx),
      filtered,
      context
    );

    filtered = await this.runFilterStep(
      "GEO TARGETING",
      (cs, ctx) => this.filterByGeoTargeting(cs, ctx),
      filtered,
      context
    );

    filtered = await this.runFilterStep(
      "PAGE TARGETING",
      (cs, ctx) => this.filterByPageTargeting(cs, ctx),
      filtered,
      context
    );

    filtered = await this.runFilterStep(
      "AUDIENCE SEGMENTS",
      (cs, ctx) => this.filterByAudienceSegments(cs, ctx, storeId),
      filtered,
      context
    );

    filtered = await this.runFilterStep(
      "VARIANT ASSIGNMENT",
      (cs, ctx) => this.filterByVariantAssignment(cs, ctx),
      filtered,
      context
    );

    filtered = await this.runFilterStep(
      "FREQUENCY CAPPING",
      (cs, ctx) => this.filterByFrequencyCapping(cs, ctx, storeSettings),
      filtered,
      context
    );

    console.log(`[Revenue Boost] ✅ Filtering complete. Final campaigns: ${filtered.length}`);
    if (filtered.length > 0) {
      console.log(
        "[Revenue Boost] 📋 Final campaign IDs:",
        filtered.map((c) => `${c.name} (${c.id})`)
      );
    } else {
      console.log("[Revenue Boost] ⚠️ No campaigns passed all filters");
    }

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
    console.log(`\n[Revenue Boost] === ${label} FILTER ===`);
    console.log(`[Revenue Boost] Input: ${campaigns.length} campaigns -`, campaigns.map(c => c.name));

    const result = await filter(campaigns, context);

    console.log(
      `[Revenue Boost] After ${label.toLowerCase()} filter: ${result.length} campaigns remaining`
    );

    // DIAGNOSTIC: Show which campaigns were filtered out
    if (campaigns.length !== result.length) {
      const resultIds = new Set(result.map(c => c.id));
      const excluded = campaigns.filter(c => !resultIds.has(c.id));
      console.log(`[Revenue Boost] ❌ ${label} filtered out ${excluded.length} campaign(s):`,
        excluded.map(c => c.name));
    }

    console.log(); // Empty line for readability
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
