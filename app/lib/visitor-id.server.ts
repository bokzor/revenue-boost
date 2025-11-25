/**
 * Visitor ID Cookie Management
 *
 * Handles persistent visitor identification for cross-session tracking
 * Used for frequency capping and visitor analytics
 */

import { createCookie } from "react-router";
import { randomBytes } from "crypto";

/**
 * Visitor ID cookie configuration
 * - 90 days expiration (matches Redis TTL)
 * - HttpOnly for security
 * - SameSite=Lax for cross-site compatibility
 */
export const visitorIdCookie = createCookie("rb_visitor_id", {
  maxAge: 60 * 60 * 24 * 90, // 90 days
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
});

/**
 * Generate a new visitor ID
 * Format: visitor_<timestamp>_<random>
 */
export function generateVisitorId(): string {
  const timestamp = Date.now();
  const random = randomBytes(8).toString("hex");
  return `visitor_${timestamp}_${random}`;
}

/**
 * Get or create visitor ID from request
 *
 * @param request - Incoming request
 * @returns Visitor ID (existing or newly generated)
 */
export async function getOrCreateVisitorId(request: Request): Promise<string> {
  // Try to get existing visitor ID from cookie
  const cookieHeader = request.headers.get("Cookie");
  const existingVisitorId = await visitorIdCookie.parse(cookieHeader);

  if (existingVisitorId && typeof existingVisitorId === "string") {
    return existingVisitorId;
  }

  // Generate new visitor ID if none exists
  return generateVisitorId();
}

/**
 * Set visitor ID cookie in response headers
 *
 * @param visitorId - Visitor ID to set
 * @returns Cookie header value
 */
export async function setVisitorIdCookie(visitorId: string): Promise<string> {
  return await visitorIdCookie.serialize(visitorId);
}

/**
 * Get visitor ID from request (without creating new one)
 *
 * @param request - Incoming request
 * @returns Visitor ID or null if not found
 */
export async function getVisitorId(request: Request): Promise<string | null> {
  const cookieHeader = request.headers.get("Cookie");
  const visitorId = await visitorIdCookie.parse(cookieHeader);

  if (visitorId && typeof visitorId === "string") {
    return visitorId;
  }

  return null;
}

/**
 * Clear visitor ID cookie
 *
 * @returns Cookie header value to clear the cookie
 */
export async function clearVisitorIdCookie(): Promise<string> {
  return await visitorIdCookie.serialize("", { maxAge: 0 });
}

/**
 * Extract visitor ID from storefront context or generate new one
 *
 * Used when storefront sends visitor ID in query params
 * Falls back to cookie-based visitor ID
 *
 * @param request - Incoming request
 * @param contextVisitorId - Visitor ID from storefront context (optional)
 * @returns Visitor ID
 */
export async function resolveVisitorId(
  request: Request,
  contextVisitorId?: string
): Promise<string> {
  // Prefer visitor ID from context (sent by storefront)
  if (contextVisitorId) {
    return contextVisitorId;
  }

  // Fall back to cookie-based visitor ID
  return await getOrCreateVisitorId(request);
}

/**
 * Create response headers with visitor ID cookie
 *
 * @param visitorId - Visitor ID to set
 * @param existingHeaders - Existing headers to merge with (optional)
 * @returns Headers object with Set-Cookie header
 */
export async function createVisitorIdHeaders(
  visitorId: string,
  existingHeaders?: HeadersInit
): Promise<Headers> {
  const headers = new Headers(existingHeaders);
  const cookieValue = await setVisitorIdCookie(visitorId);
  headers.append("Set-Cookie", cookieValue);
  return headers;
}

/**
 * Middleware helper to ensure visitor ID exists
 *
 * @param request - Incoming request
 * @returns Object with visitorId and headers to set cookie
 */
export async function ensureVisitorId(request: Request): Promise<{
  visitorId: string;
  headers: Headers;
}> {
  const visitorId = await getOrCreateVisitorId(request);
  const headers = await createVisitorIdHeaders(visitorId);

  return { visitorId, headers };
}
