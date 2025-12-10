import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, useFetcher, useNavigate, useSearchParams, data } from "react-router";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineGrid,
  InlineStack,
  Box,
  EmptyState,
  Select,
  SkeletonBodyText,
  SkeletonDisplayText,
  Banner,
  Link,
} from "@shopify/polaris";
import { PlusIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import { CampaignService } from "~/domains/campaigns";
import { CampaignIndexTable } from "~/domains/campaigns/components";
import { getStoreId } from "~/lib/auth-helpers.server";
import { getStoreCurrency } from "~/lib/currency.server";
import { useState, useEffect } from "react";
import type { ExperimentWithVariants } from "~/domains/campaigns/types/experiment";
import type { CampaignStatus } from "~/domains/campaigns/types/campaign";
import { SetupStatus, type SetupStatusData } from "~/domains/setup/components/SetupStatus";
import { PostBillingReviewTrigger } from "~/domains/reviews";
import { BillingService } from "~/domains/billing/index.server";

// --- Types ---

interface CampaignDashboardRow {
  [key: string]: string | number | null | boolean | undefined;
  id: string;
  name: string;
  status: string;
  templateType: string;
  goal: string;
  views: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  lastUpdated: string;
  experimentId?: string | null;
  variantKey?: string | null;
  isControl?: boolean;
}

interface LoaderData {
  currency: string;
  themeEditorUrl: string;
  chargeId: string | null;
  recentUpgrade: {
    fromPlan: string;
    toPlan: string;
    createdAt: string;
  } | null;
}

// Setup status API response type
interface SetupStatusApiResponse {
  status: SetupStatusData;
  setupComplete: boolean;
}

// API response types for fetchers
interface MetricsApiResponse {
  success: boolean;
  data: {
    revenue: number;
    leads: number;
    activeCampaigns: number;
    conversionRate: number;
  };
  hasCampaigns: boolean;
}

interface GrandfatheredCampaign {
  id: string;
  name: string;
  templateType: string;
  requiredPlan: string;
}

interface CampaignsApiResponse {
  success: boolean;
  data: {
    campaigns: CampaignDashboardRow[];
    experiments: ExperimentWithVariants[];
    grandfatheredCampaigns?: GrandfatheredCampaign[];
  };
}

// --- Loader (Minimal - instant navigation) ---

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const url = new URL(request.url);

  // Check for post-billing redirect (charge_id present after successful payment)
  const chargeId = url.searchParams.get("charge_id");
  let recentUpgrade: LoaderData["recentUpgrade"] = null;

  if (chargeId) {
    try {
      const billingContext = await BillingService.getBillingContextFromDbByDomain(session.shop);
      if (
        billingContext &&
        billingContext.planTier !== "FREE" &&
        billingContext.hasActiveSubscription
      ) {
        recentUpgrade = {
          fromPlan: "FREE",
          toPlan: billingContext.planTier,
          createdAt: new Date().toISOString(),
        };
        console.log("[Dashboard] Detected post-billing upgrade:", recentUpgrade);
      }
    } catch (error) {
      console.error("[Dashboard] Error checking billing context:", error);
    }
  }

  // Only fetch currency - setup status will be lazy loaded
  const currency = await getStoreCurrency(admin);
  const themeEditorUrl = `https://${session.shop}/admin/themes/current/editor?context=apps`;

  return data<LoaderData>({
    currency,
    themeEditorUrl,
    chargeId,
    recentUpgrade,
  });
};

