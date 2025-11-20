// import { AdminApiContext } from "@shopify/shopify-app-react-router/server";

interface MarketingEventInput {
    startedAt: string;
    endedAt?: string;
    utmCampaign?: string;
    utmSource?: string;
    utmMedium?: string;
    budget?: number;
    currency?: string;
    manageUrl?: string;
    previewUrl?: string;
    remoteId?: string;
}

interface EngagementMetrics {
    views: number;
    clicks: number;
    shares?: number;
    favorites?: number;
    comments?: number;
    adSpend?: number;
    isCumulative?: boolean;
}

export class MarketingEventsService {
    /**
     * Create a marketing event in Shopify
     */
    static async createMarketingEvent(
        admin: any,
        campaign: {
            id: string;
            name: string;
            description?: string;
            status: string;
            startDate?: Date | null;
            endDate?: Date | null;
        },
        appUrl: string
    ): Promise<string | null> {
        try {
            const response = await admin.graphql(
                `#graphql
        mutation marketingEventCreate($input: MarketingEventInput!) {
          marketingEventCreate(input: $input) {
            marketingEvent {
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
                        input: {
                            startedAt: campaign.startDate?.toISOString() || new Date().toISOString(),
                            endedAt: campaign.endDate?.toISOString(),
                            utmCampaign: campaign.name.replace(/\s+/g, '-').toLowerCase(),
                            utmSource: "revenue-boost",
                            utmMedium: "popup",
                            budget: 0,
                            currency: "USD", // Default, should be dynamic if possible
                            manageUrl: `${appUrl}/app/campaigns/${campaign.id}`,
                            previewUrl: `${appUrl}/app/campaigns/${campaign.id}`, // Ideally the storefront URL
                            remoteId: campaign.id,
                            marketingChannel: "SOCIAL", // or DISPLAY, EMAIL, etc. "ONSITE" is not a valid enum usually, check docs. 
                            // Valid values: SEARCH, DISPLAY, SOCIAL, EMAIL, REFERRAL, OTHER. 
                            // Popups are "ONSITE" but that might not be an option. "OTHER" or "DISPLAY" might fit.
                            // Actually, for apps, it's often "OTHER" or specific if it fits.
                            // Let's use "OTHER" for now or check if "ONSITE" exists.
                            // Docs say: ADVERTISING, EMAIL, SOCIAL, SMS, PUSH_NOTIFICATION, REFERRAL, AFFILIATE, SEARCH, DISPLAY, RETARGETING, OTHER.
                            // "DISPLAY" seems closest for a popup.
                        },
                    },
                }
            );

            const data = await response.json();

            if (data.data?.marketingEventCreate?.userErrors?.length > 0) {
                console.error("Marketing Event Create Errors:", data.data.marketingEventCreate.userErrors);
                return null;
            }

            return data.data?.marketingEventCreate?.marketingEvent?.id;
        } catch (error) {
            console.error("Failed to create marketing event:", error);
            return null;
        }
    }

    /**
     * Update a marketing event in Shopify
     */
    static async updateMarketingEvent(
        admin: any,
        marketingEventId: string,
        campaign: {
            name?: string;
            startDate?: Date | null;
            endDate?: Date | null;
        }
    ): Promise<boolean> {
        try {
            const input: any = {
                id: marketingEventId,
            };

            if (campaign.startDate) input.startedAt = campaign.startDate.toISOString();
            if (campaign.endDate) input.endedAt = campaign.endDate.toISOString();
            // Note: utmCampaign usually shouldn't change as it breaks tracking, but if name changes...

            const response = await admin.graphql(
                `#graphql
        mutation marketingEventUpdate($input: MarketingEventUpdateInput!) {
          marketingEventUpdate(input: $input) {
            marketingEvent {
              id
            }
            userErrors {
              field
              message
            }
          }
        }`,
                {
                    variables: { input },
                }
            );

            const data = await response.json();

            if (data.data?.marketingEventUpdate?.userErrors?.length > 0) {
                console.error("Marketing Event Update Errors:", data.data.marketingEventUpdate.userErrors);
                return false;
            }

            return true;
        } catch (error) {
            console.error("Failed to update marketing event:", error);
            return false;
        }
    }

    /**
     * Delete a marketing event in Shopify
     */
    static async deleteMarketingEvent(
        admin: any,
        marketingEventId: string
    ): Promise<boolean> {
        try {
            const response = await admin.graphql(
                `#graphql
        mutation marketingEventDelete($id: ID!) {
          marketingEventDelete(id: $id) {
            deletedMarketingEventId
            userErrors {
              field
              message
            }
          }
        }`,
                {
                    variables: { id: marketingEventId },
                }
            );

            const data = await response.json();

            if (data.data?.marketingEventDelete?.userErrors?.length > 0) {
                console.error("Marketing Event Delete Errors:", data.data.marketingEventDelete.userErrors);
                return false;
            }

            return true;
        } catch (error) {
            console.error("Failed to delete marketing event:", error);
            return false;
        }
    }

    /**
     * Sync engagement metrics to Shopify
     */
    static async syncEngagementMetrics(
        admin: any,
        marketingEventId: string,
        metrics: EngagementMetrics
    ): Promise<boolean> {
        try {
            const response = await admin.graphql(
                `#graphql
        mutation marketingEngagementCreate($marketingEngagementInput: MarketingEngagementInput!) {
          marketingEngagementCreate(marketingEngagementInput: $marketingEngagementInput) {
            marketingEngagement {
              occurredAt
            }
            userErrors {
              field
              message
            }
          }
        }`,
                {
                    variables: {
                        marketingEngagementInput: {
                            marketingEventId: marketingEventId,
                            occurredAt: new Date().toISOString(),
                            viewsCount: metrics.views,
                            clicksCount: metrics.clicks,
                            isCumulative: metrics.isCumulative ?? true,
                            // adSpend: metrics.adSpend, // Optional
                        },
                    },
                }
            );

            const data = await response.json();

            if (data.data?.marketingEngagementCreate?.userErrors?.length > 0) {
                console.error("Marketing Engagement Sync Errors:", data.data.marketingEngagementCreate.userErrors);
                return false;
            }

            return true;
        } catch (error) {
            console.error("Failed to sync engagement metrics:", error);
            return false;
        }
    }
}
