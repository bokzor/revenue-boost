/**
 * Campaign Filter Service
 *
 * Server-side filtering of campaigns based on storefront context
 * This reduces the amount of data sent to the client and improves security
 */

import type { CampaignWithConfigs } from "~/domains/campaigns/types/campaign";
import type { StorefrontContext } from "~/domains/campaigns/types/storefront-context";
import { FrequencyCapService } from "~/domains/targeting/services/frequency-cap.server";

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
    console.log(`[Revenue Boost] 📱 Filtering campaigns by device type: ${device}`);

    return campaigns.filter((campaign) => {
      const targeting = campaign.targetRules?.audienceTargeting;

      // If no audience targeting, include campaign
      if (!targeting || !targeting.enabled) {
        return true;
      }

      // Check if campaign targets this device type
      const segments = targeting.segments || [];

      // Map device type to segment names
      const deviceSegmentMap: Record<string, string> = {
        mobile: "Mobile User",
        tablet: "Tablet User",
        desktop: "Desktop User",
      };

      const deviceSegment = deviceSegmentMap[device];

      // If no device-specific segments, include campaign
      const hasDeviceSegments = segments.some((seg) =>
        Object.values(deviceSegmentMap).includes(seg)
      );

      if (!hasDeviceSegments) {
        return true;
      }

      // Check if campaign targets this specific device
      const matches = segments.includes(deviceSegment);

      if (matches) {
        console.log(`[Revenue Boost] ✅ Campaign "${campaign.name}" (${campaign.id}): Targets ${deviceSegment}`);
      } else {
        console.log(`[Revenue Boost] ❌ Campaign "${campaign.name}" (${campaign.id}): Does not target ${deviceSegment}`);
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

    console.log(`[Revenue Boost] 📄 Filtering campaigns by page targeting. Current page: ${context.pageUrl}`);

    return campaigns.filter((campaign) => {
      const pageTargeting = campaign.targetRules?.enhancedTriggers?.page_targeting;

      // If no page targeting, include campaign
      if (!pageTargeting || !pageTargeting.enabled) {
        return true;
      }

      const targetPages = pageTargeting.pages || [];

      // If no specific pages defined, include campaign
      if (targetPages.length === 0) {
        return true;
      }

      console.log(`[Revenue Boost] 🎯 Campaign "${campaign.name}" (${campaign.id}) targets pages:`, targetPages);

      // Check if current page matches any target page
      const matches = targetPages.some((targetPage) => {
        return this.matchesPagePattern(context.pageUrl!, targetPage);
      });

      if (matches) {
        console.log(`[Revenue Boost] ✅ Campaign "${campaign.name}" (${campaign.id}): Page MATCHED`);
      } else {
        console.log(`[Revenue Boost] ❌ Campaign "${campaign.name}" (${campaign.id}): Page does NOT match`);
      }

      return matches;
    });
  }

  /**
   * Filter campaigns by audience segments
   */
  static filterByAudienceSegments(
    campaigns: CampaignWithConfigs[],
    context: StorefrontContext
  ): CampaignWithConfigs[] {
    // For now, we'll implement basic segment matching
    // This can be extended to query actual customer segments from DB

    console.log("[Revenue Boost] 👥 Filtering campaigns by audience segments");
    const contextSegments = this.getContextSegments(context);
    console.log("[Revenue Boost] 📊 Visitor segments detected:", contextSegments);

    return campaigns.filter((campaign) => {
      const targeting = campaign.targetRules?.audienceTargeting;

      // If no audience targeting, include campaign
      if (!targeting || !targeting.enabled) {
        console.log(`[Revenue Boost] ✅ Campaign "${campaign.name}" (${campaign.id}): No audience targeting, including`);
        return true;
      }

      const segments = targeting.segments || [];

      // If no segments defined, include campaign
      if (segments.length === 0) {
        console.log(`[Revenue Boost] ✅ Campaign "${campaign.name}" (${campaign.id}): No segments defined, including`);
        return true;
      }

      console.log(`[Revenue Boost] 🎯 Campaign "${campaign.name}" (${campaign.id}) requires segments:`, segments);

      // Campaign matches if any of its segments match context segments
      const matches = segments.some((seg) => contextSegments.includes(seg));

      if (matches) {
        const matchedSegments = segments.filter((seg) => contextSegments.includes(seg));
        console.log(`[Revenue Boost] ✅ Campaign "${campaign.name}" (${campaign.id}): MATCHED segments:`, matchedSegments);
      } else {
        console.log(`[Revenue Boost] ❌ Campaign "${campaign.name}" (${campaign.id}): NO MATCH - visitor segments don't match required segments`);
      }

      return matches;
    });
  }

  /**
   * Filter campaigns by frequency capping (Redis-based)
   *
   * Server-side filtering using Redis to track frequency caps
   * Ensures campaigns respect session, daily, and cooldown limits
   */
  static async filterByFrequencyCapping(
    campaigns: CampaignWithConfigs[],
    context: StorefrontContext
  ): Promise<CampaignWithConfigs[]> {
    const results = await Promise.all(
      campaigns.map(async (campaign) => {
        const result = await FrequencyCapService.checkFrequencyCapping(campaign, context);
        return result.allowed ? campaign : null;
      })
    );

    return results.filter((campaign): campaign is CampaignWithConfigs => campaign !== null);
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

    campaigns.forEach(campaign => {
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
      console.log(`[Revenue Boost] 🧪 Experiment ${experimentId}: ${variants.length} variants found`);
      console.log(`[Revenue Boost] 📋 Variants:`, variants.map(v => `${v.name} (${v.variantKey})`));

      // Use visitor ID to deterministically select a variant
      // This ensures the same visitor always sees the same variant
      const visitorId = context.visitorId || context.sessionId || 'anonymous';
      const hash = this.hashString(visitorId + experimentId);
      const selectedIndex = hash % variants.length;
      const selected = variants[selectedIndex];

      console.log(`[Revenue Boost] ✅ Selected variant: ${selected.name} (${selected.variantKey}) for visitor ${visitorId.substring(0, 8)}...`);
      selectedVariants.push(selected);
    });

    const result = [...standaloneCampaigns, ...selectedVariants];
    console.log(`[Revenue Boost] 🧪 After variant assignment: ${result.length} campaigns (${standaloneCampaigns.length} standalone + ${selectedVariants.length} experiment variants)\n`);

    return result;
  }

  /**
   * Simple string hash function for consistent variant assignment
   */
  private static hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
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
    context: StorefrontContext
  ): Promise<CampaignWithConfigs[]> {
    console.log(`[Revenue Boost] 🔍 Starting campaign filtering. Total campaigns: ${campaigns.length}`);
    console.log("[Revenue Boost] 📋 Campaign IDs:", campaigns.map(c => `${c.name} (${c.id})`));

    let filtered = campaigns;

    // Apply device type filter
    console.log("\n[Revenue Boost] === DEVICE TYPE FILTER ===");
    filtered = this.filterByDeviceType(filtered, context);
    console.log(`[Revenue Boost] After device filter: ${filtered.length} campaigns remaining\n`);

    // Apply page targeting filter
    console.log("[Revenue Boost] === PAGE TARGETING FILTER ===");
    filtered = this.filterByPageTargeting(filtered, context);
    console.log(`[Revenue Boost] After page targeting filter: ${filtered.length} campaigns remaining\n`);

    // Apply audience segments filter
    console.log("[Revenue Boost] === AUDIENCE SEGMENTS FILTER ===");
    filtered = this.filterByAudienceSegments(filtered, context);
    console.log(`[Revenue Boost] After audience segments filter: ${filtered.length} campaigns remaining\n`);

    // Apply variant assignment filter (for A/B tests)
    console.log("[Revenue Boost] === VARIANT ASSIGNMENT FILTER ===");
    filtered = this.filterByVariantAssignment(filtered, context);
    console.log(`[Revenue Boost] After variant assignment filter: ${filtered.length} campaigns remaining\n`);

    // Apply frequency capping filter (async - uses Redis)
    console.log("[Revenue Boost] === FREQUENCY CAPPING FILTER ===");
    filtered = await this.filterByFrequencyCapping(filtered, context);
    console.log(`[Revenue Boost] After frequency capping filter: ${filtered.length} campaigns remaining\n`);

    console.log(`[Revenue Boost] ✅ Filtering complete. Final campaigns: ${filtered.length}`);
    if (filtered.length > 0) {
      console.log("[Revenue Boost] 📋 Final campaign IDs:", filtered.map(c => `${c.name} (${c.id})`));
    } else {
      console.log("[Revenue Boost] ⚠️ No campaigns passed all filters");
    }

    return filtered;
  }

  /**
   * Helper: Match page URL against pattern (supports wildcards)
   */
  private static matchesPagePattern(pageUrl: string, pattern: string): boolean {
    // Convert wildcard pattern to regex
    const regexPattern = pattern
      .replace(/\*/g, ".*")
      .replace(/\?/g, ".");

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(pageUrl);
  }

  /**
   * Helper: Get segments from context
   */
  private static getContextSegments(context: StorefrontContext): string[] {
    const segments: string[] = [];

    // Device-based segments
    if (context.deviceType === "mobile") segments.push("Mobile User");
    if (context.deviceType === "tablet") segments.push("Tablet User");
    if (context.deviceType === "desktop") segments.push("Desktop User");

    // Visit-based segments
    if (context.visitCount === 1) segments.push("New Visitor");
    if (context.isReturningVisitor) segments.push("Returning Visitor");

    // Cart-based segments
    if (context.cartItemCount && context.cartItemCount > 0) {
      segments.push("Cart Abandoner");
      segments.push("Active Shopper");
    }

    // Page-based segments
    if (context.pageType === "product") segments.push("Product Viewer");

    return segments;
  }
}