// --- Action ---

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const storeId = await getStoreId(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "toggle_status") {
    const campaignId = formData.get("campaignId") as string;
    const currentStatus = formData.get("currentStatus") as string;
    const newStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE";

    await CampaignService.updateCampaign(
      campaignId,
      storeId,
      { status: newStatus as CampaignStatus },
      admin
    );
    return data({ success: true });
  }

  if (intent === "bulk_activate") {
    const campaignIds = JSON.parse(formData.get("campaignIds") as string);
    const results = await Promise.allSettled(
      campaignIds.map((id: string) =>
        CampaignService.updateCampaign(id, storeId, { status: "ACTIVE" as CampaignStatus }, admin)
      )
    );
    const failed = results.filter((r) => r.status === "rejected").length;
    return data({
      success: failed === 0,
      message:
        failed > 0 ? `${failed} of ${campaignIds.length} campaigns failed to activate` : undefined,
    });
  }

  if (intent === "bulk_pause") {
    const campaignIds = JSON.parse(formData.get("campaignIds") as string);
    const results = await Promise.allSettled(
      campaignIds.map((id: string) =>
        CampaignService.updateCampaign(id, storeId, { status: "PAUSED" as CampaignStatus }, admin)
      )
    );
    const failed = results.filter((r) => r.status === "rejected").length;
    return data({
      success: failed === 0,
      message:
        failed > 0 ? `${failed} of ${campaignIds.length} campaigns failed to pause` : undefined,
    });
  }

  if (intent === "bulk_archive") {
    const campaignIds = JSON.parse(formData.get("campaignIds") as string);
    const results = await Promise.allSettled(
      campaignIds.map((id: string) =>
        CampaignService.updateCampaign(id, storeId, { status: "ARCHIVED" as CampaignStatus }, admin)
      )
    );
    const failed = results.filter((r) => r.status === "rejected").length;
    return data({
      success: failed === 0,
      message:
        failed > 0 ? `${failed} of ${campaignIds.length} campaigns failed to archive` : undefined,
    });
  }

  if (intent === "bulk_delete") {
    const campaignIds = JSON.parse(formData.get("campaignIds") as string);
    const results = await Promise.allSettled(
      campaignIds.map((id: string) => CampaignService.deleteCampaign(id, storeId))
    );
    const failed = results.filter((r) => r.status === "rejected").length;
    return data({
      success: failed === 0,
      message:
        failed > 0 ? `${failed} of ${campaignIds.length} campaigns failed to delete` : undefined,
    });
  }

  if (intent === "bulk_duplicate") {
    const campaignIds = JSON.parse(formData.get("campaignIds") as string);
    const results = await Promise.allSettled(
      campaignIds.map(async (id: string) => {
        return CampaignService.duplicateCampaign(id, storeId, admin);
      })
    );
    const failed = results.filter((r) => r.status === "rejected").length;
    return data({
      success: failed === 0,
      message:
        failed > 0 ? `${failed} of ${campaignIds.length} campaigns failed to duplicate` : undefined,
    });
  }

  // Single campaign duplicate action
  if (intent === "duplicate") {
    const campaignId = formData.get("campaignId") as string;
    if (!campaignId) {
      return data({ success: false, message: "Campaign ID is required" }, { status: 400 });
    }

    const newCampaign = await CampaignService.duplicateCampaign(campaignId, storeId, admin);
    return data({ success: true, campaignId: newCampaign.id });
  }

  return null;
};

// --- Skeleton Components ---

function GlobalMetricsSkeleton() {
  return (
    <InlineGrid columns={{ xs: 1, sm: 2, md: 4 }} gap="400">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <BlockStack gap="200">
            <SkeletonBodyText lines={1} />
            <SkeletonDisplayText size="medium" />
            <SkeletonBodyText lines={1} />
          </BlockStack>
        </Card>
      ))}
    </InlineGrid>
  );
}

function CampaignTableSkeleton() {
  return (
    <Card>
      <BlockStack gap="400">
        <InlineStack align="space-between">
          <SkeletonDisplayText size="small" />
          <SkeletonBodyText lines={1} />
        </InlineStack>
        <BlockStack gap="300">
          {Array.from({ length: 5 }).map((_, i) => (
            <Box key={i} paddingBlockStart="200" paddingBlockEnd="200">
              <InlineStack gap="400" blockAlign="center">
                <Box minWidth="24px">
                  <SkeletonBodyText lines={1} />
                </Box>
                <Box minWidth="200px">
                  <SkeletonBodyText lines={1} />
                </Box>
                <Box minWidth="80px">
                  <SkeletonBodyText lines={1} />
                </Box>
                <Box minWidth="80px">
                  <SkeletonBodyText lines={1} />
                </Box>
                <Box minWidth="80px">
                  <SkeletonBodyText lines={1} />
                </Box>
              </InlineStack>
            </Box>
          ))}
        </BlockStack>
      </BlockStack>
    </Card>
  );
}

// --- Components ---

function GlobalMetricCard({
  title,
  value,
  subtext,
}: {
  title: string;
  value: string;
  subtext?: string;
}) {
  return (
    <Card>
      <BlockStack gap="200">
        <Text as="h3" variant="headingSm" tone="subdued">
          {title}
        </Text>
        <Text as="p" variant="headingLg">
          {value}
        </Text>
        {subtext && (
          <Text as="span" tone="subdued" variant="bodySm">
            {subtext}
          </Text>
        )}
      </BlockStack>
    </Card>
  );
}

