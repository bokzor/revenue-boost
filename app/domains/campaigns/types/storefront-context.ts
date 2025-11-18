/**
 * Storefront Context Types
 *
 * Context data sent from storefront to backend for campaign filtering
 */

import { z } from "zod";

/**
 * Storefront Context Schema
 * All fields are optional to handle partial data
 */
export const StorefrontContextSchema = z.object({
  // Page Context
  pageUrl: z.string().optional(),
  pageType: z.string().optional(), // product, collection, cart, home, etc.

  // Customer Context
  customerId: z.string().optional(),
  customerEmail: z.string().email().optional(),
  customerTags: z.array(z.string()).optional(),

  // Session Context
  sessionId: z.string().optional(),
  visitorId: z.string().optional(), // Persistent visitor ID for frequency capping
  visitCount: z.number().int().positive().optional(),
  isReturningVisitor: z.boolean().optional(),

  // Engagement Context
  timeOnSite: z.number().int().nonnegative().optional(),
  pageViews: z.number().int().nonnegative().optional(),
  currentPageType: z.string().optional(),
  productViewCount: z.number().int().nonnegative().optional(),
  addedToCartInSession: z.boolean().optional(),

  // Cart Context
  cartValue: z.number().nonnegative().optional(),
  cartItemCount: z.number().int().nonnegative().optional(),
  cartToken: z.string().optional(),

  // Device Context
  deviceType: z.enum(["mobile", "tablet", "desktop"]).optional(),
  userAgent: z.string().optional(),

  // Location Context (optional)
  country: z.string().optional(),
  region: z.string().optional(),

  // Product Context (if on product page)
  productId: z.string().optional(),
  productHandle: z.string().optional(),
  productType: z.string().optional(),
  productVendor: z.string().optional(),
  productTags: z.array(z.string()).optional(),

  // Collection Context (if on collection page)
  collectionId: z.string().optional(),
  collectionHandle: z.string().optional(),

  // Timestamp
  timestamp: z.number().int().positive().optional(),
});

export type StorefrontContext = z.infer<typeof StorefrontContextSchema>;

/**
 * Build storefront context from request
 */
export function buildStorefrontContext(
  searchParams: URLSearchParams,
  headers: Headers
): StorefrontContext {
  const userAgent = headers.get("user-agent") || "";

  return {
    // Page Context
    pageUrl: searchParams.get("pageUrl") || undefined,
    pageType: searchParams.get("pageType") || undefined,

    // Customer Context
    customerId: searchParams.get("customerId") || undefined,
    customerEmail: searchParams.get("customerEmail") || undefined,
    customerTags: searchParams.get("customerTags")?.split(",") || undefined,

    // Session Context
    sessionId: searchParams.get("sessionId") || undefined,
    visitCount: parseInt(searchParams.get("visitCount") || "0") || undefined,
    isReturningVisitor: searchParams.get("isReturningVisitor") === "true" || undefined,

    // Engagement Context
    timeOnSite: parseInt(searchParams.get("timeOnSite") || "0") || undefined,
    pageViews: parseInt(searchParams.get("pageViews") || "0") || undefined,
    currentPageType: searchParams.get("currentPageType") || undefined,
    productViewCount: parseInt(searchParams.get("productViewCount") || "0") || undefined,
    addedToCartInSession:
      searchParams.get("addedToCartInSession") === "true" || undefined,

    // Cart Context
    cartValue: parseFloat(searchParams.get("cartValue") || "0") || undefined,
    cartItemCount: parseInt(searchParams.get("cartItemCount") || "0") || undefined,
    cartToken: searchParams.get("cartToken") || undefined,

    // Device Context
    deviceType: detectDeviceType(userAgent),
    userAgent,

    // Product Context
    productId: searchParams.get("productId") || undefined,
    productHandle: searchParams.get("productHandle") || undefined,
    productType: searchParams.get("productType") || undefined,
    productVendor: searchParams.get("productVendor") || undefined,
    productTags: searchParams.get("productTags")?.split(",") || undefined,

    // Collection Context
    collectionId: searchParams.get("collectionId") || undefined,
    collectionHandle: searchParams.get("collectionHandle") || undefined,

    // Timestamp
    timestamp: Date.now(),
  };
}

/**
 * Detect device type from user agent
 */
function detectDeviceType(userAgent: string): "mobile" | "tablet" | "desktop" {
  const ua = userAgent.toLowerCase();

  // Mobile detection
  if (/android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
    return "mobile";
  }

  // Tablet detection
  if (/ipad|android(?!.*mobile)/i.test(ua)) {
    return "tablet";
  }

  return "desktop";
}

/**
 * Validate storefront context
 */
export function validateStorefrontContext(data: unknown): StorefrontContext {
  return StorefrontContextSchema.parse(data);
}

