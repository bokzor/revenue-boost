import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { data, useLoaderData, useFetcher } from "react-router";
import { useState, useEffect } from "react";
import {
    Page,
    Card,
    Text,
    BlockStack,
    InlineGrid,
    Box,
    Divider,
    DataTable,
    Tooltip,
    Toast,
} from "@shopify/polaris";
import { authenticate } from "~/shopify.server";
import { CampaignAnalyticsService } from "~/domains/campaigns/services/campaign-analytics.server";
import { CampaignService } from "~/domains/campaigns";
import { getStoreId } from "~/lib/auth-helpers.server";
import { getStoreCurrency } from "~/lib/currency.server";
import { MarketingEventsService } from "~/domains/marketing-events/services/marketing-events.server";

// --- Types ---
interface LoaderData {
    campaignName: string;
    summary: {
        impressions: number;
        leads: number;
        orders: number;
        revenue: number;
        conversionRate: number; // Leads / Impressions
        salesConversionRate: number; // Orders / Impressions
        aov: number;
    };
    dailyMetrics: Array<{
        date: string;
        impressions: number;
        leads: number;
        revenue: number;
    }>;
    currency: string;
}

// --- Action ---
export async function action({ request, params }: ActionFunctionArgs) {
    const { admin } = await authenticate.admin(request);
    const storeId = await getStoreId(request);
    const campaignId = params.campaignId;

    if (!campaignId) return data({ error: "Campaign ID required" }, { status: 400 });

    const campaign = await CampaignService.getCampaignById(campaignId, storeId);
    if (!campaign || !campaign.marketingEventId) {
        return data({ error: "Campaign or Marketing Event not found" }, { status: 404 });
    }

    const statsMap = await CampaignAnalyticsService.getCampaignStats([campaignId]);
    const stats = statsMap.get(campaignId);

    if (!stats) return data({ error: "No stats available" }, { status: 404 });

    const success = await MarketingEventsService.syncEngagementMetrics(admin, campaign.marketingEventId, {
        views: stats.impressions,
        clicks: 0, // Clicks not currently tracked in stats
    });

    if (success) {
        return data({ success: true });
    } else {
        return data({ error: "Failed to sync metrics" }, { status: 500 });
    }
}

// --- Loader ---
export async function loader({ request, params }: LoaderFunctionArgs) {
    console.log("[CampaignAnalytics] loader hit", { url: request.url, campaignId: params.campaignId });
    const { admin, session } = await authenticate.admin(request);
    const storeId = await getStoreId(request);
    const campaignId = params.campaignId;

    if (!campaignId) {
        throw new Response("Campaign ID required", { status: 400 });
    }

    // 1. Get Campaign Details & other data in parallel
    const [campaign, statsMap, revenueMap, dailyMetrics, currency] = await Promise.all([
        CampaignService.getCampaignById(campaignId, storeId),
        CampaignAnalyticsService.getCampaignStats([campaignId]),
        CampaignAnalyticsService.getRevenueBreakdownByCampaignIds([campaignId]),
        CampaignAnalyticsService.getDailyMetrics(campaignId, 30), // Last 30 days
        getStoreCurrency(admin),
    ]);

    if (!campaign) throw new Response("Campaign not found", { status: 404 });

    const stats = statsMap.get(campaignId);
    const revenueStats = revenueMap.get(campaignId);

    // 3. Calculate Summary Metrics
    // We use daily metrics sum for "Recent" values to be consistent with the chart
    const recentImpressions = dailyMetrics.reduce((sum, d) => sum + d.impressions, 0);
    const recentLeads = dailyMetrics.reduce((sum, d) => sum + d.leads, 0);

    // Use lifetime stats for total revenue/orders as that's usually what's expected in "Total" cards,
    // but for "Last 30 Days" context we might want recent.
    // The UI subtitle says "Last 30 Days Performance", so let's try to stick to recent if possible,
    // but revenueStats is lifetime.
    // Let's use lifetime for Revenue/Orders/AOV for now as it's more robustly calculated in the service.
    const totalRevenue = revenueStats?.revenue || 0;
    const totalOrders = revenueStats?.orderCount || 0;

    return data<LoaderData>({
        campaignName: campaign.name,
        summary: {
            impressions: recentImpressions,
            leads: recentLeads,
            orders: totalOrders,
            revenue: totalRevenue,
            conversionRate: recentImpressions > 0 ? (recentLeads / recentImpressions) * 100 : 0,
            salesConversionRate: recentImpressions > 0 ? (totalOrders / recentImpressions) * 100 : 0,
            aov: revenueStats?.aov || 0,
        },
        dailyMetrics,
        currency: currency,
    });
}

// Inlined formatCurrency
const formatMoney = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
    }).format(amount);
};

