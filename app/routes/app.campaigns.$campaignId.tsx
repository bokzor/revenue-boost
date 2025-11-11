/**
 * Campaign Detail Page
 *
 * Individual campaign view with full details and management options
 */

import { data, type LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigate, useRevalidator } from "react-router";
import { Frame, Toast } from "@shopify/polaris";
import { useState } from "react";

import { authenticate } from "~/shopify.server";
import { getStoreId } from "~/lib/auth-helpers.server";
import { CampaignService } from "~/domains/campaigns";
import { CampaignDetail } from "~/domains/campaigns/components";
import type { CampaignWithConfigs } from "~/domains/campaigns/types/campaign";

// ============================================================================
// TYPES
// ============================================================================

interface LoaderData {
  campaign: CampaignWithConfigs | null;
  storeId: string;
}

// ============================================================================
// LOADER
// ============================================================================

export async function loader({ request, params }: LoaderFunctionArgs) {
  try {
    const { session } = await authenticate.admin(request);

    if (!session?.shop) {
      throw new Error("No shop session found");
    }

    const campaignId = params.campaignId;
    if (!campaignId) {
      throw new Error("Campaign ID is required");
    }

    const storeId = await getStoreId(request);

    // Get campaign details
    const campaign = await CampaignService.getCampaignById(campaignId, storeId);

    return data<LoaderData>({
      campaign,
      storeId,
    });

  } catch (error) {
    console.error("Failed to load campaign:", error);

    return data<LoaderData>({
      campaign: null,
      storeId: "",
    }, { status: 404 });
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function CampaignDetailPage() {
  const { campaign } = useLoaderData<typeof loader>();
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
  const handleBack = () => {
    navigate("/app/campaigns");
  };

  const handleEdit = () => {
    console.log('[Campaign Detail] handleEdit called');
    console.log('[Campaign Detail] Campaign:', campaign?.id, 'experimentId:', campaign?.experimentId);
    if (campaign) {
      // If campaign is part of an A/B test, edit the experiment instead
      if (campaign.experimentId) {
        console.log('[Campaign Detail] Navigating to experiment edit:', `/app/experiments/${campaign.experimentId}/edit`);
        navigate(`/app/experiments/${campaign.experimentId}/edit`);
      } else {
        console.log('[Campaign Detail] Navigating to campaign edit:', `/app/campaigns/${campaign.id}/edit`);
        navigate(`/app/campaigns/${campaign.id}/edit`);
      }
    } else {
      console.log('[Campaign Detail] No campaign found, cannot edit');
    }
  };

  const handleDuplicate = async () => {
    if (!campaign) return;

    try {
      // Create duplicate with modified name
      const duplicateData = {
        ...campaign,
        name: `${campaign.name} (Copy)`,
        status: "DRAFT",
      };

      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(duplicateData),
      });

      if (!response.ok) {
        throw new Error("Failed to duplicate campaign");
      }

      const dupBody = await response.json();
      const newCampaign = dupBody?.data?.campaign ?? dupBody?.data;
      showToast("Campaign duplicated successfully");

      // Navigate to the new campaign
      navigate(`/app/campaigns/${newCampaign.id}`);

    } catch (error) {
      console.error("Failed to duplicate campaign:", error);
      showToast("Failed to duplicate campaign", true);
    }
  };

  const handleDelete = async () => {
    if (!campaign) return;

    if (!confirm("Are you sure you want to delete this campaign? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`/api/campaigns/${campaign.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete campaign");
      }

      showToast("Campaign deleted successfully");

      // Navigate back to campaigns list
      navigate("/app/campaigns");

    } catch (error) {
      console.error("Failed to delete campaign:", error);
      showToast("Failed to delete campaign", true);
    }
  };

  const handleToggleStatus = async () => {
    if (!campaign) return;

    const newStatus = campaign.status === "ACTIVE" ? "PAUSED" : "ACTIVE";

    try {
      const response = await fetch(`/api/campaigns/${campaign.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update campaign status");
      }

      showToast(`Campaign ${newStatus.toLowerCase()} successfully`);
      revalidator.revalidate();

    } catch (error) {
      console.error("Failed to update campaign status:", error);
      showToast("Failed to update campaign status", true);
    }
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
      <CampaignDetail
        campaign={campaign}
        loading={revalidator.state === "loading"}
        onBack={handleBack}
        onEdit={handleEdit}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
      />
      {toastMarkup}
    </Frame>
  );
}
