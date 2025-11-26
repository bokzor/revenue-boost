/**
 * Social Proof Tracking Types
 *
 * Zod schemas for runtime validation of tracking events
 */

import { z } from "zod";

/**
 * Event types that can be tracked
 */
export const EventTypeSchema = z.enum(["page_view", "product_view", "add_to_cart"]);
export type EventType = z.infer<typeof EventTypeSchema>;

/**
 * Track Event Request Body Schema
 *
 * Validates incoming tracking requests with:
 * - Required shop domain (must be valid Shopify domain)
 * - Required event type (one of the allowed types)
 * - Optional product ID (string)
 * - Optional page URL (must be valid URL if provided)
 */
export const TrackEventSchema = z.object({
  eventType: EventTypeSchema,
  productId: z.string().optional(),
  pageUrl: z.string().url().optional(),
  shop: z
    .string()
    .regex(
      /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/,
      "Shop must be a valid Shopify domain (e.g., store.myshopify.com)"
    ),
});

export type TrackEventBody = z.infer<typeof TrackEventSchema>;

/**
 * Validation helper function
 *
 * @param data - Raw request body
 * @returns Validation result with parsed data or errors
 */
export function validateTrackEvent(data: unknown) {
  return TrackEventSchema.safeParse(data);
}

/**
 * Social Proof Content Configuration
 *
 * Configuration options for social proof notifications
 */
export interface SocialProofContentConfig {
  // Notification type toggles
  enablePurchaseNotifications?: boolean;
  enableVisitorNotifications?: boolean;
  enableSalesCountNotifications?: boolean;
  enableLowStockAlerts?: boolean;
  enableTrendingNotifications?: boolean;
  enableCartActivityNotifications?: boolean;
  enableRecentlyViewedNotifications?: boolean;

  // Configuration options
  purchaseLookbackHours?: number;
  lowStockThreshold?: number;
  maxNotificationsPerSession?: number;

  // Additional fields that might be in contentConfig
  [key: string]: unknown;
}
