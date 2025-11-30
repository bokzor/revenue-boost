import type { LoaderFunctionArgs } from "react-router";
import { data, useLoaderData } from "react-router";
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
} from "@shopify/polaris";
import { authenticate } from "~/shopify.server";
import { CampaignAnalyticsService } from "~/domains/campaigns/services/campaign-analytics.server";
import { CampaignService } from "~/domains/campaigns";
import { getStoreId } from "~/lib/auth-helpers.server";
import { getStoreCurrency } from "~/lib/currency.server";
import { PopupEventService } from "~/domains/analytics/popup-events.server";
import prisma from "~/db.server";

// --- Types ---
interface LoaderData {
  campaignName: string;
  summary: {
    impressions: number;
    clicks: number;
    leads: number;
    orders: number;
    revenue: number;
    conversionRate: number; // Leads / Impressions
    clickThroughRate: number; // Clicks / Impressions
    aov: number;
  };
  dailyMetrics: Array<{
    date: string;
    impressions: number;
    leads: number;
    revenue: number;
  }>;
  conversions: Array<{
    id: string;
    orderNumber: string;
    totalPrice: number;
    discountAmount: number;
    createdAt: string;
  }>;
  currency: string;
}

// --- Loader ---
export async function loader({ request, params }: LoaderFunctionArgs) {
  console.log("[CampaignAnalytics] loader hit", {
    url: request.url,
    campaignId: params.campaignId,
  });
  const { admin } = await authenticate.admin(request);
  const storeId = await getStoreId(request);
  const campaignId = params.campaignId;

  if (!campaignId) {
    throw new Response("Campaign ID required", { status: 400 });
  }

  // 1. Get Campaign Details & other data in parallel
  const [campaign, _statsMap, revenueMap, dailyMetrics, currency, conversions, clicksMap] =
    await Promise.all([
      CampaignService.getCampaignById(campaignId, storeId),
      CampaignAnalyticsService.getCampaignStats([campaignId]),
      CampaignAnalyticsService.getRevenueBreakdownByCampaignIds([campaignId]),
      CampaignAnalyticsService.getDailyMetrics(campaignId, 30), // Last 30 days
      getStoreCurrency(admin),
      prisma.campaignConversion.findMany({
        where: { campaignId },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      PopupEventService.getClickCountsByCampaign([campaignId]),
    ]);

  if (!campaign) throw new Response("Campaign not found", { status: 404 });

  const revenueStats = revenueMap.get(campaignId);
  const clicks = clicksMap.get(campaignId) || 0;

  // Calculate Summary Metrics
  // We use daily metrics sum for "Recent" values to be consistent with the chart
  const recentImpressions = dailyMetrics.reduce((sum, d) => sum + d.impressions, 0);
  const recentLeads = dailyMetrics.reduce((sum, d) => sum + d.leads, 0);

  // Use lifetime stats for total revenue/orders
  const totalRevenue = revenueStats?.revenue || 0;
  const totalOrders = revenueStats?.orderCount || 0;

  return data<LoaderData>({
    campaignName: campaign.name,
    summary: {
      impressions: recentImpressions,
      clicks,
      leads: recentLeads,
      orders: totalOrders,
      revenue: totalRevenue,
      conversionRate: recentImpressions > 0 ? (recentLeads / recentImpressions) * 100 : 0,
      clickThroughRate: recentImpressions > 0 ? (clicks / recentImpressions) * 100 : 0,
      aov: revenueStats?.aov || 0,
    },
    dailyMetrics,
    conversions: conversions.map((conversion) => ({
      id: conversion.id,
      orderNumber: conversion.orderNumber,
      totalPrice: Number(conversion.totalPrice),
      discountAmount: Number(conversion.discountAmount),
      createdAt: conversion.createdAt.toISOString(),
    })),
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
  const { campaignName, summary, dailyMetrics, conversions, currency } =
    useLoaderData<typeof loader>();

  return (
    <Page
      title={`Analytics: ${campaignName}`}
      backAction={{ content: "Back to Campaign", url: "../" }}
      subtitle="Last 30 Days Performance"
    >
      <BlockStack gap="500">
        {/* Summary Cards - Row 1: Key Metrics */}
        <InlineGrid columns={{ xs: 1, sm: 2, md: 4 }} gap="400">
          <Card>
            <BlockStack gap="200">
              <Text as="h3" variant="headingSm" tone="subdued">
                Total Revenue
              </Text>
              <Text as="p" variant="headingLg">
                {formatMoney(summary.revenue, currency)}
              </Text>
              <Text as="span" tone="success">
                {summary.orders} orders
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

          <Card>
            <BlockStack gap="200">
              <Text as="h3" variant="headingSm" tone="subdued">
                Lead Conversion
              </Text>
              <Text as="p" variant="headingLg">
                {summary.conversionRate.toFixed(1)}%
              </Text>
              <Text as="span" tone="subdued">
                {summary.leads} leads from {summary.impressions.toLocaleString()} views
              </Text>
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="200">
              <Text as="h3" variant="headingSm" tone="subdued">
                Click-Through Rate
              </Text>
              <Text as="p" variant="headingLg">
                {summary.clickThroughRate.toFixed(1)}%
              </Text>
              <Text as="span" tone="subdued">
                {summary.clicks.toLocaleString()} clicks
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
                  const maxRevenue = Math.max(...dailyMetrics.map((d) => d.revenue), 1);
                  const height = (day.revenue / maxRevenue) * 100;
                  return (
                    <Tooltip
                      key={day.date}
                      content={`${day.date}: ${formatMoney(day.revenue, currency)}`}
                    >
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

        {/* Conversion List */}
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Recent Conversions
            </Text>
            {conversions.length === 0 ? (
              <Text as="p" tone="subdued">
                No conversions recorded yet.
              </Text>
            ) : (
              <DataTable
                columnContentTypes={["text", "numeric", "numeric", "text"]}
                headings={["Order", "Revenue", "Discount", "Date"]}
                rows={conversions.map((conversion) => [
                  conversion.orderNumber,
                  formatMoney(conversion.totalPrice, currency),
                  conversion.discountAmount > 0
                    ? `-${formatMoney(conversion.discountAmount, currency)}`
                    : formatMoney(0, currency),
                  new Date(conversion.createdAt).toLocaleString(),
                ])}
              />
            )}
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
              rows={dailyMetrics
                .map((day) => [
                  day.date,
                  day.impressions,
                  day.leads,
                  "-", // Orders not yet in daily breakdown
                  formatMoney(day.revenue, currency),
                ])
                .reverse()} // Show newest first
            />
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
