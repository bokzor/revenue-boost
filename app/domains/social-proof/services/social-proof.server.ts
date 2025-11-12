/**
 * Social Proof Service
 * 
 * Generates real-time social proof notifications from:
 * - Shopify orders (recent purchases)
 * - Redis visitor tracking (live counts)
 * - Product analytics (sales stats, trending)
 * - Inventory data (low stock alerts)
 */

import type { SocialProofNotification } from "~/domains/storefront/notifications/social-proof/types";
import { ShopifyDataService } from "./shopify-data.server";
import { VisitorTrackingService } from "./visitor-tracking.server";
import { CampaignService } from "~/domains/campaigns/index.server";
import type { SocialProofContentConfig } from "../types/tracking";

export interface GetNotificationsParams {
  campaignId: string;
  storeId: string;
  productId?: string;
  pageUrl?: string;
}

export class SocialProofService {
  /**
   * Get all social proof notifications for a campaign
   *
   * Optimized to run all enabled notification fetchers in parallel
   */
  static async getNotifications(
    params: GetNotificationsParams
  ): Promise<SocialProofNotification[]> {
    const { campaignId, storeId, productId, pageUrl } = params;

    // Get campaign configuration
    const campaign = await CampaignService.getCampaignById(campaignId, storeId);
    if (!campaign) {
      return [];
    }

    const config = campaign.contentConfig as SocialProofContentConfig;

    // Build array of promises for all enabled notification types
    // Using Promise.allSettled to handle individual failures gracefully
    const notificationPromises: Promise<SocialProofNotification | SocialProofNotification[] | null>[] = [];

    // 1. Purchase Notifications (if enabled)
    if (config.enablePurchaseNotifications !== false) {
      notificationPromises.push(
        ShopifyDataService.getRecentPurchases({
          storeId,
          productId,
          limit: 5,
          hoursBack: config.purchaseLookbackHours || 48,
        })
      );
    }

    // 2. Visitor Count Notifications (if enabled)
    if (config.enableVisitorNotifications !== false) {
      notificationPromises.push(
        VisitorTrackingService.getVisitorNotification({
          storeId,
          productId,
          pageUrl,
        })
      );
    }

    // 3. Sales Count Notifications (24-hour window)
    if (config.enableSalesCountNotifications !== false) {
      notificationPromises.push(
        ShopifyDataService.getSalesCountNotification({
          storeId,
          productId,
          hoursBack: 24,
        })
      );
    }

    // 4. Low Stock Alerts (if enabled and productId present)
    if (config.enableLowStockAlerts !== false && productId) {
      notificationPromises.push(
        ShopifyDataService.getLowStockNotification({
          storeId,
          productId,
          threshold: config.lowStockThreshold || 10,
        })
      );
    }

    // 5. Trending Product Notifications (if enabled and productId present)
    if (config.enableTrendingNotifications !== false && productId) {
      notificationPromises.push(
        VisitorTrackingService.getTrendingNotification({
          storeId,
          productId,
        })
      );
    }

    // 6. Cart Activity Notifications (if enabled and productId present)
    if (config.enableCartActivityNotifications !== false && productId) {
      notificationPromises.push(
        VisitorTrackingService.getCartActivityNotification({
          storeId,
          productId,
        })
      );
    }

    // 7. Recently Viewed Notifications (if enabled and productId present)
    if (config.enableRecentlyViewedNotifications !== false && productId) {
      notificationPromises.push(
        VisitorTrackingService.getRecentlyViewedNotification({
          storeId,
          productId,
        })
      );
    }

    // Execute all promises in parallel
    const results = await Promise.allSettled(notificationPromises);

    // Collect successful results and flatten arrays
    const notifications: SocialProofNotification[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        // Handle both single notifications and arrays
        if (Array.isArray(result.value)) {
          notifications.push(...result.value);
        } else {
          notifications.push(result.value);
        }
      } else if (result.status === 'rejected') {
        // Log errors but don't fail the entire request
        console.error('[SocialProofService] Notification fetch failed:', result.reason);
      }
    }

    // Shuffle and limit notifications
    const shuffled = this.shuffleArray(notifications);
    const maxNotifications = config.maxNotificationsPerSession || 5;

    return shuffled.slice(0, maxNotifications);
  }

  /**
   * Fisher-Yates shuffle algorithm
   */
  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

