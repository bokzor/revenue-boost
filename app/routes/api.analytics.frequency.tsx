/**
 * Analytics Frequency Tracking API
 *
 * Tracks frequency cap data for campaigns
 * POST /api/analytics/frequency
 */

import { data, type ActionFunctionArgs } from "react-router";
import { FrequencyCapService } from "~/domains/targeting/services/frequency-cap.server";
import { storefrontCors } from "~/lib/cors.server";
import { getOrCreateVisitorId } from "~/lib/visitor-id.server";

export async function action({ request }: ActionFunctionArgs) {
  const headers = storefrontCors();

  try {
    const body = await request.json();
    const { campaignId, sessionId } = body;

    if (!campaignId) {
      return data(
        { success: false, error: "campaignId is required" },
        { status: 400, headers }
      );
    }

    // Get or create visitor ID from cookie
    const visitorId = await getOrCreateVisitorId(request);

    // Record the display using FrequencyCapService
    // Note: campaignId here is actually the trackingKey (experimentId or campaignId)
    // The storefront already passes the correct tracking key
    await FrequencyCapService.recordDisplay(
      campaignId, // This is actually trackingKey from storefront
      {
        visitorId,
        sessionId: sessionId || visitorId,
        pageUrl: request.headers.get("referer") || "/",
        deviceType: "desktop", // Could be enhanced to detect from user-agent
      }
    );

    console.log("[Analytics] Frequency tracking recorded:", { campaignId, visitorId });

    return data({ success: true }, { headers });
  } catch (error) {
    console.error("[Analytics] Error tracking frequency:", error);
    return data(
      { success: false, error: "Failed to track frequency" },
      { status: 500, headers }
    );
  }
}

