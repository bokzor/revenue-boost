/**
 * Frequency Capping Service Tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { FrequencyCapService } from "~/domains/targeting/services/frequency-cap.server";
import type { CampaignWithConfigs } from "~/domains/campaigns/types/campaign";
import type { StorefrontContext } from "~/domains/campaigns/types/storefront-context";

// Mock storage
const mockSessionStorage: Record<string, string> = {};
const mockLocalStorage: Record<string, string> = {};

// Setup storage mocks
beforeEach(() => {
  // Clear mocks
  Object.keys(mockSessionStorage).forEach((key) => delete mockSessionStorage[key]);
  Object.keys(mockLocalStorage).forEach((key) => delete mockLocalStorage[key]);

  // Mock sessionStorage
  global.sessionStorage = {
    getItem: vi.fn((key: string) => mockSessionStorage[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      mockSessionStorage[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete mockSessionStorage[key];
    }),
    clear: vi.fn(() => {
      Object.keys(mockSessionStorage).forEach((key) => delete mockSessionStorage[key]);
    }),
    length: 0,
    key: vi.fn(() => null),
  } as Storage;

  // Mock localStorage
  global.localStorage = {
    getItem: vi.fn((key: string) => mockLocalStorage[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      mockLocalStorage[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete mockLocalStorage[key];
    }),
    clear: vi.fn(() => {
      Object.keys(mockLocalStorage).forEach((key) => delete mockLocalStorage[key]);
    }),
    length: 0,
    key: vi.fn(() => null),
  } as Storage;

  // Clear all frequency cap data
  FrequencyCapService.clearAll();
});

// Helper to create mock campaign
function createMockCampaign(
  id: string,
  frequencyCapping?: {
    max_triggers_per_session?: number;
    max_triggers_per_day?: number;
    cooldown_between_triggers?: number;
  }
): CampaignWithConfigs {
  return {
    id,
    storeId: "store-1",
    name: "Test Campaign",
    description: null,
    goal: "INCREASE_REVENUE",
    status: "ACTIVE",
    priority: 0,
    templateId: null,
    templateType: "NEWSLETTER",
    experimentId: null,
    variantKey: null,
    isControl: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    targetRules: frequencyCapping
      ? {
          enhancedTriggers: {
            frequency_capping: frequencyCapping,
          },
        }
      : null,
  } as CampaignWithConfigs;
}

const mockContext: StorefrontContext = {
  pageUrl: "/",
  deviceType: "desktop",
};

describe("FrequencyCapService", () => {
  describe("shouldShowCampaign", () => {
    it("should allow campaign with no frequency capping", () => {
      const campaign = createMockCampaign("campaign-1");
      const result = FrequencyCapService.shouldShowCampaign(campaign, mockContext);
      expect(result).toBe(true);
    });

    it("should allow campaign on first view", () => {
      const campaign = createMockCampaign("campaign-1", {
        max_triggers_per_session: 2,
      });
      const result = FrequencyCapService.shouldShowCampaign(campaign, mockContext);
      expect(result).toBe(true);
    });

    it("should block campaign after max session views", () => {
      const campaign = createMockCampaign("campaign-1", {
        max_triggers_per_session: 2,
      });

      // Record 2 views
      FrequencyCapService.recordView("campaign-1");
      FrequencyCapService.recordView("campaign-1");

      const result = FrequencyCapService.shouldShowCampaign(campaign, mockContext);
      expect(result).toBe(false);
    });

    it("should allow campaign within session limit", () => {
      const campaign = createMockCampaign("campaign-1", {
        max_triggers_per_session: 3,
      });

      // Record 2 views
      FrequencyCapService.recordView("campaign-1");
      FrequencyCapService.recordView("campaign-1");

      const result = FrequencyCapService.shouldShowCampaign(campaign, mockContext);
      expect(result).toBe(true);
    });

    it("should block campaign after max daily views", () => {
      const campaign = createMockCampaign("campaign-1", {
        max_triggers_per_day: 3,
      });

      // Record 3 views
      FrequencyCapService.recordView("campaign-1");
      FrequencyCapService.recordView("campaign-1");
      FrequencyCapService.recordView("campaign-1");

      const result = FrequencyCapService.shouldShowCampaign(campaign, mockContext);
      expect(result).toBe(false);
    });

    it("should allow campaign within daily limit", () => {
      const campaign = createMockCampaign("campaign-1", {
        max_triggers_per_day: 5,
      });

      // Record 3 views
      FrequencyCapService.recordView("campaign-1");
      FrequencyCapService.recordView("campaign-1");
      FrequencyCapService.recordView("campaign-1");

      const result = FrequencyCapService.shouldShowCampaign(campaign, mockContext);
      expect(result).toBe(true);
    });

    it("should block campaign during cooldown period", () => {
      const campaign = createMockCampaign("campaign-1", {
        cooldown_between_triggers: 60, // 60 seconds
      });

      // Record a view
      FrequencyCapService.recordView("campaign-1");

      // Try to show immediately (should be blocked)
      const result = FrequencyCapService.shouldShowCampaign(campaign, mockContext);
      expect(result).toBe(false);
    });

    it("should allow campaign after cooldown period", () => {
      const campaign = createMockCampaign("campaign-1", {
        cooldown_between_triggers: 1, // 1 second
      });

      // Record a view with a timestamp in the past
      const pastTimestamp = Date.now() - 2000; // 2 seconds ago

      // Manually set last shown to past
      mockLocalStorage["rb_last_shown"] = JSON.stringify({
        "campaign-1": pastTimestamp,
      });

      const result = FrequencyCapService.shouldShowCampaign(campaign, mockContext);
      expect(result).toBe(true);
    });

    it("should enforce all limits together", () => {
      const campaign = createMockCampaign("campaign-1", {
        max_triggers_per_session: 5,
        max_triggers_per_day: 10,
        cooldown_between_triggers: 30,
      });

      // First view should be allowed
      expect(FrequencyCapService.shouldShowCampaign(campaign, mockContext)).toBe(true);

      FrequencyCapService.recordView("campaign-1");

      // Second view should be blocked by cooldown
      expect(FrequencyCapService.shouldShowCampaign(campaign, mockContext)).toBe(false);
    });

    it("should track different campaigns independently", () => {
      const campaign1 = createMockCampaign("campaign-1", {
        max_triggers_per_session: 1,
      });
      const campaign2 = createMockCampaign("campaign-2", {
        max_triggers_per_session: 1,
      });

      // Record view for campaign 1
      FrequencyCapService.recordView("campaign-1");

      // Campaign 1 should be blocked
      expect(FrequencyCapService.shouldShowCampaign(campaign1, mockContext)).toBe(false);

      // Campaign 2 should still be allowed
      expect(FrequencyCapService.shouldShowCampaign(campaign2, mockContext)).toBe(true);
    });
  });

  describe("recordView", () => {
    it("should increment session views", () => {
      FrequencyCapService.recordView("campaign-1");

      const data = JSON.parse(mockSessionStorage["rb_session_views"] || "{}");
      expect(data["campaign-1"]).toBe(1);

      FrequencyCapService.recordView("campaign-1");
      const data2 = JSON.parse(mockSessionStorage["rb_session_views"] || "{}");
      expect(data2["campaign-1"]).toBe(2);
    });

    it("should increment daily views", () => {
      FrequencyCapService.recordView("campaign-1");

      const data = JSON.parse(mockLocalStorage["rb_daily_views"] || "{}");
      expect(data["campaign-1"].count).toBe(1);

      FrequencyCapService.recordView("campaign-1");
      const data2 = JSON.parse(mockLocalStorage["rb_daily_views"] || "{}");
      expect(data2["campaign-1"].count).toBe(2);
    });

    it("should update last shown timestamp", () => {
      const beforeTime = Date.now();
      FrequencyCapService.recordView("campaign-1");
      const afterTime = Date.now();

      const data = JSON.parse(mockLocalStorage["rb_last_shown"] || "{}");
      const timestamp = data["campaign-1"];

      expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(timestamp).toBeLessThanOrEqual(afterTime);
    });

    it("should track multiple campaigns", () => {
      FrequencyCapService.recordView("campaign-1");
      FrequencyCapService.recordView("campaign-2");

      const sessionData = JSON.parse(mockSessionStorage["rb_session_views"] || "{}");
      expect(sessionData["campaign-1"]).toBe(1);
      expect(sessionData["campaign-2"]).toBe(1);
    });
  });

  describe("clearAll", () => {
    it("should clear all frequency cap data", () => {
      // Record some views
      FrequencyCapService.recordView("campaign-1");
      FrequencyCapService.recordView("campaign-2");

      // Verify data exists
      expect(mockSessionStorage["rb_session_views"]).toBeDefined();
      expect(mockLocalStorage["rb_daily_views"]).toBeDefined();
      expect(mockLocalStorage["rb_last_shown"]).toBeDefined();

      // Clear all
      FrequencyCapService.clearAll();

      // Verify data is cleared
      expect(mockSessionStorage["rb_session_views"]).toBeUndefined();
      expect(mockLocalStorage["rb_daily_views"]).toBeUndefined();
      expect(mockLocalStorage["rb_last_shown"]).toBeUndefined();
    });
  });

  describe("clearCampaign", () => {
    it("should clear data for specific campaign only", () => {
      // Record views for multiple campaigns
      FrequencyCapService.recordView("campaign-1");
      FrequencyCapService.recordView("campaign-2");

      // Clear campaign-1
      FrequencyCapService.clearCampaign("campaign-1");

      // Verify campaign-1 data is cleared
      const sessionData = JSON.parse(mockSessionStorage["rb_session_views"] || "{}");
      expect(sessionData["campaign-1"]).toBeUndefined();

      const dailyData = JSON.parse(mockLocalStorage["rb_daily_views"] || "{}");
      expect(dailyData["campaign-1"]).toBeUndefined();

      const lastShownData = JSON.parse(mockLocalStorage["rb_last_shown"] || "{}");
      expect(lastShownData["campaign-1"]).toBeUndefined();

      // Verify campaign-2 data still exists
      expect(sessionData["campaign-2"]).toBe(1);
      expect(dailyData["campaign-2"]).toBeDefined();
      expect(lastShownData["campaign-2"]).toBeDefined();
    });

    it("should handle clearing non-existent campaign", () => {
      FrequencyCapService.recordView("campaign-1");

      // Should not throw error
      expect(() => {
        FrequencyCapService.clearCampaign("non-existent");
      }).not.toThrow();

      // Campaign-1 data should still exist
      const sessionData = JSON.parse(mockSessionStorage["rb_session_views"] || "{}");
      expect(sessionData["campaign-1"]).toBe(1);
    });
  });

  describe("daily view reset", () => {
    it("should reset daily views on new day", () => {
      // Record a view
      FrequencyCapService.recordView("campaign-1");

      // Manually set the date to yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toISOString().split("T")[0];

      mockLocalStorage["rb_daily_views"] = JSON.stringify({
        "campaign-1": { date: yesterdayString, count: 5 },
      });

      const campaign = createMockCampaign("campaign-1", {
        max_triggers_per_day: 3,
      });

      // Should allow campaign since it's a new day (count resets to 0)
      const result = FrequencyCapService.shouldShowCampaign(campaign, mockContext);
      expect(result).toBe(true);
    });

    it("should maintain daily views on same day", () => {
      const campaign = createMockCampaign("campaign-1", {
        max_triggers_per_day: 3,
      });

      // Record 2 views
      FrequencyCapService.recordView("campaign-1");
      FrequencyCapService.recordView("campaign-1");

      // Should still allow (2 < 3)
      expect(FrequencyCapService.shouldShowCampaign(campaign, mockContext)).toBe(true);

      // Record one more
      FrequencyCapService.recordView("campaign-1");

      // Should now block (3 >= 3)
      expect(FrequencyCapService.shouldShowCampaign(campaign, mockContext)).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("should handle storage unavailable gracefully", () => {
      // Temporarily remove storage
      const originalSessionStorage = global.sessionStorage;
      const originalLocalStorage = global.localStorage;

      // @ts-expect-error - Testing edge case
      global.sessionStorage = undefined;
      // @ts-expect-error - Testing edge case
      global.localStorage = undefined;

      const campaign = createMockCampaign("campaign-1", {
        max_triggers_per_session: 1,
      });

      // Should not throw and should allow campaign
      expect(() => {
        FrequencyCapService.recordView("campaign-1");
      }).not.toThrow();

      expect(FrequencyCapService.shouldShowCampaign(campaign, mockContext)).toBe(true);

      // Restore storage
      global.sessionStorage = originalSessionStorage;
      global.localStorage = originalLocalStorage;
    });

    it("should handle corrupted storage data", () => {
      // Set invalid JSON
      mockSessionStorage["rb_session_views"] = "invalid json{";
      mockLocalStorage["rb_daily_views"] = "invalid json{";
      mockLocalStorage["rb_last_shown"] = "invalid json{";

      const campaign = createMockCampaign("campaign-1", {
        max_triggers_per_session: 1,
        max_triggers_per_day: 1,
        cooldown_between_triggers: 60,
      });

      // Should not throw and should allow campaign (treats as no data)
      expect(() => {
        const result = FrequencyCapService.shouldShowCampaign(campaign, mockContext);
        expect(result).toBe(true);
      }).not.toThrow();
    });

    it("should handle zero cooldown", () => {
      const campaign = createMockCampaign("campaign-1", {
        cooldown_between_triggers: 0,
      });

      FrequencyCapService.recordView("campaign-1");

      // Should allow immediately with 0 cooldown
      const result = FrequencyCapService.shouldShowCampaign(campaign, mockContext);
      expect(result).toBe(true);
    });
  });
});


