/**
 * Revenue Boost Storefront Extension
 * Main entry point for the popup system
 */

import * as preact from "preact";
import * as hooks from "preact/hooks";
import { createPortal } from "preact/compat";
import { ApiClient } from "./core/api";
import { session } from "./core/session";
import { ComponentLoader } from "./core/component-loader";
import { renderPopup, type StorefrontCampaign } from "./core/PopupManagerPreact";
import { TriggerManager, type EnhancedTriggers, type SessionRulesConfig } from "./core/TriggerManager";
import { initCartTracking } from "./utils/cart-tracking";
import { challengeTokenStore } from "./core/challenge-token";

// Initialize hook registry (configures all pre-display hooks)
import "./core/hooks";

// Expose Preact globally for dynamic bundles
if (typeof window !== "undefined") {
  // preact and hooks imported at module scope

  type W = typeof window & {
    RevenueBoostPreact?: Record<string, unknown>;
    REVENUE_BOOST_CONFIG?: Partial<Config>;
    ShopifyAnalytics?: { meta?: { product?: { id?: string | number } } };
  };
  const w = window as unknown as W;

  w.RevenueBoostPreact = {
    h: preact.h,
    render: preact.render,
    Component: preact.Component,
    Fragment: preact.Fragment,
    options: preact.options,
    createPortal: createPortal,
    createContext: preact.createContext,
    hooks: {
      useState: hooks.useState,
      useEffect: hooks.useEffect,
      useCallback: hooks.useCallback,
      useRef: hooks.useRef,
      useMemo: hooks.useMemo,
      useContext: hooks.useContext,
      useDebugValue: hooks.useDebugValue,
    },
  } as Record<string, unknown>;

  // Expose session for lazy token loading in popups
  (w as any).__RB_SESSION = session;
  (w as any).__RB_SESSION_ID = session.getSessionId();

  // Expose challenge token store globally so popup bundles can share the same instance
  (w as any).__RB_CHALLENGE_TOKEN_STORE = challengeTokenStore;

  console.log("[Revenue Boost] ⚛️ Preact runtime exposed globally");
  console.log("[Revenue Boost] 🔐 Challenge token store exposed globally");
}

interface Config {
	  apiUrl: string;
	  shopDomain: string;
	  debug: boolean;
	  previewMode?: boolean;
	  previewToken?: string;
	  previewBehavior?: 'instant' | 'realistic';
	  sessionId?: string;
	  visitCount?: number;
	  isReturningVisitor?: boolean;
	  deviceType?: string;
	}

function getConfig(): Config {
  type W2 = typeof window & { REVENUE_BOOST_CONFIG?: Partial<Config> };
  const cfg = (window as unknown as W2).REVENUE_BOOST_CONFIG || {};
	  return {
	    apiUrl: cfg.apiUrl || "",
	    shopDomain: cfg.shopDomain || "",
	    debug: cfg.debug || false,
	    previewMode: cfg.previewMode || false,
	    previewToken: cfg.previewToken,
	    previewBehavior: cfg.previewBehavior || 'instant',
	    sessionId: cfg.sessionId,
	    visitCount: cfg.visitCount,
	    isReturningVisitor: cfg.isReturningVisitor,
	    deviceType: cfg.deviceType,
	  };
}

function waitForDOMReady(): Promise<void> {
  return new Promise((resolve) => {
    if (document.readyState === "complete" || document.readyState === "interactive") {
      resolve();
    } else {
      document.addEventListener("DOMContentLoaded", () => resolve());
    }
  });
}

type ClientCampaign = StorefrontCampaign & {
  priority?: number;
  clientTriggers?: {
    enhancedTriggers?: EnhancedTriggers;
    sessionRules?: SessionRulesConfig;
  };
  experimentId?: string | null;
  [key: string]: unknown;
};

type Surface = "modal" | "banner" | "notification";

class RevenueBoostApp {
  private config = getConfig();
  private api = new ApiClient(this.config);
  private loader = new ComponentLoader({
    debug: this.config.debug,
    baseUrl: this.config.apiUrl ? `${this.config.apiUrl}/bundles` : "/apps/revenue-boost/bundles",
    version: Date.now().toString(),
  });
  private initialized = false;
  private globalCustomCSS?: string;

