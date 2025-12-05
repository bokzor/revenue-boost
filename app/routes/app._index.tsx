import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, useFetcher, useNavigate, useSearchParams, data } from "react-router";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineGrid,
  Button,
  InlineStack,
  Box,
  EmptyState,
  Select,
  SkeletonBodyText,
  SkeletonDisplayText,
} from "@shopify/polaris";
import { PlusIcon, CalendarIcon, ChartVerticalFilledIcon } from "@shopify/polaris-icons";
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

interface CampaignsApiResponse {
  success: boolean;
  data: {
    campaigns: CampaignDashboardRow[];
    experiments: ExperimentWithVariants[];
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
      if (billingContext && billingContext.planTier !== "FREE" && billingContext.hasActiveSubscription) {
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

    await CampaignService.updateCampaign(campaignId, storeId, { status: newStatus as CampaignStatus }, admin);
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
        const campaign = await CampaignService.getCampaignById(id, storeId);
        if (!campaign) throw new Error(`Campaign ${id} not found`);

        // Extract only the fields needed for CampaignCreateData
        const createData = {
          name: `${campaign.name} (Copy)`,
          description: campaign.description || undefined,
          goal: campaign.goal,
          status: "DRAFT" as CampaignStatus,
          priority: campaign.priority,
          templateId: campaign.templateId || undefined,
          templateType: campaign.templateType,
          contentConfig: campaign.contentConfig,
          designConfig: campaign.designConfig,
          targetRules: campaign.targetRules,
          discountConfig: campaign.discountConfig,
          experimentId: undefined, // Don't copy experiment association
          variantKey: undefined,
          isControl: undefined,
          startDate: campaign.startDate || undefined,
          endDate: campaign.endDate || undefined,
        };

        return CampaignService.createCampaign(storeId, createData, admin);
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

    const campaign = await CampaignService.getCampaignById(campaignId, storeId);
    if (!campaign) {
      return data({ success: false, message: "Campaign not found" }, { status: 404 });
    }

    // Extract only the fields needed for CampaignCreateData
    const createData = {
      name: `${campaign.name} (Copy)`,
      description: campaign.description || undefined,
      goal: campaign.goal,
      status: "DRAFT" as CampaignStatus,
      priority: campaign.priority,
      templateId: campaign.templateId || undefined,
      templateType: campaign.templateType,
      contentConfig: campaign.contentConfig,
      designConfig: campaign.designConfig,
      targetRules: campaign.targetRules,
      discountConfig: campaign.discountConfig,
      experimentId: undefined, // Don't copy experiment association
      variantKey: undefined,
      isControl: undefined,
      startDate: campaign.startDate || undefined,
      endDate: campaign.endDate || undefined,
    };

    const newCampaign = await CampaignService.createCampaign(storeId, createData, admin);
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

function TemplateTile({
  title,
  description,
  icon: Icon,
  onSelect,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  onSelect: () => void;
}) {
  return (
    <Card>
      <BlockStack gap="400">
        <InlineStack align="space-between">
          <Box background="bg-surface-secondary" padding="200" borderRadius="200">
            <Icon width={24} />
          </Box>
        </InlineStack>
        <BlockStack gap="200">
          <Text as="h3" variant="headingMd">
            {title}
          </Text>
          <Text as="p" tone="subdued">
            {description}
          </Text>
        </BlockStack>
        <Button onClick={onSelect} variant="primary">
          Use this template
        </Button>
      </BlockStack>
    </Card>
  );
}

export default function Dashboard() {
  const {
    currency,
    themeEditorUrl,
    chargeId,
    recentUpgrade,
  } = useLoaderData<typeof loader>();

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

  const handleCreateFromScratch = () => {
    navigate("/app/campaigns/create");
  };

  const handleTimeRangeChange = (value: string) => {
    setSearchParams({ timeRange: value });
  };

  const handleToggleStatus = (id: string, currentStatus: string) => {
    setTogglingCampaignId(id);
    actionFetcher.submit({ intent: "toggle_status", campaignId: id, currentStatus }, { method: "post" });
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
            (!currentSetupComplete || !currentSetupStatus.themeExtensionEnabled || !currentSetupStatus.appProxyOk) && (
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
              secondaryAction={{
                content: "Build from scratch",
                onAction: handleCreateFromScratch,
              }}
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>
                Revenue Boost helps you capture leads and increase sales with high-converting
                popups. Pick a ready-made recipe to get started in minutes.
              </p>
            </EmptyState>
          </Layout.Section>
          <Layout.Section>
            <Text as="h2" variant="headingMd">
              Popular Recipes
            </Text>
            <Box paddingBlockStart="400">
              <InlineGrid columns={{ xs: 1, sm: 1, md: 2, lg: 3 }} gap="400">
                <TemplateTile
                  title="🎁 Welcome Discount"
                  description="10% off for new subscribers"
                  icon={CalendarIcon}
                  onSelect={() => navigate("/app/campaigns/recipe")}
                />
                <TemplateTile
                  title="⚡ Flash Sale"
                  description="Limited time offers with countdown"
                  icon={ChartVerticalFilledIcon}
                  onSelect={() => navigate("/app/campaigns/recipe")}
                />
                <TemplateTile
                  title="🎡 Spin to Win"
                  description="Gamified email capture"
                  icon={ChartVerticalFilledIcon}
                  onSelect={() => navigate("/app/campaigns/recipe")}
                />
              </InlineGrid>
            </Box>
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
          (!currentSetupComplete || !currentSetupStatus.themeExtensionEnabled || !currentSetupStatus.appProxyOk) && (
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

        {/* Template Quick Start (Bottom) */}
        <Layout.Section>
          <Text as="h2" variant="headingMd">
            Start a new campaign
          </Text>
          <Box paddingBlockStart="400">
            <InlineGrid columns={{ xs: 1, sm: 1, md: 2, lg: 3 }} gap="400">
              <TemplateTile
                title="🎁 Welcome Discount"
                description="10% off for new subscribers"
                icon={CalendarIcon}
                onSelect={() => navigate("/app/campaigns/recipe")}
              />
              <TemplateTile
                title="⚡ Flash Sale"
                description="Limited time offers with countdown"
                icon={ChartVerticalFilledIcon}
                onSelect={() => navigate("/app/campaigns/recipe")}
              />
              <TemplateTile
                title="🎡 Spin to Win"
                description="Gamified email capture"
                icon={ChartVerticalFilledIcon}
                onSelect={() => navigate("/app/campaigns/recipe")}
              />
            </InlineGrid>
          </Box>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
