/**
 * API Client for storefront
 */

export interface ApiConfig {
  apiUrl: string;
  shopDomain: string;
  debug?: boolean;
  previewMode?: boolean;
  previewId?: string;
  previewToken?: string;
  previewBehavior?: "instant" | "realistic";
}

export interface FetchCampaignsResponse {
  campaigns: unknown[];
  success: boolean;
  globalCustomCSS?: string;
  timestamp?: string;
  /** Whether to show "Powered by Revenue Boost" branding (true for free tier) */
  showBranding?: boolean;
}

type IssueDiscountResponse = {
  code?: string;
  type?: string;
  behavior?: string;
  error?: string;
};

type EmailRecoveryResponse = {
  discountCode?: string;
  behavior?: string;
  message?: string;
  error?: string;
};

const SESSION_START_KEY = "revenue_boost_session_start_time";
const PAGE_VIEWS_KEY = "revenue_boost_page_views";
const PRODUCT_VIEWS_KEY = "revenue_boost_product_view_count";
const ADDED_TO_CART_SESSION_KEY = "revenue_boost_added_to_cart";

export class ApiClient {
  private config: ApiConfig;

  constructor(config: ApiConfig) {
    this.config = config;
  }

  private isPreviewMode(): boolean {
    return !!(this.config.previewMode && this.config.previewToken);
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

  async fetchActiveCampaigns(
    sessionId: string,
    visitorId?: string
  ): Promise<FetchCampaignsResponse> {
    // Ensure we have an up-to-date cart snapshot before building context
    await this.ensureCartSnapshot();

    // Build storefront context
    const context = this.buildStorefrontContext(sessionId, visitorId);

    // Build URL with context params
    const params = new URLSearchParams({
      shop: this.config.shopDomain,
      ...context,
    });

    // Include previewId or previewToken when present so the server can return the requested campaign
    if (this.config.previewId) {
      params.set("previewId", this.config.previewId);
    } else if (this.config.previewToken) {
      params.set("previewToken", this.config.previewToken);
    }

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
    const pageType = this.detectPageType();

    const context: Record<string, string> = {
      sessionId,
      pageUrl: window.location.pathname,
      pageType,
      deviceType: this.detectDeviceType(),
    };

    // Enrich with product and collection context from REVENUE_BOOST_CONFIG when available
    try {
      type W = typeof window & {
        REVENUE_BOOST_CONFIG?: {
          productId?: string;
          productHandle?: string;
          productType?: string;
          productVendor?: string;
          productTags?: string[];
          collectionId?: string;
          collectionHandle?: string;
        };
      };
      const w = window as unknown as W;
      const cfg = w.REVENUE_BOOST_CONFIG || {};

      if (cfg.productId) context.productId = String(cfg.productId);
      if (cfg.productHandle) context.productHandle = String(cfg.productHandle);
      if (cfg.productType) context.productType = String(cfg.productType);
      if (cfg.productVendor) context.productVendor = String(cfg.productVendor);
      if (Array.isArray(cfg.productTags) && cfg.productTags.length > 0) {
        context.productTags = cfg.productTags.join(",");
      }

      if (cfg.collectionId) context.collectionId = String(cfg.collectionId);
      if (cfg.collectionHandle) context.collectionHandle = String(cfg.collectionHandle);
    } catch {
      // Ignore errors reading REVENUE_BOOST_CONFIG
    }

    // Add visitor ID if available
    if (visitorId) {
      context.visitorId = visitorId;
    }

    // Add visit and engagement metrics
    try {
      const ls = window.localStorage;
      const ss = window.sessionStorage;
      const now = Date.now();

      // Visit count and returning visitor flag
      const visitCountRaw = ls.getItem("revenue_boost_visit_count");
      const visitCount = parseInt(visitCountRaw || "1", 10);
      if (!Number.isNaN(visitCount)) {
        context.visitCount = String(visitCount);
        context.isReturningVisitor = String(visitCount > 1);
      }

      // Time on site (seconds since first session start in this tab)
      let startTime = parseInt(ss.getItem(SESSION_START_KEY) || "", 10);
      if (!startTime || Number.isNaN(startTime)) {
        startTime = now;
        ss.setItem(SESSION_START_KEY, String(startTime));
      }
      const timeOnSiteSeconds = Math.floor((now - startTime) / 1000);
      if (timeOnSiteSeconds > 0) {
        context.timeOnSite = String(timeOnSiteSeconds);
      }

      // Page views in this session
      let pageViews = parseInt(ss.getItem(PAGE_VIEWS_KEY) || "0", 10);
      pageViews += 1;
      ss.setItem(PAGE_VIEWS_KEY, String(pageViews));
      context.pageViews = String(pageViews);

      // Mirror page type for segment rules
      if (pageType) {
        context.currentPageType = pageType;
      }

      // Product view count in this session
      let productViewCount = parseInt(ss.getItem(PRODUCT_VIEWS_KEY) || "0", 10);
      if (pageType === "product") {
        productViewCount += 1;
        ss.setItem(PRODUCT_VIEWS_KEY, String(productViewCount));
      }
      if (productViewCount > 0) {
        context.productViewCount = String(productViewCount);
      }

      // Whether user added to cart in this session
      const addedToCartFlag = ss.getItem(ADDED_TO_CART_SESSION_KEY);
      if (addedToCartFlag === "true") {
        context.addedToCartInSession = "true";
      }
    } catch {
      // Ignore storage errors (e.g. disabled cookies)
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

  /**
   * Ensure Shopify.cart snapshot is populated so cart-based rules work
   * even on themes/pages that do not expose window.Shopify.cart.
   */
  private async ensureCartSnapshot(): Promise<void> {
    try {
      type ShopifyGlobal = { Shopify?: { cart?: { total_price: number; item_count: number } } };
      const w = window as unknown as ShopifyGlobal;

      // If cart info is already available, do not fetch again
      if (w.Shopify && w.Shopify.cart && typeof w.Shopify.cart.item_count === "number") {
        return;
      }

      const response = await fetch("/cart.js", { credentials: "same-origin" });
      if (!response.ok) {
        return;
      }

      const cart = (await response.json()) as { total_price?: number; item_count?: number };
      if (!cart || typeof cart.item_count !== "number") {
        return;
      }

      if (!w.Shopify) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        w.Shopify = {} as any;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (w.Shopify as any).cart = {
        total_price: typeof cart.total_price === "number" ? cart.total_price : 0,
        item_count: cart.item_count,
      };
    } catch {
      // Fail silently - cart-based rules will simply not match if cart snapshot is unavailable
    }
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
    /** GDPR: The exact consent text the user agreed to */
    consentText?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    metadata?: Record<string, unknown>;
    /** Timestamp when popup was shown (for bot detection) */
    popupShownAt?: number;
    /** Honeypot field - should always be empty */
    honeypot?: string;
  }): Promise<{
    success: boolean;
    leadId?: string;
    discountCode?: string | null;
    freeGift?: {
      variantId: string;
      productId: string;
      quantity: number;
    };
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
        freeGift: result.freeGift,
      };
    } catch (error) {
      console.error("[Revenue Boost API] Failed to submit lead:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to submit lead",
      };
    }
  }