  private log(...args: unknown[]) {
    if (this.config.debug) {
      console.log("[Revenue Boost]", ...args);
    }
  }

  async init(): Promise<void> {
    if (this.initialized) {
      this.log("Already initialized");
      return;
    }

    console.log("[Revenue Boost] 🚀 Starting initialization...");
    console.log("[Revenue Boost] 📋 Config:", this.config);
    console.log("[Revenue Boost] 🔑 Session ID:", session.getSessionId());
    console.log("[Revenue Boost] 👤 Visitor ID:", session.getVisitorId());

	    // Log preview mode details
	    if (this.config.previewMode) {
	      console.log("[Revenue Boost] 🎭 PREVIEW MODE ENABLED");
	      console.log("[Revenue Boost] Preview Token:", this.config.previewToken || "none");
	      console.log("[Revenue Boost] Preview Behavior:", this.config.previewBehavior);
	    }

    // Wait for DOM
    await waitForDOMReady();
    this.log("DOM ready");

    // Track page view for social proof
    this.trackPageView();

    // Initialize cart activity tracking
    initCartTracking(this.api, this.config.shopDomain);

    // Fetch campaigns
    try {
      console.log("[Revenue Boost] 📡 Fetching campaigns from API...");
      const response = await this.api.fetchActiveCampaigns(
        session.getSessionId(),
        session.getVisitorId()
      );
      const { campaigns, globalCustomCSS } = response;
      this.globalCustomCSS = globalCustomCSS || undefined;

      // NOTE: Do NOT set designConfig.previewMode here.
      // The previewMode flag is reserved for admin previews and changes
      // how popups render (e.g. inline vs modal). Storefront previews
      // should behave like real popups, so we keep designConfig
      // untouched aside from wiring globalCustomCSS/customCSS.
      const campaignList = (campaigns as ClientCampaign[]).map((c) => ({
        ...c,
        globalCustomCSS: globalCustomCSS || undefined,
        customCSS: (c.designConfig as Record<string, unknown> | undefined)?.customCSS as string | undefined,
      }));

      console.log(`[Revenue Boost] ✅ Campaigns received: ${campaignList?.length || 0}`);
      if (campaignList && campaignList.length > 0) {
        console.log("[Revenue Boost] Campaign details:", campaignList.map(c => ({
          id: c.id,
          name: c.name,
          templateType: c.templateType,
        })));
      }

      if (!campaignList || campaignList.length === 0) {
        console.warn("[Revenue Boost] ⚠️ No active campaigns returned from API");
        return;
      }

      // Preload popup components for faster display
      const templateTypes = campaignList.map(c => c.templateType).filter(Boolean);
      if (templateTypes.length > 0) {
        this.log("Preloading popup components:", templateTypes);
        this.loader.preloadComponents(templateTypes as any[]).catch(err => {
          this.log("Component preload failed (non-critical):", err);
        });
      }

      // Setup campaigns
      this.setupCampaigns(campaignList);
      this.initialized = true;

      console.log("[Revenue Boost] ✅ Initialization complete!");
    } catch (error) {
      console.error("[Revenue Boost] ❌ Error fetching campaigns:", error);
    }
  }

  /**
   * Track page view for social proof visitor counting
   */
  private async trackPageView(): Promise<void> {
    try {
      const productId = this.getProductIdFromPage();
      const pageUrl = window.location.pathname;

      await this.api.trackSocialProofEvent({
        eventType: productId ? 'product_view' : 'page_view',
        productId,
        pageUrl,
        shop: this.config.shopDomain,
      });

      this.log("Page view tracked for social proof");
    } catch (error) {
      // Silent fail - don't block initialization
      this.log("Failed to track page view:", error);
    }
  }

  /**
   * Extract product ID from current page (if on product page)
   */
  private getProductIdFromPage(): string | undefined {
    // Try to get product ID from Shopify global object
    type SA = typeof window & { ShopifyAnalytics?: { meta?: { product?: { id?: string | number } } } };
    const wx = window as unknown as SA;
    if (typeof wx.ShopifyAnalytics !== 'undefined') {
      const meta = wx.ShopifyAnalytics?.meta;
      if (meta?.product?.id) {
        return `gid://shopify/Product/${meta.product.id}`;
      }
    }

    // Fallback: check if we're on a product page
    if (window.location.pathname.includes('/products/')) {
      // Product ID will be tracked via meta tags or other means
      return undefined;
    }

    return undefined;
  }

