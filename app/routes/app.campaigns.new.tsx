/**
 * Campaign Creation Route (Refactored)
 *
 * Uses the refactored CampaignFormWithABTesting component with:
 * - Complete visual parity with original
 * - Improved architecture and type safety
 * - Better separation of concerns
 * - All original features preserved
 */

import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { data, useLoaderData, useNavigate } from "react-router";
import { authenticate } from "~/shopify.server";
import { getStoreId } from "~/lib/auth-helpers.server";
import { CampaignFormWithABTesting } from "~/domains/campaigns/components/CampaignFormWithABTesting";
import type { CampaignFormData } from "~/shared/hooks/useWizardState";

// ============================================================================
// LOADER - Fetch necessary data for form
// ============================================================================

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);

  try {
    const storeId = await getStoreId(request);

    return data({
      storeId,
      shopDomain: session.shop,
      success: true,
    });
  } catch (error) {
    return data({
      storeId: "",
      shopDomain: "",
      success: false,
      error: error instanceof Error ? error.message : "Failed to load data",
    });
  }
}

// ============================================================================
// ACTION - Not used (form handles submission directly)
// ============================================================================

export async function action({ request }: ActionFunctionArgs) {
  await authenticate.admin(request);

  return data({
    success: false,
    error: "This route does not handle POST requests. Use the form's onSave handler.",
  }, { status: 400 });
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function NewCampaign() {
  const loaderData = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const { storeId, shopDomain } = loaderData;

  // Handle save - create campaign(s) via API
  const handleSave = async (campaignData: CampaignFormData | CampaignFormData[]) => {
    try {
      // Use fetch to call our API routes instead of importing server services
      if (Array.isArray(campaignData)) {
        // A/B Testing: Create experiment with multiple variants
        const firstVariant = campaignData[0];

        // Extract experiment metadata from first variant
        const experimentData = {
          name: (firstVariant as { experimentName?: string }).experimentName,
          description: (firstVariant as { experimentDescription?: string }).experimentDescription,
          hypothesis: (firstVariant as { experimentHypothesis?: string }).experimentHypothesis,
          trafficAllocation: campaignData.reduce((acc, variant, index) => {
            const key = ["A", "B", "C", "D"][index];
            acc[key] = (variant as { trafficAllocation?: number }).trafficAllocation || Math.floor(100 / campaignData.length);
            return acc;
          }, {} as Record<string, number>),
          statisticalConfig: {
            confidenceLevel: 0.95,
            minimumSampleSize: 100,
            minimumDetectableEffect: 0.05,
            maxDurationDays: 30,
          },
          successMetrics: {
            primaryMetric: (firstVariant as { successMetric?: string }).successMetric || "conversion_rate",
            secondaryMetrics: ["click_through_rate"],
          },
        };

        // Create experiment via API
        const expResponse = await fetch("/api/experiments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(experimentData),
        });

        if (!expResponse.ok) {
          throw new Error("Failed to create experiment");
        }

        const { data: experiment } = await expResponse.json();

        // Create campaigns for each variant via API
        const campaignPromises = campaignData.map(async (variant, index) => {
          const campaignCreateData = {
            name: variant.name || `${experimentData.name} - Variant ${["A", "B", "C", "D"][index]}`,
            description: variant.description,
            goal: variant.goal,
            status: variant.status || "DRAFT",
            priority: variant.priority || 0,
            templateId: variant.templateId,
            templateType: variant.templateType,
            contentConfig: variant.contentConfig,
            designConfig: variant.designConfig,
            targetRules: {
              enhancedTriggers: variant.enhancedTriggers,
              audienceTargeting: variant.audienceTargeting,
              frequencyCapping: variant.frequencyCapping,
            },
            discountConfig: variant.discountConfig,
            experimentId: experiment.id,
            variantKey: ["A", "B", "C", "D"][index] as "A" | "B" | "C" | "D",
            isControl: index === 0,
            startDate: variant.startDate,
            endDate: variant.endDate,
            tags: variant.tags,
          };

          const response = await fetch("/api/campaigns", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(campaignCreateData),
          });

          if (!response.ok) {
            throw new Error("Failed to create campaign variant");
          }

          return response.json();
        });

        await Promise.all(campaignPromises);

        // Redirect to experiment detail page
        navigate(`/app/experiments/${experiment.id}`);
      } else {
        // Single campaign
        const campaignCreateData = {
          name: campaignData.name,
          description: campaignData.description,
          goal: campaignData.goal,
          status: campaignData.status || "DRAFT",
          priority: campaignData.priority || 0,
          templateId: campaignData.templateId,
          templateType: campaignData.templateType,
          contentConfig: campaignData.contentConfig,
          designConfig: campaignData.designConfig,
          targetRules: {
            enhancedTriggers: campaignData.enhancedTriggers,
            audienceTargeting: campaignData.audienceTargeting,
            frequencyCapping: campaignData.frequencyCapping,
          },
          discountConfig: campaignData.discountConfig,
          startDate: campaignData.startDate,
          endDate: campaignData.endDate,
          tags: campaignData.tags,
        };

        const response = await fetch("/api/campaigns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(campaignCreateData),
        });

        if (!response.ok) {
          throw new Error("Failed to create campaign");
        }

        const { data: campaign } = await response.json();

        // Redirect to campaign detail page
        navigate(`/app/campaigns/${campaign.id}`);
      }
    } catch (error) {
      console.error("Failed to save campaign:", error);
      throw error;
    }
  };

  const handleCancel = () => {
    navigate("/app/campaigns");
  };

  return (
    <CampaignFormWithABTesting
      storeId={storeId}
      shopDomain={shopDomain}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
}

