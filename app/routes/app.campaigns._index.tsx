/**
 * Campaign List Page
 *
 * Main page for displaying and managing campaigns with full CRUD operations
 */

import { data, type LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigate, useRevalidator } from "react-router";
import { Page, Toast, Frame } from "@shopify/polaris";
import { useState } from "react";

import { authenticate } from "~/shopify.server";
import { CampaignService } from "~/domains/campaigns";
import { CampaignList } from "~/domains/campaigns/components";
import type { CampaignWithConfigs } from "~/domains/campaigns/types/campaign";

// ============================================================================
// TYPES
// ============================================================================

interface LoaderData {
  campaigns: CampaignWithConfigs[];
  storeId: string;
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

    // Get campaigns for this store
    const campaigns = await CampaignService.getAllCampaigns(session.shop);

    return data<LoaderData>({
      campaigns,
      storeId: session.shop,
    });

  } catch (error) {
    console.error("Failed to load campaigns:", error);

    return data<LoaderData>({
      campaigns: [],
      storeId: "",
    }, { status: 500 });
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function CampaignsIndexPage() {
  const { campaigns, storeId } = useLoaderData<typeof loader>();
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
    navigate(`/app/campaigns/${campaignId}/edit`);
  };

  const handleCampaignDuplicate = async (campaignId: string) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch campaign");
      }

      const { data: campaign } = await response.json();

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
        <CampaignList
          campaigns={campaigns}
          loading={revalidator.state === "loading"}
          onCampaignSelect={handleCampaignSelect}
          onCampaignEdit={handleCampaignEdit}
          onCampaignDelete={handleCampaignDelete}
          onCampaignDuplicate={handleCampaignDuplicate}
          onCreateNew={handleCreateNew}
        />
      </Page>
      {toastMarkup}
    </Frame>
  );
}
