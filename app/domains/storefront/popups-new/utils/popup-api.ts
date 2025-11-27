/**
 * Popup API Helper
 *
 * Centralizes security logic for popup API calls.
 * Automatically includes sessionId, visitorId, and popupShownAt for bot detection.
 */

interface SecureRequestData {
  campaignId: string;
  sessionId: string;
  visitorId: string;
  popupShownAt?: number;
  [key: string]: unknown;
}

/**
 * Get security context from globals (set by PopupManagerPreact)
 */
function getSecurityContext(): {
  sessionId: string;
  visitorId: string;
  popupShownAt?: number;
} {
  if (typeof window === "undefined") {
    return { sessionId: "", visitorId: "", popupShownAt: undefined };
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return {
    sessionId: w.__RB_SESSION_ID || "",
    visitorId: w.__RB_VISITOR_ID || "",
    popupShownAt: w.__RB_POPUP_SHOWN_AT,
  };
}

/**
 * Create a secure request body with all required security fields
 */
export function createSecureRequest(
  campaignId: string,
  data: Record<string, unknown> = {}
): SecureRequestData {
  const security = getSecurityContext();
  return {
    ...data,
    campaignId,
    sessionId: security.sessionId,
    visitorId: security.visitorId,
    popupShownAt: security.popupShownAt,
  };
}

/**
 * Make a secure POST request to a popup API endpoint
 *
 * Automatically includes sessionId, visitorId, and popupShownAt for bot detection.
 *
 * @example
 * const result = await securePost<SpinResult>(
 *   "/apps/revenue-boost/api/popups/spin-win",
 *   campaignId,
 *   { email: "user@example.com" }
 * );
 */
export async function securePost<T = unknown>(
  endpoint: string,
  campaignId: string,
  data: Record<string, unknown> = {}
): Promise<T> {
  const body = createSecureRequest(campaignId, data);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  return response.json();
}