  async issueDiscount(data: {
    campaignId: string;
    cartSubtotalCents?: number;
    sessionId: string;
    visitorId?: string;
    /** Timestamp when popup was shown (for bot detection) */
    popupShownAt?: number;
    /** Honeypot field - should always be empty */
    honeypot?: string;
    // Product Upsell: selected product IDs for bundle discount scoping
    selectedProductIds?: string[];
    // Product Upsell: bundle discount from contentConfig (auto-sync mode)
    bundleDiscountPercent?: number;
  }): Promise<{
    success: boolean;
    code?: string;
    type?: string;
    behavior?: string;
    error?: string;
  }> {
    const params = new URLSearchParams({
      shop: this.config.shopDomain,
    });

    const url = `${this.getApiUrl("/api/discounts/issue")}?${params.toString()}`;

    this.log("Issuing discount with data:", {
      campaignId: data.campaignId,
      cartSubtotalCents: data.cartSubtotalCents,
      sessionId: data.sessionId,
    });

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        this.log("Discount issue failed:", result);
        const parsed = result as IssueDiscountResponse;
        throw new Error(parsed.error || `HTTP ${response.status}`);
      }

      this.log("Discount issued successfully:", result);

      return {
        success: true,
        code: (result as IssueDiscountResponse).code,
        type: (result as IssueDiscountResponse).type,
        behavior: (result as IssueDiscountResponse).behavior,
      };
    } catch (error) {
      console.error("[Revenue Boost API] Failed to issue discount:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to issue discount",
      };
    }
  }

  async emailRecovery(data: {
    campaignId: string;
    email: string;
    cartSubtotalCents?: number;
    cartItems?: Array<Record<string, unknown>>;
  }): Promise<{
    success: boolean;
    discountCode?: string;
    behavior?: string;
    message?: string;
    error?: string;
  }> {
    const params = new URLSearchParams({
      shop: this.config.shopDomain,
    });

    const url = `${this.getApiUrl("/api/cart/email-recovery")}?${params.toString()}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json().catch(() => ({}) as EmailRecoveryResponse);

      if (!response.ok) {
        const parsed = result as EmailRecoveryResponse;
        throw new Error(parsed.error || `HTTP ${response.status}`);
      }

      this.log("Cart email recovery success:", result);

      return {
        success: true,
        discountCode: (result as EmailRecoveryResponse).discountCode,
        behavior: (result as EmailRecoveryResponse).behavior,
        message: (result as EmailRecoveryResponse).message,
      };
    } catch (error) {
      console.error("[Revenue Boost API] Failed to perform email recovery:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to perform email recovery",
      };
    }
  }

  async recordFrequency(input: {
    sessionId: string;
    visitorId: string;
    campaignId: string;
    trackingKey: string;
    experimentId?: string | null;
    pageUrl?: string;
    referrer?: string;
  }): Promise<void> {
    // Skip analytics writes entirely when running in storefront preview mode.
    // Preview sessions should not contribute to frequency caps or analytics.
    if (this.isPreviewMode()) {
      this.log("Skipping frequency tracking in preview mode", {
        campaignId: input.campaignId,
        trackingKey: input.trackingKey,
      });
      return;
    }
    const params = new URLSearchParams({
      shop: this.config.shopDomain,
    });

    const url = `${this.getApiUrl("/api/analytics/frequency")}?${params.toString()}`;

    const body = JSON.stringify({
      sessionId: input.sessionId,
      visitorId: input.visitorId, // Include visitorId for consistent impression tracking
      campaignId: input.campaignId,
      trackingKey: input.trackingKey,
      experimentId: input.experimentId,
      pageUrl: input.pageUrl,
      referrer: input.referrer,
      timestamp: Date.now(),
    });

    // Attempt with one retry for reliability
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body,
        });

        if (response.ok) {
          return; // Success
        }

        // Server error - retry on first attempt
        if (attempt === 1 && response.status >= 500) {
          console.warn("[Revenue Boost API] Frequency tracking failed, retrying...");
          continue;
        }

        // Client error or second failure - log and continue
        console.error("[Revenue Boost API] Failed to record frequency:", response.status);
        return;
      } catch (error) {
        if (attempt === 1) {
          console.warn("[Revenue Boost API] Frequency tracking error, retrying:", error);
          continue;
        }
        console.error("[Revenue Boost API] Failed to record frequency after retry:", error);
      }
    }
  }

  async trackEvent(event: {
    type: string;
    campaignId: string;
    sessionId: string;
    data?: Record<string, unknown>;
  }): Promise<void> {
    // Do not track popup events from storefront preview sessions.
    if (this.isPreviewMode()) {
      this.log("Skipping popup event tracking in preview mode", {
        type: event.type,
        campaignId: event.campaignId,
      });
      return;
    }
    const params = new URLSearchParams({
      shop: this.config.shopDomain,
    });

    const url = `${this.getApiUrl("/api/analytics/track")}?${params.toString()}`;

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
    eventType: "page_view" | "product_view" | "add_to_cart";
    productId?: string;
    pageUrl?: string;
    shop: string;
  }): Promise<void> {
    // Avoid polluting social proof metrics when previewing popups from the admin.
    if (this.isPreviewMode()) {
      this.log("Skipping social proof tracking in preview mode", {
        eventType: event.eventType,
        productId: event.productId,
      });
      return;
    }
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
