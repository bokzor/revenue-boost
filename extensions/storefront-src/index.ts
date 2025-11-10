/**
 * Revenue Boost Storefront Extension
 * Main entry point for the popup system
 */

import { h } from "preact";
import { ApiClient } from "./core/api";
import { session } from "./core/session";
import { ComponentLoader } from "./core/component-loader";
import { renderPopup } from "./core/PopupManagerPreact";
import { TriggerManager } from "./core/TriggerManager";

// Expose Preact globally for dynamic bundles
if (typeof window !== "undefined") {
  const preact = require("preact");
  const hooks = require("preact/hooks");

  (window as any).RevenueBoostPreact = {
    h: preact.h,
    render: preact.render,
    Component: preact.Component,
    Fragment: preact.Fragment,
    hooks: {
      useState: hooks.useState,
      useEffect: hooks.useEffect,
      useCallback: hooks.useCallback,
      useRef: hooks.useRef,
      useMemo: hooks.useMemo,
    },
  };

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
  const cfg = (window as any).REVENUE_BOOST_CONFIG || {};
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

class RevenueBoostApp {
  private config = getConfig();
  private api = new ApiClient(this.config);
  private loader = new ComponentLoader({
    debug: this.config.debug,
    baseUrl: this.config.apiUrl ? `${this.config.apiUrl}/bundles` : "/apps/revenue-boost/bundles",
    version: "1",
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

    // Wait for DOM
    await waitForDOMReady();
    this.log("DOM ready");

    // Fetch campaigns
    try {
      const response = await this.api.fetchActiveCampaigns(session.getSessionId());
      const { campaigns } = response;

      this.log(`Campaigns received: ${campaigns?.length || 0}`);

      if (!campaigns || campaigns.length === 0) {
        this.log("No active campaigns");
        return;
      }

      // Setup campaigns
      this.setupCampaigns(campaigns);
      this.initialized = true;

      console.log("[Revenue Boost] ✅ Initialization complete!");
    } catch (error) {
      console.error("[Revenue Boost] ❌ Error fetching campaigns:", error);
    }
  }

  private setupCampaigns(campaigns: any[]): void {
    // Sort by priority
    const sorted = campaigns.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    // Filter already shown (except preview mode)
    const available = sorted.filter((campaign) => {
      const isPreview = this.config.previewMode && this.config.previewId === campaign.id;
      if (isPreview) return true;
      if (session.wasShown(campaign.id)) {
        this.log(`Campaign already shown: ${campaign.id}`);
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

  private async showCampaign(campaign: any): Promise<void> {
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

  private async renderCampaign(campaign: any): Promise<void> {
    const isPreview = this.config.previewMode && this.config.previewId === campaign.id;

    // Mark as shown
    if (!isPreview) {
      session.markShown(campaign.id);
      await this.api.recordFrequency(session.getSessionId(), campaign.id);
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

