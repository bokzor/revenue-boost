import { data, type ActionFunctionArgs } from "react-router";
import { CampaignService } from "~/domains/campaigns";
import { validateResourceExists } from "~/lib/api-helpers.server";
import { handleApiError } from "~/lib/api-error-handler.server";
import { getStoreId } from "~/lib/auth-helpers.server";
import { withWriteRateLimit } from "~/lib/rate-limit-middleware.server";
import { authenticate } from "~/shopify.server";
import { PlanGuardService } from "~/domains/billing/services/plan-guard.server";

export async function action(args: ActionFunctionArgs) {
    return withWriteRateLimit({ ...args, context: args.context as unknown }, async ({ request, params }) => {
        try {
            const { admin } = await authenticate.admin(request);
            const storeId = await getStoreId(request);
            const campaignId = params.campaignId;

            if (!campaignId) {
                throw new Error("Campaign ID is required");
            }

            if (request.method !== "POST") {
                throw new Error(`Method ${request.method} not allowed`);
            }

            // Get the original campaign to check template type
            const originalCampaign = await CampaignService.getCampaignById(campaignId, storeId);
            validateResourceExists(originalCampaign, "Campaign");

            // Check if template type is allowed on user's plan (blocks duplicating locked templates)
            await PlanGuardService.assertCanUseTemplateType(storeId, originalCampaign.templateType);

            const newCampaign = await CampaignService.duplicateCampaign(campaignId, storeId, admin);
            validateResourceExists(newCampaign, "Campaign");

            return data({ campaign: newCampaign }, { status: 201 });
        } catch (error) {
            return handleApiError(error, `POST /api/campaigns/${args.params.campaignId}/duplicate`);
        }
    });
}
