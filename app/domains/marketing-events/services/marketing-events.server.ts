import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";

interface EngagementMetrics {
  views: number;
  clicks: number;
  shares?: number;
  favorites?: number;
  comments?: number;
  adSpend?: number;
  isCumulative?: boolean;
}

interface ScopesContext {
  query: () => Promise<{ granted: string[] }>;
}

const REQUIRED_SCOPE = "write_marketing_events";

export class MarketingEventsService {
  /**
   * Check if the write_marketing_events scope is granted
   */
  private static async hasMarketingScope(scopes?: ScopesContext): Promise<boolean> {
    if (!scopes) {
      // If no scopes context is provided, skip the operation
      // This prevents API errors when the scope hasn't been requested
      console.log("[MarketingEventsService] No scopes context provided - skipping");
      return false;
    }

    try {
      const scopeDetails = await scopes.query();
      return scopeDetails.granted.includes(REQUIRED_SCOPE);
    } catch {
      return false;
    }
  }

  /**
   * Create a marketing event in Shopify.
   * Returns the marketing activity ID plus generated UTM values so callers can persist them on the campaign.
   *
   * Note: Requires write_marketing_events scope (optional, requested at use-time).
   * Returns null gracefully if scope is not granted.
   */
  static async createMarketingEvent(
    admin: AdminApiContext,
    campaign: {
      id: string;
      name: string;
      description?: string;
      status: string;
      startDate?: Date | null;
      endDate?: Date | null;
      templateType?: string;
    },
    appUrl: string,
    scopes?: ScopesContext
  ): Promise<{
    marketingEventId: string;
    utmCampaign: string;
    utmSource: string;
    utmMedium: string;
  } | null> {
    try {
      // Check if scope is granted
      const hasScope = await this.hasMarketingScope(scopes);
      if (!hasScope) {
        console.log("[MarketingEventsService] write_marketing_events scope not granted - skipping");
        return null;
      }

      const { utmCampaign, utmSource, utmMedium } = this.generateUTMParams(
        campaign.id,
        campaign.templateType
      );
      const start = campaign.startDate ?? new Date();

      const response = await admin.graphql(
        `#graphql
        mutation marketingActivityCreateExternal($createInput: MarketingActivityCreateExternalInput!) {
          marketingActivityCreateExternal(input: $createInput) {
            marketingActivity {
              id
            }
            userErrors {
              field
              message
            }
          }
        }`,
        {
          variables: {
            createInput: {
              title: campaign.name,
              remoteUrl: `${appUrl}/app/campaigns/${campaign.id}`,
              tactic: "AD",
              marketingChannelType: "DISPLAY",
              remoteId: campaign.id,
              start: start.toISOString(),
              end: campaign.endDate?.toISOString(),
              utm: {
                campaign: utmCampaign,
                source: utmSource,
                medium: utmMedium,
              },
            },
          },
        }
      );

      const data = await response.json();

      if (data.data?.marketingActivityCreateExternal?.userErrors?.length > 0) {
        console.error(
          "Marketing Activity Create Errors:",
          data.data.marketingActivityCreateExternal.userErrors
        );
        return null;
      }

      const marketingEventId = data.data?.marketingActivityCreateExternal?.marketingActivity?.id;

      if (!marketingEventId) return null;

      return { marketingEventId, utmCampaign, utmSource, utmMedium };
    } catch (error) {
      console.error("Failed to create marketing activity:", error);
      return null;
    }
  }

