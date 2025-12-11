/**
 * Declare Winner API
 *
 * Endpoint to declare a winning variant and update experiment
 */

import { data, type ActionFunctionArgs } from "react-router";
import { authenticate } from "~/shopify.server";
import { getStoreId } from "~/lib/auth-helpers.server";
import prisma from "~/db.server";
import { logger } from "~/lib/logger.server";

interface DeclareWinnerRequest {
  winningVariantKey: string;
}

export async function action({ request, params }: ActionFunctionArgs) {
  try {
    await authenticate.admin(request);
    const storeId = await getStoreId(request);
    const experimentId = params.experimentId;

    if (!experimentId) {
      return data({ success: false, error: "Experiment ID is required" }, { status: 400 });
    }

    const body = (await request.json()) as DeclareWinnerRequest;
    const { winningVariantKey } = body;

    if (!winningVariantKey) {
      return data({ success: false, error: "Winning variant key is required" }, { status: 400 });
    }

    // 1. Get all campaigns in this experiment
    const campaigns = await prisma.campaign.findMany({
      where: {
        experimentId,
        storeId,
      },
    });

    if (campaigns.length === 0) {
      return data(
        { success: false, error: "No campaigns found for this experiment" },
        { status: 404 }
      );
    }

    const winningCampaign = campaigns.find((c) => c.variantKey === winningVariantKey);

    if (!winningCampaign) {
      return data({ success: false, error: "Winning variant not found" }, { status: 404 });
    }

    const losingCampaigns = campaigns.filter((c) => c.variantKey !== winningVariantKey);

    // 2. Update traffic allocation: winner gets 100%, losers get paused
    await Promise.all([
      // Update experiment to record winner
      prisma.experiment.update({
        where: { id: experimentId },
        data: {
          trafficAllocation: {
            [winningVariantKey]: 100,
            ...Object.fromEntries(losingCampaigns.map((c) => [c.variantKey || "UNKNOWN", 0])),
          },
          status: "COMPLETED",
        },
      }),

      // Pause losing campaigns
      ...losingCampaigns.map((campaign) =>
        prisma.campaign.update({
          where: { id: campaign.id },
          data: { status: "PAUSED" },
        })
      ),
    ]);

    logger.info({ winningVariantKey, experimentId }, "[Declare Winner] Set winner for experiment");

    return data({ success: true });
  } catch (error) {
    logger.error({ error }, "[Declare Winner] Error");
    return data({ success: false, error: "Failed to declare winner" }, { status: 500 });
  }
}
