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
import { TriggerManager, type EnhancedTriggers } from "./core/TriggerManager";
import { initCartTracking } from "./utils/cart-tracking";

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
    hooks: {
      useState: hooks.useState,
      useEffect: hooks.useEffect,
      useCallback: hooks.useCallback,
      useRef: hooks.useRef,
      useMemo: hooks.useMemo,
    },
  } as Record<string, unknown>;


  console.log("[Revenue Boost] ⚛️ Preact runtime exposed globally");
}

interface Config {
  apiUrl: string;
  shopDomain: string;
  debug: boolean;
  previewMode?: boolean;
  previewId?: string;
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
    previewId: cfg.previewId,
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
  clientTriggers?: { enhancedTriggers?: EnhancedTriggers };
  experimentId?: string | null;
  [key: string]: unknown;
};

class RevenueBoostApp {
  private config = getConfig();
  private api = new ApiClient(this.config);
  private loader = new ComponentLoader({
    debug: this.config.debug,
    baseUrl: this.config.apiUrl ? `${this.config.apiUrl}/bundles` : "/apps/revenue-boost/bundles",
    version: Date.now().toString(),
  });
  private triggerManager = new TriggerManager();
  private initialized = false;
  private cleanupFn: (() => void) | null = null;

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

    // Wait for DOM
    await waitForDOMReady();
    this.log("DOM ready");

    // Track page view for social proof
    this.trackPageView();

    // Initialize cart activity tracking
    initCartTracking(this.api, this.config.shopDomain);

    // Fetch campaigns
    try {
      const response = await this.api.fetchActiveCampaigns(
        session.getSessionId(),
        session.getVisitorId()
      );
      const { campaigns } = response;
      const campaignList = campaigns as ClientCampaign[];

      this.log(`Campaigns received: ${campaignList?.length || 0}`);

      if (!campaignList || campaignList.length === 0) {
        this.log("No active campaigns");
        return;
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
    // Sort by priority
    const sorted = campaigns.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    // Filter already shown (except preview mode)
    const available = sorted.filter((campaign) => {
      const isPreview = this.config.previewMode && this.config.previewId === campaign.id;
      if (isPreview) return true;

      // Use experimentId for tracking if campaign is part of an experiment
      // This ensures all variants of the same experiment are tracked together
      const trackingKey = campaign.experimentId || campaign.id;
      if (session.wasShown(trackingKey)) {
        this.log(`Campaign already shown: ${campaign.id} (tracking key: ${trackingKey})`);
        return false;
      }
      return true;
    });

    if (available.length === 0) {
      this.log("No campaigns to display");
      return;
    }

    // Show highest priority campaign
    const campaign = available[0];
    this.log("Showing campaign:", campaign.name);

    // Preview mode: show immediately
    if (this.config.previewMode && this.config.previewId === campaign.id) {
      setTimeout(() => this.showCampaign(campaign), 0);
    } else {
      this.showCampaign(campaign);
    }
  }

  private async showCampaign(campaign: ClientCampaign): Promise<void> {
    const isPreview = this.config.previewMode && this.config.previewId === campaign.id;

    // Preview mode: show immediately without trigger evaluation
    if (isPreview) {
      this.renderCampaign(campaign);
      return;
    }

    // Evaluate triggers
    this.log("Evaluating triggers for campaign:", campaign.name);

    try {
      const shouldShow = await this.triggerManager.evaluateTriggers(campaign);

      if (shouldShow) {
        this.log("Triggers passed, showing campaign");
        this.renderCampaign(campaign);
      } else {
        this.log("Triggers not met, campaign not shown");
      }
    } catch (error) {
      console.error("[Revenue Boost] Error evaluating triggers:", error);
      // Fallback: show campaign anyway
      this.renderCampaign(campaign);
    }
  }

  private async renderCampaign(campaign: ClientCampaign): Promise<void> {
    const isPreview = this.config.previewMode && this.config.previewId === campaign.id;

    // Mark as shown
    if (!isPreview) {
      // Use experimentId for tracking if campaign is part of an experiment
      // This ensures all variants of the same experiment are tracked together
      const trackingKey = campaign.experimentId || campaign.id;
      session.markShown(trackingKey);
      await this.api.recordFrequency(session.getSessionId(), trackingKey);
    }

    // Render popup
    this.cleanupFn = renderPopup(
      campaign,
      () => {
        this.log("Popup closed");
        this.cleanupFn = null;
        this.triggerManager.cleanup();
      },
      this.loader,
      this.api,
      (campaignId) => {
        this.log("Popup shown:", campaignId);
      }
    );
  }
}

// Auto-initialize
const app = new RevenueBoostApp();
app.init().catch((error) => {
  console.error("[Revenue Boost] Initialization failed:", error);
});

export { app };

