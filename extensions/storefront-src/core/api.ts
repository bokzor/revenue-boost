/**
 * API Client for storefront
 */

export interface ApiConfig {
  apiUrl: string;
  shopDomain: string;
  debug?: boolean;
}

export interface FetchCampaignsResponse {
  campaigns: unknown[];
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

  async fetchActiveCampaigns(sessionId: string, visitorId?: string): Promise<FetchCampaignsResponse> {
    // Build storefront context
    const context = this.buildStorefrontContext(sessionId, visitorId);

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
        credentials: "include", // Include cookies for visitor ID
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

  private buildStorefrontContext(sessionId: string, visitorId?: string): Record<string, string> {
    const context: Record<string, string> = {
      sessionId,
      pageUrl: window.location.pathname,
      pageType: this.detectPageType(),
      deviceType: this.detectDeviceType(),
    };

    // Add visitor ID if available
    if (visitorId) {
      context.visitorId = visitorId;
    }

    // Add cart info if available
    type ShopifyGlobal = { Shopify?: { cart?: { total_price: number; item_count: number } } };
    const w = window as unknown as ShopifyGlobal;
    if (typeof w.Shopify !== "undefined") {
      const shopify = w.Shopify!;
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

  async submitLead(data: {
    email: string;
    campaignId: string;
    sessionId: string;
    visitorId?: string;
    consent?: boolean;
    firstName?: string;
    lastName?: string;
    phone?: string;
    metadata?: Record<string, unknown>;
  }): Promise<{
    success: boolean;
    leadId?: string;
    discountCode?: string | null;
    error?: string;
  }> {
    const params = new URLSearchParams({
      shop: this.config.shopDomain,
    });

    const url = `${this.getApiUrl("/api/leads/submit")}?${params.toString()}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          pageUrl: window.location.href,
          referrer: document.referrer,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      this.log("Lead submitted successfully:", result);

      return {
        success: true,
        leadId: result.leadId,
        discountCode: result.discountCode,
      };
    } catch (error) {
      console.error("[Revenue Boost API] Failed to submit lead:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to submit lead",
      };
    }
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

  async trackSocialProofEvent(event: {
    eventType: 'page_view' | 'product_view' | 'add_to_cart';
    productId?: string;
    pageUrl?: string;
    shop: string;
  }): Promise<void> {
    const url = this.getApiUrl("/api/social-proof/track");

    try {
      await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      });
    } catch (error) {
      // Silent fail for social proof tracking
      if (this.config.debug) {
        console.error("[Revenue Boost API] Failed to track social proof event:", error);
      }
    }
  }
}