  private setupCampaigns(campaigns: ClientCampaign[]): void {
    // Sort by priority (highest first)
    const sorted = campaigns.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    // Filter dismissed campaigns (except preview mode)
    // Server handles frequency capping via Redis
    const available = sorted.filter((campaign) => {
      // In preview mode we keep all campaigns returned by the API;
      // the preview handling below will ensure only the preview
      // campaign is actually shown.
      if (this.config.previewMode) return true;

      // Use experimentId for tracking if campaign is part of an experiment
      // This ensures all variants of the same experiment are tracked together
      const trackingKey = campaign.experimentId || campaign.id;

      // Only check if user dismissed this campaign (clicked close button)
      if (session.wasDismissed(trackingKey)) {
        this.log(`Campaign dismissed by user: ${campaign.id} (tracking key: ${trackingKey})`);
        return false;
      }
      return true;
    });

    if (available.length === 0) {
      console.warn("[Revenue Boost] ⚠️ No campaigns available after filtering");
      return;
    }

    console.log(`[Revenue Boost] 📋 ${available.length} campaign(s) available after filtering`);

    // Preview mode: show only the preview campaign if present
    if (this.config.previewMode && this.config.previewToken) {
      console.log("[Revenue Boost] 🎭 Preview mode: looking for preview campaign...");

      // For token-based previews, the API returns a single preview campaign
      const previewCampaign = available[0];

      if (previewCampaign) {
        console.log("[Revenue Boost] ✅ Preview campaign found:", {
          id: previewCampaign.id,
          name: previewCampaign.name,
          templateType: previewCampaign.templateType,
          behavior: this.config.previewBehavior,
        });
        setTimeout(() => {
          void this.showCampaign(previewCampaign);
        }, 0);
        return;
      } else {
        console.error("[Revenue Boost] ❌ Preview campaign not found!");
        console.log("[Revenue Boost] Looking for:", this.config.previewId || "first campaign");
        console.log("[Revenue Boost] Available campaigns:", available.map(c => c.id));
        return;
      }
    }

    // Group campaigns by surface so we can show, for example,
    // a popup + a banner + social proof at the same time.
    const bySurface: Record<Surface, ClientCampaign[]> = {
      modal: [],
      banner: [],
      notification: [],
    };

    for (const campaign of available) {
      const surface = this.getSurface(campaign);
      bySurface[surface].push(campaign);
    }

    const selected: ClientCampaign[] = [];

    (["modal", "banner", "notification"] as Surface[]).forEach((surface) => {
      const candidates = bySurface[surface];
      if (candidates.length > 0) {
        // candidates are already in priority order because `available`
        // was sorted before we grouped.
        selected.push(candidates[0]);
      }
    });

    if (selected.length === 0) {
      this.log("No campaigns selected after surface grouping");
      return;
    }

    this.log(
      "Selected campaigns by surface:",
      selected.map((c) => `${c.name} [${this.getSurface(c)}]`)
    );

    // Fire-and-forget trigger evaluation for each selected campaign
    for (const campaign of selected) {
      void this.showCampaign(campaign);
    }
  }

  private getSurface(campaign: ClientCampaign): Surface {
    const templateType = campaign.templateType;
    const design = (campaign.designConfig || {}) as { displayMode?: string };
    const displayMode = design.displayMode;

    // Social proof notifications are non-intrusive toasts
    if (templateType === "SOCIAL_PROOF") {
      return "notification";
    }

    // Free-shipping bars, countdown banners, announcements, or anything
    // explicitly marked as a banner go into the banner surface.
    if (
      templateType === "FREE_SHIPPING" ||
      templateType === "COUNTDOWN_TIMER" ||
      templateType === "ANNOUNCEMENT" ||
      displayMode === "banner"
    ) {
      return "banner";
    }

    // Default: modal-style popup
    return "modal";
  }

