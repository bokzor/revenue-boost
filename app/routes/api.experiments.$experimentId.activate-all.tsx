/**
 * Activate All Campaigns API Route
 *
 * POST /api/experiments/:experimentId/activate-all
 * Activates all campaign variants belonging to an experiment
 */

import { data, type ActionFunctionArgs } from "react-router";
import { authenticate } from "~/shopify.server";
import { getStoreId } from "~/lib/auth-helpers.server";
import { ExperimentService, CampaignService } from "~/domains/campaigns";
import { handleApiError } from "~/lib/api-error-handler.server";

// ============================================================================
// ACTION (POST /api/experiments/:experimentId/activate-all)
// ============================================================================

export async function action({ request, params }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    await authenticate.admin(request);
    const storeId = await getStoreId(request);
    const { experimentId } = params;

    if (!experimentId) {
      return data({ error: "Experiment ID is required" }, { status: 400 });
    }

    // Get experiment with variants
    const experiment = await ExperimentService.getExperimentById(experimentId, storeId);

    if (!experiment) {
      return data({ error: "Experiment not found" }, { status: 404 });
    }

    // Activate all campaign variants
    const updatePromises = experiment.variants.map((variant) =>
      CampaignService.updateCampaign(variant.id, storeId, { status: "ACTIVE" })
    );

    await Promise.all(updatePromises);

    return data({
      success: true,
      message: `Activated ${experiment.variants.length} campaign(s)`,
      activatedCount: experiment.variants.length,
    });
  } catch (error) {
    return handleApiError(error, "POST /api/experiments/:experimentId/activate-all");
  }
}
