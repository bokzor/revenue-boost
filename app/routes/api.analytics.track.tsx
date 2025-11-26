/**
 * Generic analytics tracking endpoint for storefront events.
 *
 * POST /api/analytics/track
 *
 * Used by the storefront extension via ApiClient.trackEvent to
 * record optional popup events such as CLICK and CLOSE.
 */

import { data, type ActionFunctionArgs } from "react-router";
import type { PopupEventType, VariantKey } from "@prisma/client";
import { PopupEventService } from "~/domains/analytics/popup-events.server";
import { storefrontCors } from "~/lib/cors.server";
import { getOrCreateVisitorId } from "~/lib/visitor-id.server";
import { getStoreIdFromShop } from "~/lib/auth-helpers.server";

export async function action({ request }: ActionFunctionArgs) {
  const headers = storefrontCors();

  if (request.method !== "POST") {
    return data({ success: false, error: "Method not allowed" }, { status: 405, headers });
  }

  try {
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");

    if (!shop) {
      return data({ success: false, error: "Missing shop parameter" }, { status: 400, headers });
    }

    const body = (await request.json().catch(() => null)) as {
      type?: string;
      campaignId?: string;
      sessionId?: string;
      data?: Record<string, unknown>;
    } | null;

    if (!body) {
      return data({ success: false, error: "Invalid JSON body" }, { status: 400, headers });
    }

    const { type, campaignId, sessionId, data: eventData } = body;

    if (!type || !campaignId || !sessionId) {
      return data(
        { success: false, error: "type, campaignId and sessionId are required" },
        { status: 400, headers }
      );
    }

    const normalizedType = String(type).toUpperCase();
    if (normalizedType !== "CLICK" && normalizedType !== "CLOSE") {
      return data({ success: false, error: "Unsupported event type" }, { status: 400, headers });
    }

    const eventType = normalizedType as PopupEventType;
    const storeId = await getStoreIdFromShop(shop);
    const visitorId = await getOrCreateVisitorId(request);
    const userAgent = request.headers.get("User-Agent") || null;
    const deviceType = detectDeviceTypeFromUserAgent(userAgent);
    const pageUrl =
      (eventData?.pageUrl as string | undefined) || request.headers.get("referer") || "/";
    const referrer =
      (eventData?.referrer as string | undefined) || request.headers.get("referer") || null;
    const ipAddress = getClientIP(request);

    await PopupEventService.recordEvent({
      storeId,
      campaignId,
      experimentId: (eventData?.experimentId as string | null | undefined) ?? null,
      variantKey: (eventData?.variantKey as VariantKey | null | undefined) ?? null,
      sessionId,
      visitorId,
      eventType,
      pageUrl,
      referrer,
      userAgent,
      ipAddress,
      deviceType,
      metadata: {
        source: "track_endpoint",
        ...eventData,
      },
    });

    return data({ success: true }, { headers });
  } catch (error) {
    console.error("[Analytics] Error in /api/analytics/track:", error);
    return data({ success: false, error: "Failed to track event" }, { status: 500, headers });
  }
}

// Minimal helpers duplicated from /api/analytics/frequency to avoid coupling.
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

function detectDeviceTypeFromUserAgent(userAgent: string | null): string | null {
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
