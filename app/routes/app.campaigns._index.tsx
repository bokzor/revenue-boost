/**
 * Campaign List Page
 *
 * Main page for displaying and managing campaigns with full CRUD operations
 */

import { data, type LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigate, useRevalidator } from "react-router";
import { Page, Toast, Frame, Banner } from "@shopify/polaris";
import { useState } from "react";

import { authenticate } from "~/shopify.server";
import { getStoreId } from "~/lib/auth-helpers.server";
import { CampaignService, ExperimentService } from "~/domains/campaigns";
import { CampaignList } from "~/domains/campaigns/components";
import type { CampaignWithConfigs } from "~/domains/campaigns/types/campaign";
import type { ExperimentWithVariants } from "~/domains/campaigns";

// ============================================================================
// TYPES
// ============================================================================

interface LoaderData {
  campaigns: CampaignWithConfigs[];
  experiments: ExperimentWithVariants[];
  storeId: string;
  setupComplete: boolean;
}

// ============================================================================
// LOADER
// ============================================================================

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const { session } = await authenticate.admin(request);

    if (!session?.shop) {
      throw new Error("No shop session found");
    }

    // Resolve storeId from session
    const storeId = await getStoreId(request);

    // Get campaigns for this store
    const startTime = Date.now();
    const campaigns = await CampaignService.getAllCampaigns(storeId);
    console.log(`[Performance] getAllCampaigns took ${Date.now() - startTime}ms`);

    // Fetch experiments for campaigns to display experiment names on the index
    const experimentIds = Array.from(new Set(
      campaigns.map(c => c.experimentId).filter((id): id is string => Boolean(id))
    ));

    let experiments: ExperimentWithVariants[] = [];
    if (experimentIds.length > 0) {
      // OPTIMIZED: Query only the experiments we need (avoids N+1 query)
      const expStartTime = Date.now();
      experiments = await ExperimentService.getExperimentsByIds(storeId, experimentIds);
      console.log(`[Performance] getExperimentsByIds took ${Date.now() - expStartTime}ms for ${experimentIds.length} experiments`);
    }

    // Check setup status - simplified to avoid fetch issues
    let setupComplete: boolean;
    try {
      // Just check if store exists for now
      const storeExists = !!storeId;
      setupComplete = storeExists;
    } catch (error) {
      console.error("Failed to check setup status:", error);
      setupComplete = true; // Default to true to not block the UI
    }

    return data<LoaderData>({
      campaigns,
      experiments,
      storeId,
      setupComplete,
    });

  } catch (error) {
    console.error("Failed to load campaigns:", error);

    return data<LoaderData>({
      campaigns: [],
      experiments: [],
      storeId: "",
      setupComplete: false,
    }, { status: 500 });
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function CampaignsIndexPage() {
  const { campaigns, experiments, setupComplete } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const revalidator = useRevalidator();

  // State for toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastError, setToastError] = useState(false);

  // Helper function to show toast
  const showToast = (message: string, isError = false) => {
    setToastMessage(message);
    setToastError(isError);
  };

  // Event handlers
  const handleCreateNew = () => {
    navigate("/app/campaigns/new");
  };

  const handleCampaignSelect = (campaign: CampaignWithConfigs) => {
    navigate(`/app/campaigns/${campaign.id}`);
  };

  const handleCampaignEdit = (campaignId: string) => {
    console.log('[Campaign Index] handleCampaignEdit called with campaignId:', campaignId);
    console.log('[Campaign Index] Attempting to navigate to:', `/app/campaigns/${campaignId}/edit`);
    try {
      navigate(`/app/campaigns/${campaignId}/edit`);
      console.log('[Campaign Index] Navigate called successfully');
    } catch (error) {
      console.error('[Campaign Index] Error during navigation:', error);
    }
  };

  const handleExperimentSelect = (experimentId: string) => {
    console.log('[Campaign Index] handleExperimentSelect called with experimentId:', experimentId);
    navigate(`/app/experiments/${experimentId}`);
  };

  const handleExperimentEdit = (experimentId: string, variantKey?: string) => {
    console.log('[Campaign Index] handleExperimentEdit called with experimentId:', experimentId, 'variantKey:', variantKey);
    const url = variantKey
      ? `/app/experiments/${experimentId}/edit?variant=${variantKey}`
      : `/app/experiments/${experimentId}/edit`;
    console.log('[Campaign Index] Navigating to:', url);
    navigate(url);
  };

  const handleCampaignDuplicate = async (campaignId: string) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch campaign");
      }

      const body = await response.json();
      const campaign = body?.data?.campaign ?? body?.data;

      // Create duplicate with modified name
      const duplicateData = {
        ...campaign,
        name: `${campaign.name} (Copy)`,
        status: "DRAFT",
      };

      const createResponse = await fetch("/api/campaigns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(duplicateData),
      });

      if (!createResponse.ok) {
        throw new Error("Failed to duplicate campaign");
      }

      showToast("Campaign duplicated successfully");
      revalidator.revalidate();

    } catch (error) {
      console.error("Failed to duplicate campaign:", error);
      showToast("Failed to duplicate campaign", true);
    }
  };

  const handleCampaignDelete = async (campaignId: string) => {
    if (!confirm("Are you sure you want to delete this campaign? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete campaign");
      }

      showToast("Campaign deleted successfully");
      revalidator.revalidate();

    } catch (error) {
      console.error("Failed to delete campaign:", error);
      showToast("Failed to delete campaign", true);
    }
  };

  // Page actions
  const primaryAction = {
    content: "Create campaign",
    onAction: handleCreateNew,
  };

  // Toast component
  const toastMarkup = toastMessage ? (
    <Toast
      content={toastMessage}
      error={toastError}
      onDismiss={() => setToastMessage(null)}
    />
  ) : null;

  return (
    <Frame>
      <Page
        title="Campaigns"
        subtitle="Manage your revenue boost campaigns"
        primaryAction={primaryAction}
      >
        {!setupComplete && (
          <Banner
            title="Setup Required"
            tone="warning"
            action={{
              content: "View Setup Status",
              onAction: () => navigate("/app/setup"),
            }}
          >
            <p>
              Your app setup is incomplete. The theme extension needs to be enabled for popups to appear on your storefront.
            </p>
          </Banner>
        )}
        <CampaignList
          campaigns={campaigns}
          experiments={experiments}
          loading={revalidator.state === "loading"}
          onCampaignSelect={handleCampaignSelect}
          onCampaignEdit={handleCampaignEdit}
          onExperimentSelect={handleExperimentSelect}
          onExperimentEdit={handleExperimentEdit}
          onCampaignDelete={handleCampaignDelete}
          onCampaignDuplicate={handleCampaignDuplicate}
          onCreateNew={handleCreateNew}
        />
      </Page>
      {toastMarkup}
    </Frame>
  );
}