export default function Dashboard() {
  const { currency, themeEditorUrl, chargeId, recentUpgrade } = useLoaderData<typeof loader>();

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const timeRange = searchParams.get("timeRange") || "30d";

  // Fetchers for lazy loading
  const actionFetcher = useFetcher();
  const setupFetcher = useFetcher<SetupStatusApiResponse>();
  const metricsFetcher = useFetcher<MetricsApiResponse>();
  const campaignsFetcher = useFetcher<CampaignsApiResponse>();

  // Track which campaign is being toggled
  const [togglingCampaignId, setTogglingCampaignId] = useState<string | null>(null);

  // Trigger all data fetches on mount
  useEffect(() => {
    const params = `?timeRange=${timeRange}`;
    metricsFetcher.load(`/api/dashboard/metrics${params}`);
    campaignsFetcher.load(`/api/dashboard/campaigns${params}`);
    setupFetcher.load("/api/setup/status");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  // Extract setup status from fetcher
  const currentSetupStatus = setupFetcher.data?.status;
  const currentSetupComplete = setupFetcher.data?.setupComplete;
  const isRefreshingSetup = setupFetcher.state === "loading";

  // Extract data from fetchers
  const metricsData = metricsFetcher.data;
  const campaignsData = campaignsFetcher.data;
  const isLoadingMetrics = metricsFetcher.state === "loading" || !metricsData;
  const isLoadingCampaigns = campaignsFetcher.state === "loading" || !campaignsData;

  // Reset toggling state when action fetcher completes
  useEffect(() => {
    if (actionFetcher.state === "idle" && togglingCampaignId !== null) {
      setTogglingCampaignId(null);
      // Refetch campaigns after action completes
      const params = `?timeRange=${timeRange}`;
      metricsFetcher.load(`/api/dashboard/metrics${params}`);
      campaignsFetcher.load(`/api/dashboard/campaigns${params}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionFetcher.state, togglingCampaignId, timeRange]);

  const handleRefreshSetupStatus = () => {
    // Force refresh bypasses the cache
    setupFetcher.load("/api/setup/status?refresh=true");
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // --- Handlers ---
  const handleCreateCampaign = () => {
    navigate("/app/campaigns/create");
  };

  const handleTimeRangeChange = (value: string) => {
    setSearchParams({ timeRange: value });
  };

  const handleToggleStatus = (id: string, currentStatus: string) => {
    setTogglingCampaignId(id);
    actionFetcher.submit(
      { intent: "toggle_status", campaignId: id, currentStatus },
      { method: "post" }
    );
  };

  const handleCampaignClick = (id: string) => {
    navigate(`/app/campaigns/${id}`);
  };

  const handleEditClick = (id: string) => {
    navigate(`/app/campaigns/${id}/edit`);
  };

  const handleAnalyticsClick = (id: string) => {
    navigate(`/app/campaigns/${id}/analytics`);
  };

  // Bulk action handlers
  const handleBulkActivate = async (campaignIds: string[]) => {
    const formData = new FormData();
    formData.append("intent", "bulk_activate");
    formData.append("campaignIds", JSON.stringify(campaignIds));

    await actionFetcher.submit(formData, { method: "post" });
  };

  const handleBulkPause = async (campaignIds: string[]) => {
    const formData = new FormData();
    formData.append("intent", "bulk_pause");
    formData.append("campaignIds", JSON.stringify(campaignIds));

    await actionFetcher.submit(formData, { method: "post" });
  };

  const handleBulkArchive = async (campaignIds: string[]) => {
    const formData = new FormData();
    formData.append("intent", "bulk_archive");
    formData.append("campaignIds", JSON.stringify(campaignIds));

    await actionFetcher.submit(formData, { method: "post" });
  };

  const handleBulkDelete = async (campaignIds: string[]) => {
    const formData = new FormData();
    formData.append("intent", "bulk_delete");
    formData.append("campaignIds", JSON.stringify(campaignIds));

    await actionFetcher.submit(formData, { method: "post" });
  };

  const handleBulkDuplicate = async (campaignIds: string[]) => {
    const formData = new FormData();
    formData.append("intent", "bulk_duplicate");
    formData.append("campaignIds", JSON.stringify(campaignIds));

    await actionFetcher.submit(formData, { method: "post" });
  };

  // Single campaign duplicate handler
  const handleDuplicateClick = (campaignId: string) => {
    const formData = new FormData();
    formData.append("intent", "duplicate");
    formData.append("campaignId", campaignId);

    actionFetcher.submit(formData, { method: "post" });
  };

  // --- Zero State (only show after data loads and confirms no campaigns) ---
  if (metricsData && !metricsData.hasCampaigns) {
    return (
      <Page title="Dashboard">
        {/* Post-billing review trigger (invisible component) */}
        <PostBillingReviewTrigger chargeId={chargeId} recentUpgrade={recentUpgrade} />

        <Layout>
          {/* Setup Status Banner - Show if setup incomplete OR if there are any issues */}
          {currentSetupStatus &&
            (!currentSetupComplete ||
              !currentSetupStatus.themeExtensionEnabled ||
              !currentSetupStatus.appProxyOk) && (
              <Layout.Section>
                <SetupStatus
                  status={currentSetupStatus}
                  setupComplete={currentSetupComplete ?? false}
                  themeEditorUrl={themeEditorUrl}
                  compact
                  onRefresh={handleRefreshSetupStatus}
                  isRefreshing={isRefreshingSetup}
                />
              </Layout.Section>
            )}

          <Layout.Section>
            <EmptyState
              heading="Start turning visitors into customers"
              action={{
                content: "Browse campaign recipes",
                onAction: handleCreateCampaign,
              }}
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>
                Revenue Boost helps you capture leads and increase sales with high-converting
                popups. Pick a ready-made recipe to get started in minutes.
              </p>
            </EmptyState>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  // Extract metrics for rendering
  const globalMetrics = metricsData?.data ?? {
    revenue: 0,
    leads: 0,
    activeCampaigns: 0,
    conversionRate: 0,
  };

  const campaigns = campaignsData?.data?.campaigns ?? [];
  const experiments = campaignsData?.data?.experiments ?? [];
  const grandfatheredCampaigns = campaignsData?.data?.grandfatheredCampaigns ?? [];

  // --- Main Dashboard ---
  return (
    <Page
      title="Dashboard"
      primaryAction={{
        content: "Create campaign",
        onAction: handleCreateCampaign,
        icon: PlusIcon,
      }}
      secondaryActions={
        <Select
          label="Time range"
          labelHidden
          options={[
            { label: "Last 7 days", value: "7d" },
            { label: "Last 30 days", value: "30d" },
            { label: "All time", value: "all" },
          ]}
          value={timeRange}
          onChange={handleTimeRangeChange}
        />
      }
    >
      {/* Post-billing review trigger (invisible component) */}
      <PostBillingReviewTrigger chargeId={chargeId} recentUpgrade={recentUpgrade} />

      <Layout>
        {/* Setup Status Banner - Show if setup incomplete OR if there are any issues */}
        {currentSetupStatus &&
          (!currentSetupComplete ||
            !currentSetupStatus.themeExtensionEnabled ||
            !currentSetupStatus.appProxyOk) && (
            <Layout.Section>
              <SetupStatus
                status={currentSetupStatus}
                setupComplete={currentSetupComplete ?? false}
                themeEditorUrl={themeEditorUrl}
                compact
                onRefresh={handleRefreshSetupStatus}
                isRefreshing={isRefreshingSetup}
              />
            </Layout.Section>
          )}

        {/* Grandfathered Campaigns Banner - Show when user has active campaigns using locked templates */}
        {grandfatheredCampaigns.length > 0 && (
          <Layout.Section>
            <Banner tone="warning">
              <Text as="p" variant="bodyMd">
                You have {grandfatheredCampaigns.length} active campaign
                {grandfatheredCampaigns.length > 1 ? "s" : ""} using premium features (
                {grandfatheredCampaigns.map((c) => c.name).join(", ")}). These will continue running,
                but you cannot create new campaigns with these templates.{" "}
                <Link url="/app/billing">Upgrade your plan</Link> to unlock full access.
              </Text>
            </Banner>
          </Layout.Section>
        )}

        {/* Global Metrics */}
        <Layout.Section>
          {isLoadingMetrics ? (
            <GlobalMetricsSkeleton />
          ) : (
            <InlineGrid columns={{ xs: 1, sm: 2, md: 4 }} gap="400">
              <GlobalMetricCard
                title="Revenue attributed"
                value={formatMoney(globalMetrics.revenue)}
                subtext="Total revenue from campaigns"
              />
              <GlobalMetricCard
                title="Leads captured"
                value={globalMetrics.leads.toLocaleString()}
                subtext="Total signups"
              />
              <GlobalMetricCard
                title="Active campaigns"
                value={globalMetrics.activeCampaigns.toString()}
                subtext="Currently running"
              />
              <GlobalMetricCard
                title="Conversion rate"
                value={`${globalMetrics.conversionRate.toFixed(1)}%`}
                subtext="Visits to conversions"
              />
            </InlineGrid>
          )}
        </Layout.Section>

        {/* Active Campaigns Table */}
        <Layout.Section>
          {isLoadingCampaigns ? (
            <CampaignTableSkeleton />
          ) : (
            <CampaignIndexTable
              campaigns={campaigns}
              experiments={experiments}
              onCampaignClick={handleCampaignClick}
              onEditClick={handleEditClick}
              onAnalyticsClick={handleAnalyticsClick}
              onToggleStatus={handleToggleStatus}
              onDuplicateClick={handleDuplicateClick}
              onBulkActivate={handleBulkActivate}
              onBulkPause={handleBulkPause}
              onBulkArchive={handleBulkArchive}
              onBulkDelete={handleBulkDelete}
              onBulkDuplicate={handleBulkDuplicate}
              formatMoney={formatMoney}
              showMetrics={true}
              togglingCampaignId={togglingCampaignId}
            />
          )}
        </Layout.Section>
      </Layout>
    </Page>
  );
}
