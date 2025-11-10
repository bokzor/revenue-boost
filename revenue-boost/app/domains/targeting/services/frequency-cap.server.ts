/**
 * Frequency Capping Service
 *
 * Server-side service for tracking and enforcing frequency caps on campaign displays
 * Uses browser storage (sessionStorage/localStorage) for tracking
 */

import type { CampaignWithConfigs } from "~/domains/campaigns/types/campaign";
import type { StorefrontContext } from "~/domains/campaigns/types/storefront-context";

/**
 * Storage keys for frequency capping
 */
const STORAGE_KEYS = {
  SESSION_VIEWS: "rb_session_views",
  DAILY_VIEWS: "rb_daily_views",
  LAST_SHOWN: "rb_last_shown",
} as const;

/**
 * Frequency cap data structure
 */
export interface FrequencyCapData {
  sessionViews: Record<string, number>;
  dailyViews: Record<string, { date: string; count: number }>;
  lastShown: Record<string, number>;
}

/**
 * Frequency Capping Service
 * Tracks campaign views and enforces frequency limits
 */
export class FrequencyCapService {
  /**
   * Check if a campaign should be shown based on frequency capping rules
   */
  static shouldShowCampaign(
    campaign: CampaignWithConfigs,
    context: StorefrontContext
  ): boolean {
    const frequencyCapping = campaign.targetRules?.enhancedTriggers?.frequency_capping;

    // If no frequency capping configured, allow campaign
    if (!frequencyCapping) {
      return true;
    }

    const campaignId = campaign.id;
    const now = Date.now();

    // Check session limit
    if (frequencyCapping.max_triggers_per_session) {
      const sessionViews = this.getSessionViews(campaignId);
      if (sessionViews >= frequencyCapping.max_triggers_per_session) {
        return false;
      }
    }

    // Check daily limit
    if (frequencyCapping.max_triggers_per_day) {
      const dailyViews = this.getDailyViews(campaignId);
      if (dailyViews >= frequencyCapping.max_triggers_per_day) {
        return false;
      }
    }

    // Check cooldown period
    if (frequencyCapping.cooldown_between_triggers) {
      const lastShown = this.getLastShown(campaignId);
      if (lastShown) {
        const timeSinceLastShown = now - lastShown;
        const cooldownMs = frequencyCapping.cooldown_between_triggers * 1000; // Convert to ms
        if (timeSinceLastShown < cooldownMs) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Record that a campaign was shown
   */
  static recordView(campaignId: string): void {
    const now = Date.now();

    // Increment session views
    this.incrementSessionViews(campaignId);

    // Increment daily views
    this.incrementDailyViews(campaignId);

    // Update last shown timestamp
    this.updateLastShown(campaignId, now);
  }

  /**
   * Get session views for a campaign
   */
  private static getSessionViews(campaignId: string): number {
    if (typeof sessionStorage === "undefined") return 0;

    try {
      const data = sessionStorage.getItem(STORAGE_KEYS.SESSION_VIEWS);
      if (!data) return 0;

      const views: Record<string, number> = JSON.parse(data);
      return views[campaignId] || 0;
    } catch {
      return 0;
    }
  }

  /**
   * Increment session views for a campaign
   */
  private static incrementSessionViews(campaignId: string): void {
    if (typeof sessionStorage === "undefined") return;

    try {
      const data = sessionStorage.getItem(STORAGE_KEYS.SESSION_VIEWS);
      const views: Record<string, number> = data ? JSON.parse(data) : {};

      views[campaignId] = (views[campaignId] || 0) + 1;

      sessionStorage.setItem(STORAGE_KEYS.SESSION_VIEWS, JSON.stringify(views));
    } catch {
      // Silently fail if storage is unavailable
    }
  }

  /**
   * Get daily views for a campaign
   */
  private static getDailyViews(campaignId: string): number {
    if (typeof localStorage === "undefined") return 0;

    try {
      const data = localStorage.getItem(STORAGE_KEYS.DAILY_VIEWS);
      if (!data) return 0;

      const views: Record<string, { date: string; count: number }> = JSON.parse(data);
      const campaignData = views[campaignId];

      if (!campaignData) return 0;

      // Check if the stored date is today
      const today = this.getTodayString();
      if (campaignData.date !== today) {
        return 0; // Reset if it's a new day
      }

      return campaignData.count;
    } catch {
      return 0;
    }
  }

  /**
   * Increment daily views for a campaign
   */
  private static incrementDailyViews(campaignId: string): void {
    if (typeof localStorage === "undefined") return;

    try {
      const data = localStorage.getItem(STORAGE_KEYS.DAILY_VIEWS);
      const views: Record<string, { date: string; count: number }> = data ? JSON.parse(data) : {};

      const today = this.getTodayString();
      const campaignData = views[campaignId];

      if (!campaignData || campaignData.date !== today) {
        // New day or first view
        views[campaignId] = { date: today, count: 1 };
      } else {
        // Same day, increment count
        views[campaignId].count += 1;
      }

      localStorage.setItem(STORAGE_KEYS.DAILY_VIEWS, JSON.stringify(views));
    } catch {
      // Silently fail if storage is unavailable
    }
  }

  /**
   * Get last shown timestamp for a campaign
   */
  private static getLastShown(campaignId: string): number | null {
    if (typeof localStorage === "undefined") return null;

    try {
      const data = localStorage.getItem(STORAGE_KEYS.LAST_SHOWN);
      if (!data) return null;

      const timestamps: Record<string, number> = JSON.parse(data);
      return timestamps[campaignId] || null;
    } catch {
      return null;
    }
  }

  /**
   * Update last shown timestamp for a campaign
   */
  private static updateLastShown(campaignId: string, timestamp: number): void {
    if (typeof localStorage === "undefined") return;

    try {
      const data = localStorage.getItem(STORAGE_KEYS.LAST_SHOWN);
      const timestamps: Record<string, number> = data ? JSON.parse(data) : {};

      timestamps[campaignId] = timestamp;

      localStorage.setItem(STORAGE_KEYS.LAST_SHOWN, JSON.stringify(timestamps));
    } catch {
      // Silently fail if storage is unavailable
    }
  }

  /**
   * Get today's date as a string (YYYY-MM-DD)
   */
  private static getTodayString(): string {
    const now = new Date();
    return now.toISOString().split("T")[0];
  }

  /**
   * Clear all frequency cap data (useful for testing)
   */
  static clearAll(): void {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem(STORAGE_KEYS.SESSION_VIEWS);
    }
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(STORAGE_KEYS.DAILY_VIEWS);
      localStorage.removeItem(STORAGE_KEYS.LAST_SHOWN);
    }
  }

  /**
   * Clear frequency cap data for a specific campaign
   */
  static clearCampaign(campaignId: string): void {
    // Clear session views
    if (typeof sessionStorage !== "undefined") {
      try {
        const data = sessionStorage.getItem(STORAGE_KEYS.SESSION_VIEWS);
        if (data) {
          const views: Record<string, number> = JSON.parse(data);
          delete views[campaignId];
          sessionStorage.setItem(STORAGE_KEYS.SESSION_VIEWS, JSON.stringify(views));
        }
      } catch {
        // Silently fail
      }
    }

    // Clear daily views
    if (typeof localStorage !== "undefined") {
      try {
        const data = localStorage.getItem(STORAGE_KEYS.DAILY_VIEWS);
        if (data) {
          const views: Record<string, { date: string; count: number }> = JSON.parse(data);
          delete views[campaignId];
          localStorage.setItem(STORAGE_KEYS.DAILY_VIEWS, JSON.stringify(views));
        }
      } catch {
        // Silently fail
      }
    }

    // Clear last shown
    if (typeof localStorage !== "undefined") {
      try {
        const data = localStorage.getItem(STORAGE_KEYS.LAST_SHOWN);
        if (data) {
          const timestamps: Record<string, number> = JSON.parse(data);
          delete timestamps[campaignId];
          localStorage.setItem(STORAGE_KEYS.LAST_SHOWN, JSON.stringify(timestamps));
        }
      } catch {
        // Silently fail
      }
    }
  }
}


