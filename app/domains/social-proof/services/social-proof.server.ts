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

export interface GetNotificationsParams {
  campaignId: string;
  storeId: string;
  productId?: string;
  pageUrl?: string;
}

export class SocialProofService {
  /**
   * Get all social proof notifications for a campaign
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

    const config = campaign.contentConfig as any;
    const notifications: SocialProofNotification[] = [];

    // 1. Purchase Notifications (if enabled)
    if (config.enablePurchaseNotifications !== false) {
      const purchases = await ShopifyDataService.getRecentPurchases({
        storeId,
        productId,
        limit: 5,
        hoursBack: config.purchaseLookbackHours || 48,
      });
      notifications.push(...purchases);
    }

    // 2. Visitor Count Notifications (if enabled)
    if (config.enableVisitorNotifications !== false) {
      const visitorNotif = await VisitorTrackingService.getVisitorNotification({
        storeId,
        productId,
        pageUrl,
      });
      if (visitorNotif) {
        notifications.push(visitorNotif);
      }
    }

    // 3. Sales Count Notifications (24-hour window)
    if (config.enableSalesCountNotifications !== false) {
      const salesCount = await ShopifyDataService.getSalesCountNotification({
        storeId,
        productId,
        hoursBack: 24,
      });
      if (salesCount) {
        notifications.push(salesCount);
      }
    }

    // 4. Low Stock Alerts (if enabled)
    if (config.enableLowStockAlerts !== false && productId) {
      const lowStock = await ShopifyDataService.getLowStockNotification({
        storeId,
        productId,
        threshold: config.lowStockThreshold || 10,
      });
      if (lowStock) {
        notifications.push(lowStock);
      }
    }

    // 5. Trending Product Notifications (if enabled)
    if (config.enableTrendingNotifications !== false && productId) {
      const trending = await VisitorTrackingService.getTrendingNotification({
        storeId,
        productId,
      });
      if (trending) {
        notifications.push(trending);
      }
    }

    // 6. Cart Activity Notifications (if enabled)
    if (config.enableCartActivityNotifications !== false && productId) {
      const cartActivity = await VisitorTrackingService.getCartActivityNotification({
        storeId,
        productId,
      });
      if (cartActivity) {
        notifications.push(cartActivity);
      }
    }

    // 7. Recently Viewed Notifications (if enabled)
    if (config.enableRecentlyViewedNotifications !== false && productId) {
      const recentlyViewed = await VisitorTrackingService.getRecentlyViewedNotification({
        storeId,
        productId,
      });
      if (recentlyViewed) {
        notifications.push(recentlyViewed);
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

