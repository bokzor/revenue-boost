/**
 * API Client for storefront
 */

export interface ApiConfig {
  apiUrl: string;
  shopDomain: string;
  debug?: boolean;
}

export interface FetchCampaignsResponse {
  campaigns: any[];
  success: boolean;
}

export class ApiClient {
  private config: ApiConfig;

  constructor(config: ApiConfig) {
    this.config = config;
  }

  private log(...args: unknown[]) {
    if (this.config.debug) {
      console.log("[Revenue Boost API]", ...args);
    }
  }

  private getApiUrl(path: string): string {
    const base = this.config.apiUrl || "";
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    
    if (base) {
      return `${base}${cleanPath}`;
    }
    
    // Use app proxy (same domain)
    return `/apps/revenue-boost${cleanPath}`;
  }

  async fetchActiveCampaigns(sessionId: string): Promise<FetchCampaignsResponse> {
    // Build storefront context
    const context = this.buildStorefrontContext(sessionId);

    // Build URL with context params
    const params = new URLSearchParams({
      shop: this.config.shopDomain,
      ...context,
    });

    const url = `${this.getApiUrl("/api/campaigns/active")}?${params.toString()}`;

    this.log("Fetching campaigns from:", url);
    this.log("Context:", context);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      this.log("Campaigns received:", data);

      return data;
    } catch (error) {
      console.error("[Revenue Boost API] Failed to fetch campaigns:", error);
      throw error;
    }
  }

  private buildStorefrontContext(sessionId: string): Record<string, string> {
    const context: Record<string, string> = {
      sessionId,
      pageUrl: window.location.pathname,
      pageType: this.detectPageType(),
      deviceType: this.detectDeviceType(),
    };

    // Add cart info if available
    if (typeof (window as any).Shopify !== "undefined") {
      const shopify = (window as any).Shopify;
      if (shopify.cart) {
        context.cartValue = String(shopify.cart.total_price / 100);
        context.cartItemCount = String(shopify.cart.item_count);
      }
    }

    return context;
  }

  private detectPageType(): string {
    const path = window.location.pathname;

    if (path === "/" || path === "") return "home";
    if (path.includes("/products/")) return "product";
    if (path.includes("/collections/")) return "collection";
    if (path.includes("/cart")) return "cart";
    if (path.includes("/checkout")) return "checkout";

    return "other";
  }

  private detectDeviceType(): string {
    const ua = navigator.userAgent.toLowerCase();

    if (/android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
      return "mobile";
    }
    if (/ipad|android(?!.*mobile)/i.test(ua)) {
      return "tablet";
    }
    return "desktop";
  }

  async recordFrequency(sessionId: string, campaignId: string): Promise<void> {
    const url = this.getApiUrl("/api/analytics/frequency");

    try {
      await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          campaignId,
          timestamp: Date.now(),
        }),
      });
    } catch (error) {
      console.error("[Revenue Boost API] Failed to record frequency:", error);
    }
  }

  async trackEvent(event: {
    type: string;
    campaignId: string;
    sessionId: string;
    data?: Record<string, unknown>;
  }): Promise<void> {
    const url = this.getApiUrl("/api/analytics/track");

    try {
      await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      });
    } catch (error) {
      console.error("[Revenue Boost API] Failed to track event:", error);
    }
  }
}

