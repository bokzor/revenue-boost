/**
 * Analytics Frequency Tracking API
 *
 * Tracks frequency cap data for campaigns
 * POST /api/analytics/frequency
 */

import { data, type ActionFunctionArgs } from "react-router";
import { FrequencyCapService } from "~/domains/targeting/services/frequency-cap.server";
import { PopupEventService } from "~/domains/analytics/popup-events.server";
import { recordImpression } from "~/domains/security/services/submission-validator.server";
import { storefrontCors } from "~/lib/cors.server";
import { getStoreIdFromShop } from "~/lib/auth-helpers.server";
import prisma from "~/db.server";
import type { StoreSettings } from "~/domains/store/types/settings";

export async function action({ request }: ActionFunctionArgs) {
  const headers = storefrontCors();

  try {
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");

    if (!shop) {
      return data({ success: false, error: "Missing shop parameter" }, { status: 400, headers });
    }

    const body = await request.json();
    const {
      campaignId,
      trackingKey: rawTrackingKey,
      experimentId,
      sessionId,
      visitorId: bodyVisitorId, // Use visitorId from client (localStorage-based)
      pageUrl: bodyPageUrl,
      referrer: bodyReferrer,
    } = body;

    const trackingKey = rawTrackingKey || campaignId;

    if (!campaignId || !trackingKey) {
      return data(
        { success: false, error: "campaignId and trackingKey are required" },
        { status: 400, headers }
      );
    }

    const storeId = await getStoreIdFromShop(shop);

    // Use visitorId from body (client's localStorage) for consistent tracking across requests
    // This avoids cross-origin cookie issues with SameSite policies
    const visitorId = bodyVisitorId || sessionId || "anonymous";
    const userAgent = request.headers.get("User-Agent") || null;
    const deviceType = detectDeviceTypeFromUserAgent(userAgent);
    const pageUrl = bodyPageUrl || request.headers.get("referer") || "/";
    const referrer = bodyReferrer || request.headers.get("referer") || null;
    const ipAddress = getClientIP(request);

    // Fetch campaign to get frequency capping rules
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        targetRules: true,
        templateType: true,
      },
    });

    // Extract frequency capping rules from campaign
    const targetRules = campaign?.targetRules as { enhancedTriggers?: { frequency_capping?: Record<string, unknown> } } | null;
    const frequencyRules = targetRules?.enhancedTriggers?.frequency_capping;

    // Fetch store settings for global frequency capping
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { settings: true },
    });
    const storeSettings = store?.settings as StoreSettings | undefined;

    // Record the display using FrequencyCapService (Redis-based frequency capping)
    await FrequencyCapService.recordDisplay(
      trackingKey,
      {
        visitorId,
        sessionId: sessionId || visitorId,
        pageUrl,
        deviceType: deviceType || "desktop",
      },
      frequencyRules,
      storeSettings,
      campaign?.templateType
    );

    // Record impression for submission validation (bot detection)
    await recordImpression(visitorId, campaignId);

    // Also record a VIEW event in PopupEvent for long-term analytics
    try {
      await PopupEventService.recordEvent({
        storeId,
        campaignId,
        experimentId: experimentId ?? null,
        variantKey: null,
        sessionId: sessionId || visitorId,
        visitorId,
        eventType: "VIEW",
        pageUrl,
        referrer,
        userAgent,
        ipAddress,
        deviceType,
        metadata: {
          trackingKey,
          source: "frequency_endpoint",
        },
      });
    } catch (eventError) {
      // Don't fail the request if analytics write fails
      console.error("[Analytics] Failed to record popup VIEW event:", eventError);
    }

    console.log("[Analytics] Frequency tracking recorded:", {
      campaignId,
      trackingKey,
      storeId,
      visitorId,
    });

    return data({ success: true }, { headers });
  } catch (error) {
    console.error("[Analytics] Error tracking frequency:", error);
    return data({ success: false, error: "Failed to track frequency" }, { status: 500, headers });
  }
}

function getClientIP(request: Request): string | null {
  const headers = ["CF-Connecting-IP", "X-Forwarded-For", "X-Real-IP", "X-Client-IP"];

  for (const header of headers) {
    const value = request.headers.get(header);
    if (value) {
      return value.split(",")[0].trim();
    }
  }

  return null;
}

function detectDeviceTypeFromUserAgent(
  userAgent: string | null
): "mobile" | "tablet" | "desktop" | null {
  if (!userAgent) return null;
  const ua = userAgent.toLowerCase();

  if (/android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
    return "mobile";
  }

  if (/ipad|android(?!.*mobile)/i.test(ua)) {
    return "tablet";
  }

  return "desktop";
}
