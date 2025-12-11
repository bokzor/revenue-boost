import type { LoaderFunctionArgs } from "react-router";
import { data, useLoaderData } from "react-router";
import {
  Page,
  Card,
  Text,
  BlockStack,
  InlineGrid,
  Box,
  DataTable,
} from "@shopify/polaris";
import { PolarisVizProvider, BarChart } from "@shopify/polaris-viz";
import "@shopify/polaris-viz/build/esm/styles.css";
import { authenticate } from "~/shopify.server";
import { CampaignAnalyticsService } from "~/domains/campaigns/services/campaign-analytics.server";
import { ExperimentService } from "~/domains/campaigns";
import { getStoreId } from "~/lib/auth-helpers.server";
import { PopupEventService } from "~/domains/analytics/popup-events.server";
import { getStoreCurrency } from "~/lib/currency.server";
import { logger } from "~/lib/logger.server";

// Helper for currency formatting
const formatMoney = (amount: number, currency: string = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount);
};

interface DailyMetric {
  date: string;
  impressions: number;
  leads: number;
  revenue: number;
}

interface LoaderData {
  experimentName: string;
  summary: {
    impressions: number;
    leads: number;
    conversionRate: number;
    revenue: number;
    orders: number;
    aov: number;
  };
  dailyMetrics: DailyMetric[];
  currency: string;
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  logger.debug({
    url: request.url,
    experimentId: params.experimentId,
  }, "[ExperimentAnalytics] loader hit");

  const { admin } = await authenticate.admin(request);
  const storeId = await getStoreId(request);
  const experimentId = params.experimentId;

  if (!experimentId) {
    throw new Response("Experiment ID required", { status: 400 });
  }

  const experiment = await ExperimentService.getExperimentById(experimentId, storeId);
  if (!experiment) {
    throw new Response("Experiment not found", { status: 404 });
  }

  const variantIds = experiment.variants.map((v) => v.id);

  // If no variants, return empty data
  if (variantIds.length === 0) {
    const currency = await getStoreCurrency(admin);
    return data<LoaderData>({
      experimentName: experiment.name,
      summary: {
        impressions: 0,
        leads: 0,
        conversionRate: 0,
        revenue: 0,
        orders: 0,
        aov: 0,
      },
      dailyMetrics: [],
      currency,
    });
  }

  // Fetch aggregated stats
  const [dailyMetrics, revenueMap, impressionCounts, leadCounts, currency] = await Promise.all([
    CampaignAnalyticsService.getDailyMetrics(variantIds, 30),
    CampaignAnalyticsService.getRevenueBreakdownByCampaignIds(variantIds),
    PopupEventService.getImpressionCountsByCampaign(variantIds),
    CampaignAnalyticsService.getLeadCounts(variantIds),
    getStoreCurrency(admin),
  ]);

  // Aggregate Summary Stats
  let totalRevenue = 0;
  let totalOrders = 0;
  revenueMap.forEach((stats) => {
    totalRevenue += stats.revenue;
    totalOrders += stats.orderCount;
  });

  let totalImpressions = 0;
  impressionCounts.forEach((count) => (totalImpressions += count));

  let totalLeads = 0;
  leadCounts.forEach((count) => (totalLeads += count));

  const conversionRate = totalImpressions > 0 ? (totalLeads / totalImpressions) * 100 : 0;
  const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return data<LoaderData>({
    experimentName: experiment.name,
    summary: {
      impressions: totalImpressions,
      leads: totalLeads,
      conversionRate,
      revenue: totalRevenue,
      orders: totalOrders,
      aov,
    },
    dailyMetrics,
    currency,
  });
}

export default function ExperimentAnalyticsPage() {
  const { experimentName, summary, dailyMetrics, currency } = useLoaderData<typeof loader>();

  return (
    <Page
      title={`Analytics: ${experimentName}`}
      backAction={{ content: "Back to Experiment", url: "../" }}
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
            </BlockStack>
          </Card>
          <Card>
            <BlockStack gap="200">
              <Text as="h3" variant="headingSm" tone="subdued">
                Orders
              </Text>
              <Text as="p" variant="headingLg">
                {summary.orders}
              </Text>
            </BlockStack>
          </Card>
          <Card>
            <BlockStack gap="200">
              <Text as="h3" variant="headingSm" tone="subdued">
                Conversion Rate
              </Text>
              <Text as="p" variant="headingLg">
                {summary.conversionRate.toFixed(2)}%
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
            </BlockStack>
          </Card>
        </InlineGrid>

        {/* Daily Revenue Chart */}
        <Card>
          <Box padding="400">
            <BlockStack gap="400">
              <Text as="h3" variant="headingMd">
                Daily Revenue (Last 30 Days)
              </Text>
              <PolarisVizProvider>
                <div style={{ height: "250px" }}>
                  <BarChart
                    data={[
                      {
                        name: "Revenue",
                        data: dailyMetrics.map((day) => ({
                          key: day.date,
                          value: day.revenue,
                        })),
                      },
                    ]}
                    xAxisOptions={{
                      labelFormatter: (value) => {
                        if (value === null || value === undefined) return "";
                        const date = new Date(value);
                        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                      },
                    }}
                    yAxisOptions={{
                      labelFormatter: (value) => formatMoney(Number(value), currency),
                    }}
                  />
                </div>
              </PolarisVizProvider>
            </BlockStack>
          </Box>
        </Card>

        {/* Daily Breakdown Table */}
        <Card>
          <Box padding="400">
            <BlockStack gap="400">
              <Text as="h3" variant="headingMd">
                Daily Breakdown
              </Text>
              <DataTable
                columnContentTypes={["text", "numeric", "numeric", "numeric", "numeric"]}
                headings={["Date", "Impressions", "Leads", "Orders", "Revenue"]}
                rows={dailyMetrics.map((day) => [
                  new Date(day.date).toLocaleDateString(),
                  day.impressions,
                  day.leads,
                  "-", // Daily orders not yet in getDailyMetrics
                  formatMoney(day.revenue, currency),
                ])}
              />
            </BlockStack>
          </Box>
        </Card>
      </BlockStack>
    </Page>
  );
}