  private async showCampaign(campaign: ClientCampaign): Promise<void> {
    console.log("[Revenue Boost] 🎬 showCampaign called for:", {
      id: campaign.id,
      name: campaign.name,
      templateType: campaign.templateType,
    });

    const isPreview = this.config.previewMode && !!this.config.previewToken;

    console.log("[Revenue Boost] Preview check:", {
      isPreview,
      previewMode: this.config.previewMode,
      previewToken: this.config.previewToken,
      campaignId: campaign.id,
      behavior: this.config.previewBehavior,
    });

    // Instant preview mode: show immediately without trigger evaluation
    if (isPreview && this.config.previewBehavior === 'instant') {
      console.log("[Revenue Boost] ⚡ Instant preview: showing campaign immediately");
      await this.renderCampaign(campaign);
      return;
    }

    // Realistic preview mode OR normal mode: evaluate triggers
    const triggerManager = new TriggerManager();

    // Evaluate triggers
    if (isPreview && this.config.previewBehavior === 'realistic') {
      console.log("[Revenue Boost] 🎯 Realistic preview: evaluating triggers for campaign:", campaign.name);
    } else {
      console.log("[Revenue Boost] 🎯 Normal mode: evaluating triggers for campaign:", campaign.name);
    }

    try {
      console.log("[Revenue Boost] 🔍 Evaluating triggers...");
      const shouldShow = await triggerManager.evaluateTriggers(campaign);

      if (shouldShow) {
        console.log("[Revenue Boost] ✅ Triggers passed, showing campaign");
        await this.renderCampaign(campaign, triggerManager);
      } else {
        console.warn("[Revenue Boost] ⚠️ Triggers not met, campaign not shown");
        triggerManager.cleanup();
      }
    } catch (error) {
      console.error("[Revenue Boost] ❌ Error evaluating triggers:", error);
      // Fallback: show campaign anyway
      await this.renderCampaign(campaign, triggerManager);
    }
  }

  private async renderCampaign(
    campaign: ClientCampaign,
    triggerManager?: TriggerManager
  ): Promise<void> {
    console.log("[Revenue Boost] 🎨 renderCampaign called for:", campaign.name);
	    const isPreview = this.config.previewMode && !!this.config.previewToken;

    // Record frequency for server-side tracking (Redis + analytics)
    if (!isPreview) {
      // Use experimentId for tracking if campaign is part of an experiment
      // This ensures all variants of the same experiment are tracked together
      const trackingKey = campaign.experimentId || campaign.id;
      await this.api.recordFrequency({
        sessionId: session.getSessionId(),
        campaignId: campaign.id,
        experimentId: campaign.experimentId,
        trackingKey,
        pageUrl: typeof window !== "undefined" ? window.location.href : undefined,
        referrer: typeof document !== "undefined" ? document.referrer : undefined,
      });
    }

    // Get trigger context from trigger manager
    const triggerContext = triggerManager ? triggerManager.getTriggerContext() : undefined;

    // Render popup
    renderPopup(
      campaign,
      () => {
        this.log("Popup closed");

        // Mark as dismissed (user clicked close button)
        if (!isPreview) {
          const trackingKey = campaign.experimentId || campaign.id;
          session.markDismissed(trackingKey);

          void this.api
            .trackEvent({
              type: "CLOSE",
              campaignId: campaign.id,
              sessionId: session.getSessionId(),
              data: {
                experimentId: campaign.experimentId ?? undefined,
                pageUrl:
                  typeof window !== "undefined" ? window.location.href : undefined,
                referrer:
                  typeof document !== "undefined" ? document.referrer : undefined,
              },
            })
            .catch((error) => {
              if (this.config.debug) {
                console.error("[Revenue Boost] Failed to track CLOSE event:", error);
              }
            });
        }

        if (triggerManager) {
          triggerManager.cleanup();
        }
      },
      this.loader,
      this.api,
      (campaignId) => {
        this.log("Popup shown:", campaignId);
      },
      triggerContext // Pass trigger context to popup
    );
  }
}

// Auto-initialize
const app = new RevenueBoostApp();
app.init().catch((error) => {
  console.error("[Revenue Boost] Initialization failed:", error);
});

export { app };
