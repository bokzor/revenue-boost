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
      return campaigns;
    }

    const device = context.deviceType!;

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
      return segments.includes(deviceSegment);
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
      return campaigns;
    }

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

      // Check if current page matches any target page
      return targetPages.some((targetPage) => {
        return this.matchesPagePattern(context.pageUrl!, targetPage);
      });
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

    return campaigns.filter((campaign) => {
      const targeting = campaign.targetRules?.audienceTargeting;

      // If no audience targeting, include campaign
      if (!targeting || !targeting.enabled) {
        return true;
      }

      const segments = targeting.segments || [];

      // If no segments defined, include campaign
      if (segments.length === 0) {
        return true;
      }

      // Check context-based segments
      const contextSegments = this.getContextSegments(context);

      // Campaign matches if any of its segments match context segments
      return segments.some((seg) => contextSegments.includes(seg));
    });
  }

  /**
   * Filter campaigns by frequency capping
   *
   * Note: This is a server-side check that uses client-side storage data
   * The actual enforcement happens on the client, but we can pre-filter
   * campaigns that have already exceeded their limits based on context
   */
  static filterByFrequencyCapping(
    campaigns: CampaignWithConfigs[],
    context: StorefrontContext
  ): CampaignWithConfigs[] {
    return campaigns.filter((campaign) => {
      return FrequencyCapService.shouldShowCampaign(campaign, context);
    });
  }

  /**
   * Apply all filters to campaigns
   */
  static filterCampaigns(
    campaigns: CampaignWithConfigs[],
    context: StorefrontContext
  ): CampaignWithConfigs[] {
    let filtered = campaigns;

    // Apply device type filter
    filtered = this.filterByDeviceType(filtered, context);

    // Apply page targeting filter
    filtered = this.filterByPageTargeting(filtered, context);

    // Apply audience segments filter
    filtered = this.filterByAudienceSegments(filtered, context);

    // Apply frequency capping filter
    filtered = this.filterByFrequencyCapping(filtered, context);

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

