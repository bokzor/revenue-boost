/**
 * SocialProofDataHook - Pre-loads social proof notifications
 *
 * Fetches notifications from the social proof API before the popup is displayed,
 * allowing immediate display of purchase, visitor, and review notifications.
 */

import type {
  PreDisplayHook,
  PreDisplayHookContext,
  PreDisplayHookResult,
} from "../PreDisplayHook";

/** Notification types from the social proof API */
export interface SocialProofNotification {
  type: "purchase" | "visitor" | "review" | "sales_count";
  id: string;
  timestamp: number;
  // Purchase notification
  productTitle?: string;
  productImage?: string;
  productHandle?: string;
  customerName?: string;
  customerLocation?: string;
  timeAgo?: string;
  // Visitor notification
  count?: number;
  message?: string;
  // Review notification
  rating?: number;
  reviewText?: string;
  reviewerName?: string;
  // Sales count notification
  salesCount?: number;
  period?: string;
}

interface SocialProofApiResponse {
  success: boolean;
  notifications: SocialProofNotification[];
  timestamp: string;
  error?: string;
}

export class SocialProofDataHook implements PreDisplayHook {
  readonly name = "socialProof";
  readonly runInPreview = false; // Skip in preview mode - no real data
  readonly timeoutMs = 5000; // 5 second timeout

  async execute(context: PreDisplayHookContext): Promise<PreDisplayHookResult> {
    const { campaign, api } = context;

    try {
      console.log(
        `[SocialProofDataHook] Fetching notifications for campaign: ${campaign.id}`
      );

      // Build URL with query params
      // Access private method via any - the API client doesn't expose this publicly
      const apiClient = api as unknown as {
        config: { shopDomain: string; apiUrl?: string };
      };
      const shopDomain = apiClient.config.shopDomain;

      // Get current page context
      const pageUrl = window.location.pathname;
      const productId = this.extractProductId();

      // Build API URL
      const params = new URLSearchParams({
        shop: shopDomain,
      });

      if (productId) {
        params.set("productId", productId);
      }
      if (pageUrl) {
        params.set("pageUrl", pageUrl);
      }

      // Use app proxy path
      const apiBase = apiClient.config.apiUrl || "/apps/revenue-boost";
      const url = `${apiBase}/api/social-proof/${campaign.id}?${params.toString()}`;

      const response = await fetch(url, {
        credentials: "same-origin",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Social proof fetch failed: ${response.status}`);
      }

      const data: SocialProofApiResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || "API returned unsuccessful response");
      }

      console.log(
        `[SocialProofDataHook] Fetched ${data.notifications.length} notifications`
      );

      return {
        success: true,
        data: {
          notifications: data.notifications,
          timestamp: data.timestamp,
        },
        hookName: this.name,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(
        `[SocialProofDataHook] Failed to fetch notifications:`,
        errorMessage
      );

      return {
        success: false,
        error: errorMessage,
        hookName: this.name,
        data: {
          notifications: [], // Return empty array so popup still renders
        },
      };
    }
  }

  /**
   * Extract product ID from the page if on a product page
   */
  private extractProductId(): string | undefined {
    // Try to get from Shopify's global product object
    const shopifyProduct = (
      window as unknown as { ShopifyAnalytics?: { meta?: { product?: { id: number } } } }
    ).ShopifyAnalytics?.meta?.product?.id;

    if (shopifyProduct) {
      return `gid://shopify/Product/${shopifyProduct}`;
    }

    // Try meta tag
    const productMeta = document.querySelector('meta[property="og:type"][content="product"]');
    if (productMeta) {
      const idMeta = document.querySelector('meta[property="product:id"]');
      if (idMeta) {
        const id = idMeta.getAttribute("content");
        if (id) {
          return `gid://shopify/Product/${id}`;
        }
      }
    }

    return undefined;
  }
}