  /**
   * Update a marketing event in Shopify
   *
   * Note: Requires write_marketing_events scope (optional, requested at use-time).
   * Returns false gracefully if scope is not granted.
   */
  static async updateMarketingEvent(
    admin: AdminApiContext,
    marketingEventId: string,
    campaign: {
      name?: string;
      startDate?: Date | null;
      endDate?: Date | null;
    },
    scopes?: ScopesContext
  ): Promise<boolean> {
    try {
      // Check if scope is granted
      const hasScope = await this.hasMarketingScope(scopes);
      if (!hasScope) {
        console.log("[MarketingEventsService] write_marketing_events scope not granted - skipping update");
        return false;
      }

      const input: Record<string, unknown> = {};

      if (campaign.name) input.title = campaign.name;
      if (campaign.startDate) input.start = campaign.startDate.toISOString();
      if (campaign.endDate) input.end = campaign.endDate.toISOString();

      const response = await admin.graphql(
        `#graphql
        mutation marketingActivityUpdateExternal($marketingActivityId: ID!, $input: MarketingActivityUpdateExternalInput!) {
          marketingActivityUpdateExternal(marketingActivityId: $marketingActivityId, input: $input) {
            marketingActivity {
              id
            }
            userErrors {
              field
              message
            }
          }
        }`,
        {
          variables: { marketingActivityId: marketingEventId, input },
        }
      );

      const data = await response.json();

      if (data.data?.marketingActivityUpdateExternal?.userErrors?.length > 0) {
        console.error(
          "Marketing Activity Update Errors:",
          data.data.marketingActivityUpdateExternal.userErrors
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error("Failed to update marketing activity:", error);
      return false;
    }
  }

  /**
   * Delete a marketing event in Shopify
   *
   * Note: Requires write_marketing_events scope (optional, requested at use-time).
   * Returns false gracefully if scope is not granted.
   */
  static async deleteMarketingEvent(
    admin: AdminApiContext,
    marketingEventId: string,
    scopes?: ScopesContext
  ): Promise<boolean> {
    try {
      // Check if scope is granted
      const hasScope = await this.hasMarketingScope(scopes);
      if (!hasScope) {
        console.log("[MarketingEventsService] write_marketing_events scope not granted - skipping delete");
        return false;
      }

      const response = await admin.graphql(
        `#graphql
        mutation marketingActivityDeleteExternal($marketingActivityId: ID!) {
          marketingActivityDeleteExternal(marketingActivityId: $marketingActivityId) {
            userErrors {
              field
              message
            }
          }
        }`,
        {
          variables: { marketingActivityId: marketingEventId },
        }
      );

      const data = await response.json();

      if (data.data?.marketingActivityDeleteExternal?.userErrors?.length > 0) {
        console.error(
          "Marketing Activity Delete Errors:",
          data.data.marketingActivityDeleteExternal.userErrors
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error("Failed to delete marketing activity:", error);
      return false;
    }
  }

  /**
   * Sync engagement metrics to Shopify
   *
   * Note: Requires write_marketing_events scope (optional, requested at use-time).
   * Returns false gracefully if scope is not granted.
   */
  static async syncEngagementMetrics(
    admin: AdminApiContext,
    marketingEventId: string,
    metrics: EngagementMetrics,
    scopes?: ScopesContext
  ): Promise<boolean> {
    try {
      // Check if scope is granted
      const hasScope = await this.hasMarketingScope(scopes);
      if (!hasScope) {
        console.log("[MarketingEventsService] write_marketing_events scope not granted - skipping sync");
        return false;
      }

      const now = new Date();
      const occurredOn = now.toISOString().slice(0, 10); // YYYY-MM-DD
      const utcOffsetMinutes = now.getTimezoneOffset();
      const offsetHours = Math.floor(Math.abs(utcOffsetMinutes) / 60)
        .toString()
        .padStart(2, "0");
      const offsetMinutes = (Math.abs(utcOffsetMinutes) % 60).toString().padStart(2, "0");
      const sign = utcOffsetMinutes <= 0 ? "+" : "-";
      const utcOffset = `${sign}${offsetHours}:${offsetMinutes}`;

      const response = await admin.graphql(
        `#graphql
        mutation marketingEngagementCreate($marketingActivityId: ID!, $marketingEngagement: MarketingEngagementInput!) {
          marketingEngagementCreate(marketingActivityId: $marketingActivityId, marketingEngagement: $marketingEngagement) {
            marketingEngagement {
              occurredOn
            }
            userErrors {
              field
              message
            }
          }
        }`,
        {
          variables: {
            marketingActivityId: marketingEventId,
            marketingEngagement: {
              occurredOn,
              utcOffset,
              isCumulative: metrics.isCumulative ?? true,
              viewsCount: metrics.views,
              clicksCount: metrics.clicks,
            },
          },
        }
      );

      const data = await response.json();

      if (data.data?.marketingEngagementCreate?.userErrors?.length > 0) {
        console.error(
          "Marketing Engagement Sync Errors:",
          data.data.marketingEngagementCreate.userErrors
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error("Failed to sync engagement metrics:", error);
      return false;
    }
  }

  private static generateUTMParams(campaignId: string, templateType?: string) {
    const normalizedTemplate = (templateType || "popup").toLowerCase().replace(/_/g, "-");
    return {
      utmCampaign: `revenue-boost-${campaignId}`,
      utmSource: "revenue-boost-app",
      utmMedium: normalizedTemplate,
    };
  }
}