// --- Component ---
export default function CampaignAnalyticsPage() {
    const { campaignName, summary, dailyMetrics, currency } = useLoaderData<typeof loader>();
    console.log("[CampaignAnalyticsPage] render", { campaignName, currency, dailyPoints: dailyMetrics.length });

    const fetcher = useFetcher<typeof action>();
    const isSyncing = fetcher.state !== "idle";
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [toastError, setToastError] = useState(false);

    useEffect(() => {
        const data = fetcher.data;
        if (!data) return;

        if ('success' in data && data.success) {
            setToastMessage("Metrics synced to Shopify");
            setToastError(false);
        } else if ('error' in data && data.error) {
            setToastMessage(data.error);
            setToastError(true);
        }
    }, [fetcher.data]);

    const toastMarkup = toastMessage ? (
        <Toast content={toastMessage} error={toastError} onDismiss={() => setToastMessage(null)} />
    ) : null;

    return (
        <Page
            title={`Analytics: ${campaignName}`}
            backAction={{ content: "Back to Campaign", url: "../" }}
            subtitle="Last 30 Days Performance"
            primaryAction={{
                content: "Sync to Shopify",
                onAction: () => fetcher.submit({}, { method: "post" }),
                loading: isSyncing,
            }}
        >
            <BlockStack gap="500">
                {/* Summary Cards */}
                <InlineGrid columns={{ xs: 1, sm: 2, md: 4 }} gap="400">
                    <Card>
                        <BlockStack gap="200">
                            <Text as="h3" variant="headingSm" tone="subdued">
                                Total Revenue
                            </Text>
                            <Text as="p" variant="headingLg">
                                {formatMoney(summary.revenue, currency)}
                            </Text>
                            <InlineGrid columns="auto auto" gap="200" alignItems="center">
                                <Text as="span" tone="success">
                                    {summary.orders} orders
                                </Text>
                            </InlineGrid>
                        </BlockStack>
                    </Card>

                    <Card>
                        <BlockStack gap="200">
                            <Text as="h3" variant="headingSm" tone="subdued">
                                Conversion Rate
                            </Text>
                            <Text as="p" variant="headingLg">
                                {summary.conversionRate.toFixed(1)}%
                            </Text>
                            <Text as="span" tone="subdued">
                                Lead Capture
                            </Text>
                        </BlockStack>
                    </Card>

                    <Card>
                        <BlockStack gap="200">
                            <Text as="h3" variant="headingSm" tone="subdued">
                                Impressions
                            </Text>
                            <Text as="p" variant="headingLg">
                                {summary.impressions.toLocaleString()}
                            </Text>
                            <Text as="span" tone="subdued">
                                Views
                            </Text>
                        </BlockStack>
                    </Card>

                    <Card>
                        <BlockStack gap="200">
                            <Text as="h3" variant="headingSm" tone="subdued">
                                Avg. Order Value
                            </Text>
                            <Text as="p" variant="headingLg">
                                {formatMoney(summary.aov, currency)}
                            </Text>
                            <Text as="span" tone="subdued">
                                Per Order
                            </Text>
                        </BlockStack>
                    </Card>
                </InlineGrid>

                <Divider />

                {/* Charts Section */}
                <Card>
                    <BlockStack gap="400">
                        <Text as="h2" variant="headingMd">
                            Performance Over Time
                        </Text>
                        <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                            <div style={{ height: "300px", display: "flex", alignItems: "flex-end", gap: "4px" }}>
                                {/* Simple CSS Bar Chart */}
                                {dailyMetrics.map((day) => {
                                    const maxRevenue = Math.max(...dailyMetrics.map(d => d.revenue), 1);
                                    const height = (day.revenue / maxRevenue) * 100;
                                    return (
                                        <Tooltip key={day.date} content={`${day.date}: ${formatMoney(day.revenue, currency)}`}>
                                            <div
                                                style={{
                                                    height: `${Math.max(height, 1)}%`,
                                                    flex: 1,
                                                    backgroundColor: "#10b981",
                                                    borderRadius: "2px 2px 0 0",
                                                    opacity: 0.8,
                                                }}
                                            />
                                        </Tooltip>
                                    );
                                })}
                            </div>
                        </Box>
                        <Text as="p" tone="subdued" alignment="center">
                            Daily Revenue (Last 30 Days)
                        </Text>
                    </BlockStack>
                </Card>

                {/* Detailed Metrics Table */}
                <Card>
                    <BlockStack gap="400">
                        <Text as="h2" variant="headingMd">
                            Daily Breakdown
                        </Text>
                        <DataTable
                            columnContentTypes={["text", "numeric", "numeric", "numeric", "numeric"]}
                            headings={["Date", "Impressions", "Leads", "Orders", "Revenue"]}
                            rows={dailyMetrics.map((day) => [
                                day.date,
                                day.impressions,
                                day.leads,
                                "-", // Orders not yet in daily breakdown
                                formatMoney(day.revenue, currency),
                            ]).reverse()} // Show newest first
                        />
                    </BlockStack>
                </Card>
            </BlockStack>
            {toastMarkup}
        </Page>
    );
}
