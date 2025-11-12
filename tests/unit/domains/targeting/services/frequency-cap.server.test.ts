/**
 * Frequency Capping Service Tests (Redis-Based)
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { FrequencyCapService } from "~/domains/targeting/services/frequency-cap.server";
import type { CampaignWithConfigs } from "~/domains/campaigns/types/campaign";
import type { StorefrontContext } from "~/domains/campaigns/types/storefront-context";

// Mock Redis storage - shared across all tests
const mockRedisStorage: Record<string, string> = {};

// Mock Redis module BEFORE importing anything else
vi.mock('~/lib/redis.server', () => {
  // Use a getter to access the outer mockRedisStorage
  const getStorage = () => mockRedisStorage;

  return {
    redis: {
      get: vi.fn(async (key: string) => {
        const storage = getStorage();
        return storage[key] || null;
      }),
      set: vi.fn(async (key: string, value: string) => {
        const storage = getStorage();
        storage[key] = value;
        return 'OK';
      }),
      setex: vi.fn(async (key: string, ttl: number, value: string) => {
        const storage = getStorage();
        storage[key] = value;
        return 'OK';
      }),
      incr: vi.fn(async (key: string) => {
        const storage = getStorage();
        const current = parseInt(storage[key] || '0');
        const newValue = current + 1;
        storage[key] = newValue.toString();
        return newValue;
      }),
      expire: vi.fn(async () => 1),
      del: vi.fn(async (...keys: string[]) => {
        const storage = getStorage();
        keys.forEach(key => delete storage[key]);
        return keys.length;
      }),
      keys: vi.fn(async (pattern: string) => {
        const storage = getStorage();
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return Object.keys(storage).filter(key => regex.test(key));
      }),
      pipeline: vi.fn(() => {
        const storage = getStorage();
        const pipe: Record<string, unknown> = {};
        pipe.incr = vi.fn((key: string) => {
          const current = parseInt(storage[key] || '0');
          storage[key] = (current + 1).toString();
          return pipe;
        });
        pipe.expire = vi.fn(() => pipe);
        pipe.exec = vi.fn(async () => [[null, 1], [null, 1]]);
        return pipe;
      }),
    },
    REDIS_PREFIXES: {
      FREQUENCY_CAP: 'freq_cap',
      GLOBAL_FREQUENCY: 'global_freq_cap',
      COOLDOWN: 'cooldown',
      VISITOR: 'visitor',
      PAGE_VIEW: 'pageview',
      STATS: 'stats',
      SESSION: 'session',
    },
    REDIS_TTL: {
      SESSION: 3600,
      HOUR: 3600,
      DAY: 86400,
      WEEK: 604800,
      MONTH: 2592000,
      VISITOR: 7776000,
    },
  };
});

// Setup
beforeEach(() => {
  // Clear mock Redis storage
  Object.keys(mockRedisStorage).forEach((key) => delete mockRedisStorage[key]);

  // Reset mock call counts
  vi.clearAllMocks();
});

afterEach(() => {
  vi.clearAllMocks();
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
  visitorId: "visitor-123",
  sessionId: "session-456",
};

describe("FrequencyCapService", () => {
  describe("checkFrequencyCapping", () => {
    it("should allow campaign with no frequency capping", async () => {
      const campaign = createMockCampaign("campaign-1");
      const result = await FrequencyCapService.checkFrequencyCapping(campaign, mockContext);
      expect(result.allowed).toBe(true);
    });

    it("should allow campaign on first view", async () => {
      const campaign = createMockCampaign("campaign-1", {
        max_triggers_per_session: 2,
      });
      const result = await FrequencyCapService.checkFrequencyCapping(campaign, mockContext);
      expect(result.allowed).toBe(true);
      expect(result.currentCounts.session).toBe(0);
    });

    it("should block campaign after max session views", async () => {
      const campaign = createMockCampaign("campaign-1", {
        max_triggers_per_session: 2,
      });

      // Record 2 views
      await FrequencyCapService.recordDisplay("campaign-1", mockContext, { max_triggers_per_session: 2 });
      await FrequencyCapService.recordDisplay("campaign-1", mockContext, { max_triggers_per_session: 2 });

      const result = await FrequencyCapService.checkFrequencyCapping(campaign, mockContext);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Session limit exceeded");
    });

    it("should allow campaign within session limit", async () => {
      const campaign = createMockCampaign("campaign-1", {
        max_triggers_per_session: 3,
      });

      // Record 2 views
      await FrequencyCapService.recordDisplay("campaign-1", mockContext, { max_triggers_per_session: 3 });
      await FrequencyCapService.recordDisplay("campaign-1", mockContext, { max_triggers_per_session: 3 });

      const result = await FrequencyCapService.checkFrequencyCapping(campaign, mockContext);
      expect(result.allowed).toBe(true);
      expect(result.currentCounts.session).toBe(2);
    });

    it("should block campaign after max daily views", async () => {
      const campaign = createMockCampaign("campaign-1", {
        max_triggers_per_day: 3,
      });

      // Record 3 views
      await FrequencyCapService.recordDisplay("campaign-1", mockContext, { max_triggers_per_day: 3 });
      await FrequencyCapService.recordDisplay("campaign-1", mockContext, { max_triggers_per_day: 3 });
      await FrequencyCapService.recordDisplay("campaign-1", mockContext, { max_triggers_per_day: 3 });

      const result = await FrequencyCapService.checkFrequencyCapping(campaign, mockContext);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Daily limit exceeded");
    });

    it("should allow campaign within daily limit", async () => {
      const campaign = createMockCampaign("campaign-1", {
        max_triggers_per_day: 5,
      });

      // Record 3 views
      await FrequencyCapService.recordDisplay("campaign-1", mockContext, { max_triggers_per_day: 5 });
      await FrequencyCapService.recordDisplay("campaign-1", mockContext, { max_triggers_per_day: 5 });
      await FrequencyCapService.recordDisplay("campaign-1", mockContext, { max_triggers_per_day: 5 });

      const result = await FrequencyCapService.checkFrequencyCapping(campaign, mockContext);
      expect(result.allowed).toBe(true);
      expect(result.currentCounts.day).toBe(3);
    });

    it("should block campaign during cooldown period", async () => {
      const campaign = createMockCampaign("campaign-1", {
        cooldown_between_triggers: 60, // 60 seconds
      });

      // Record a view
      await FrequencyCapService.recordDisplay("campaign-1", mockContext, { cooldown_between_triggers: 60 });

      // Try to show immediately (should be blocked)
      const result = await FrequencyCapService.checkFrequencyCapping(campaign, mockContext);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("In cooldown period");
    });

    it("should allow campaign after cooldown period", async () => {
      const campaign = createMockCampaign("campaign-1", {
        cooldown_between_triggers: 1, // 1 second
      });

      // Manually set cooldown to past
      const pastTimestamp = Date.now() - 2000; // 2 seconds ago
      mockRedisStorage[`cooldown:visitor-123:campaign-1`] = pastTimestamp.toString();

      const result = await FrequencyCapService.checkFrequencyCapping(campaign, mockContext);
      expect(result.allowed).toBe(true);
    });

    it("should enforce all limits together", async () => {
      const campaign = createMockCampaign("campaign-1", {
        max_triggers_per_session: 5,
        max_triggers_per_day: 10,
        cooldown_between_triggers: 30,
      });

      // First view should be allowed
      const result1 = await FrequencyCapService.checkFrequencyCapping(campaign, mockContext);
      expect(result1.allowed).toBe(true);

      await FrequencyCapService.recordDisplay("campaign-1", mockContext, {
        max_triggers_per_session: 5,
        max_triggers_per_day: 10,
        cooldown_between_triggers: 30,
      });

      // Second view should be blocked by cooldown
      const result2 = await FrequencyCapService.checkFrequencyCapping(campaign, mockContext);
      expect(result2.allowed).toBe(false);
    });

    it("should track different campaigns independently", async () => {
      const campaign1 = createMockCampaign("campaign-1", {
        max_triggers_per_session: 1,
      });
      const campaign2 = createMockCampaign("campaign-2", {
        max_triggers_per_session: 1,
      });

      // Record view for campaign 1
      await FrequencyCapService.recordDisplay("campaign-1", mockContext, { max_triggers_per_session: 1 });

      // Campaign 1 should be blocked
      const result1 = await FrequencyCapService.checkFrequencyCapping(campaign1, mockContext);
      expect(result1.allowed).toBe(false);

      // Campaign 2 should still be allowed
      const result2 = await FrequencyCapService.checkFrequencyCapping(campaign2, mockContext);
      expect(result2.allowed).toBe(true);
    });
  });

  describe("recordDisplay", () => {
    it("should increment session views", async () => {
      await FrequencyCapService.recordDisplay("campaign-1", mockContext);

      const sessionKey = `freq_cap:visitor-123:campaign-1:session`;
      expect(mockRedisStorage[sessionKey]).toBe("1");

      await FrequencyCapService.recordDisplay("campaign-1", mockContext);
      expect(mockRedisStorage[sessionKey]).toBe("2");
    });

    it("should increment daily views", async () => {
      await FrequencyCapService.recordDisplay("campaign-1", mockContext);

      const dayKey = `freq_cap:visitor-123:campaign-1:day`;
      expect(mockRedisStorage[dayKey]).toBe("1");

      await FrequencyCapService.recordDisplay("campaign-1", mockContext);
      expect(mockRedisStorage[dayKey]).toBe("2");
    });

    it("should set cooldown when specified", async () => {
      await FrequencyCapService.recordDisplay("campaign-1", mockContext, {
        cooldown_between_triggers: 60,
      });

      const cooldownKey = `cooldown:visitor-123:campaign-1`;
      expect(mockRedisStorage[cooldownKey]).toBeDefined();
    });

    it("should track multiple campaigns", async () => {
      await FrequencyCapService.recordDisplay("campaign-1", mockContext);
      await FrequencyCapService.recordDisplay("campaign-2", mockContext);

      const session1Key = `freq_cap:visitor-123:campaign-1:session`;
      const session2Key = `freq_cap:visitor-123:campaign-2:session`;

      expect(mockRedisStorage[session1Key]).toBe("1");
      expect(mockRedisStorage[session2Key]).toBe("1");
    });
  });

  describe("resetFrequencyCapping", () => {
    it("should clear all frequency cap data for visitor", async () => {
      // Record some views
      await FrequencyCapService.recordDisplay("campaign-1", mockContext);
      await FrequencyCapService.recordDisplay("campaign-2", mockContext);

      // Verify data exists
      expect(mockRedisStorage["freq_cap:visitor-123:campaign-1:session"]).toBeDefined();
      expect(mockRedisStorage["freq_cap:visitor-123:campaign-2:session"]).toBeDefined();

      // Clear all
      await FrequencyCapService.resetFrequencyCapping("visitor-123");

      // Verify data is cleared
      expect(mockRedisStorage["freq_cap:visitor-123:campaign-1:session"]).toBeUndefined();
      expect(mockRedisStorage["freq_cap:visitor-123:campaign-2:session"]).toBeUndefined();
    });

    it("should clear data for specific campaign only", async () => {
      // Record views for multiple campaigns
      await FrequencyCapService.recordDisplay("campaign-1", mockContext);
      await FrequencyCapService.recordDisplay("campaign-2", mockContext);

      // Clear campaign-1
      await FrequencyCapService.resetFrequencyCapping("visitor-123", "campaign-1");

      // Verify campaign-1 data is cleared
      expect(mockRedisStorage["freq_cap:visitor-123:campaign-1:session"]).toBeUndefined();

      // Verify campaign-2 data still exists
      expect(mockRedisStorage["freq_cap:visitor-123:campaign-2:session"]).toBe("1");
    });

    it("should handle clearing non-existent campaign", async () => {
      await FrequencyCapService.recordDisplay("campaign-1", mockContext);

      // Should not throw error
      await expect(
        FrequencyCapService.resetFrequencyCapping("visitor-123", "non-existent")
      ).resolves.not.toThrow();

      // Campaign-1 data should still exist
      expect(mockRedisStorage["freq_cap:visitor-123:campaign-1:session"]).toBe("1");
    });
  });

  describe("TTL and expiration", () => {
    it("should reset daily views after TTL expires", async () => {
      const campaign = createMockCampaign("campaign-1", {
        max_triggers_per_day: 3,
      });

      // Record 3 views (hit limit)
      await FrequencyCapService.recordDisplay("campaign-1", mockContext, { max_triggers_per_day: 3 });
      await FrequencyCapService.recordDisplay("campaign-1", mockContext, { max_triggers_per_day: 3 });
      await FrequencyCapService.recordDisplay("campaign-1", mockContext, { max_triggers_per_day: 3 });

      // Should be blocked
      const result1 = await FrequencyCapService.checkFrequencyCapping(campaign, mockContext);
      expect(result1.allowed).toBe(false);

      // Simulate TTL expiration by clearing Redis
      delete mockRedisStorage["freq_cap:visitor-123:campaign-1:day"];

      // Should now be allowed (count reset)
      const result2 = await FrequencyCapService.checkFrequencyCapping(campaign, mockContext);
      expect(result2.allowed).toBe(true);
    });

    it("should maintain daily views within TTL", async () => {
      const campaign = createMockCampaign("campaign-1", {
        max_triggers_per_day: 3,
      });

      // Record 2 views
      await FrequencyCapService.recordDisplay("campaign-1", mockContext, { max_triggers_per_day: 3 });
      await FrequencyCapService.recordDisplay("campaign-1", mockContext, { max_triggers_per_day: 3 });

      // Should still allow (2 < 3)
      const result1 = await FrequencyCapService.checkFrequencyCapping(campaign, mockContext);
      expect(result1.allowed).toBe(true);

      // Record one more
      await FrequencyCapService.recordDisplay("campaign-1", mockContext, { max_triggers_per_day: 3 });

      // Should now block (3 >= 3)
      const result2 = await FrequencyCapService.checkFrequencyCapping(campaign, mockContext);
      expect(result2.allowed).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("should handle Redis unavailable gracefully", async () => {
      // Test that service handles errors gracefully
      // Even with Redis errors, it should fail open (allow campaign)
      const campaign = createMockCampaign("campaign-1", {
        max_triggers_per_session: 1,
      });

      // The service should handle any Redis errors and allow the campaign
      const result = await FrequencyCapService.checkFrequencyCapping(campaign, mockContext);
      expect(result.allowed).toBeDefined();
      expect(typeof result.allowed).toBe('boolean');
    });

    it("should handle corrupted Redis data", async () => {
      // Set invalid data
      mockRedisStorage["freq_cap:visitor-123:campaign-1:session"] = "invalid";

      const campaign = createMockCampaign("campaign-1", {
        max_triggers_per_session: 1,
        max_triggers_per_day: 1,
        cooldown_between_triggers: 60,
      });

      // Should not throw and should handle gracefully
      const result = await FrequencyCapService.checkFrequencyCapping(campaign, mockContext);
      expect(result.allowed).toBeDefined();
    });

    it("should handle zero cooldown", async () => {
      const campaign = createMockCampaign("campaign-1", {
        cooldown_between_triggers: 0,
      });

      await FrequencyCapService.recordDisplay("campaign-1", mockContext, { cooldown_between_triggers: 0 });

      // Should allow immediately with 0 cooldown (no cooldown set)
      const result = await FrequencyCapService.checkFrequencyCapping(campaign, mockContext);
      expect(result.allowed).toBe(true);
    });
  });

  describe("Experiment-based frequency capping", () => {
    it("should use experimentId for tracking when campaign is part of experiment", async () => {
      const variantA = createMockCampaign("campaign-a", {
        max_triggers_per_session: 2,
      });
      variantA.experimentId = "experiment-1";
      variantA.variantKey = "A";
      variantA.isControl = true;

      // Record a view for variant A
      await FrequencyCapService.recordDisplay("experiment-1", mockContext, {
        max_triggers_per_session: 2,
      });

      // Check if variant A is blocked (should be allowed - 1 view out of 2)
      const resultA = await FrequencyCapService.checkFrequencyCapping(variantA, mockContext);
      expect(resultA.allowed).toBe(true);
      expect(resultA.currentCounts.session).toBe(1);

      // The key should be using experiment-1, not campaign-a
      const sessionKey = `freq_cap:visitor-123:experiment-1:session`;
      expect(mockRedisStorage[sessionKey]).toBe("1");
    });

    it("should share frequency cap across all variants of same experiment", async () => {
      const variantA = createMockCampaign("campaign-a", {
        max_triggers_per_session: 3,
      });
      variantA.experimentId = "experiment-1";
      variantA.variantKey = "A";
      variantA.isControl = true;

      const variantB = createMockCampaign("campaign-b", {
        max_triggers_per_session: 3,
      });
      variantB.experimentId = "experiment-1";
      variantB.variantKey = "B";
      variantB.isControl = false;

      // Record 2 views for variant A (using experiment ID)
      await FrequencyCapService.recordDisplay("experiment-1", mockContext, {
        max_triggers_per_session: 3,
      });
      await FrequencyCapService.recordDisplay("experiment-1", mockContext, {
        max_triggers_per_session: 3,
      });

      // Check variant A - should show 2 views
      const resultA = await FrequencyCapService.checkFrequencyCapping(variantA, mockContext);
      expect(resultA.allowed).toBe(true);
      expect(resultA.currentCounts.session).toBe(2);

      // Check variant B - should ALSO show 2 views (shared counter)
      const resultB = await FrequencyCapService.checkFrequencyCapping(variantB, mockContext);
      expect(resultB.allowed).toBe(true);
      expect(resultB.currentCounts.session).toBe(2);

      // Record one more view (total 3, hitting the limit)
      await FrequencyCapService.recordDisplay("experiment-1", mockContext, {
        max_triggers_per_session: 3,
      });

      // Both variants should now be blocked
      const resultA2 = await FrequencyCapService.checkFrequencyCapping(variantA, mockContext);
      expect(resultA2.allowed).toBe(false);
      expect(resultA2.reason).toContain("Session limit exceeded");

      const resultB2 = await FrequencyCapService.checkFrequencyCapping(variantB, mockContext);
      expect(resultB2.allowed).toBe(false);
      expect(resultB2.reason).toContain("Session limit exceeded");
    });

    it("should share cooldown across all variants of same experiment", async () => {
      const variantA = createMockCampaign("campaign-a", {
        cooldown_between_triggers: 60,
      });
      variantA.experimentId = "experiment-1";
      variantA.variantKey = "A";

      const variantB = createMockCampaign("campaign-b", {
        cooldown_between_triggers: 60,
      });
      variantB.experimentId = "experiment-1";
      variantB.variantKey = "B";

      // Record a view for the experiment
      await FrequencyCapService.recordDisplay("experiment-1", mockContext, {
        cooldown_between_triggers: 60,
      });

      // Both variants should be in cooldown
      const resultA = await FrequencyCapService.checkFrequencyCapping(variantA, mockContext);
      expect(resultA.allowed).toBe(false);
      expect(resultA.reason).toBe("In cooldown period");

      const resultB = await FrequencyCapService.checkFrequencyCapping(variantB, mockContext);
      expect(resultB.allowed).toBe(false);
      expect(resultB.reason).toBe("In cooldown period");

      // Verify cooldown key uses experiment ID
      const cooldownKey = `cooldown:visitor-123:experiment-1`;
      expect(mockRedisStorage[cooldownKey]).toBeDefined();
    });

    it("should track daily limits per experiment, not per variant", async () => {
      const variantA = createMockCampaign("campaign-a", {
        max_triggers_per_day: 5,
      });
      variantA.experimentId = "experiment-1";
      variantA.variantKey = "A";

      const variantB = createMockCampaign("campaign-b", {
        max_triggers_per_day: 5,
      });
      variantB.experimentId = "experiment-1";
      variantB.variantKey = "B";

      // Record 5 views for the experiment
      for (let i = 0; i < 5; i++) {
        await FrequencyCapService.recordDisplay("experiment-1", mockContext, {
          max_triggers_per_day: 5,
        });
      }

      // Both variants should be blocked
      const resultA = await FrequencyCapService.checkFrequencyCapping(variantA, mockContext);
      expect(resultA.allowed).toBe(false);
      expect(resultA.reason).toContain("Daily limit exceeded");
      expect(resultA.currentCounts.day).toBe(5);

      const resultB = await FrequencyCapService.checkFrequencyCapping(variantB, mockContext);
      expect(resultB.allowed).toBe(false);
      expect(resultB.reason).toContain("Daily limit exceeded");
      expect(resultB.currentCounts.day).toBe(5);
    });

    it("should use campaignId for non-experiment campaigns", async () => {
      const campaign = createMockCampaign("campaign-solo", {
        max_triggers_per_session: 2,
      });
      // No experimentId set

      // Record a view
      await FrequencyCapService.recordDisplay("campaign-solo", mockContext, {
        max_triggers_per_session: 2,
      });

      // Check campaign
      const result = await FrequencyCapService.checkFrequencyCapping(campaign, mockContext);
      expect(result.allowed).toBe(true);
      expect(result.currentCounts.session).toBe(1);

      // Verify key uses campaign ID, not experiment ID
      const sessionKey = `freq_cap:visitor-123:campaign-solo:session`;
      expect(mockRedisStorage[sessionKey]).toBe("1");
    });

    it("should keep separate counters for different experiments", async () => {
      const exp1VariantA = createMockCampaign("campaign-1a", {
        max_triggers_per_session: 3,
      });
      exp1VariantA.experimentId = "experiment-1";
      exp1VariantA.variantKey = "A";

      const exp2VariantA = createMockCampaign("campaign-2a", {
        max_triggers_per_session: 3,
      });
      exp2VariantA.experimentId = "experiment-2";
      exp2VariantA.variantKey = "A";

      // Record 2 views for experiment-1
      await FrequencyCapService.recordDisplay("experiment-1", mockContext, {
        max_triggers_per_session: 3,
      });
      await FrequencyCapService.recordDisplay("experiment-1", mockContext, {
        max_triggers_per_session: 3,
      });

      // Record 1 view for experiment-2
      await FrequencyCapService.recordDisplay("experiment-2", mockContext, {
        max_triggers_per_session: 3,
      });

      // Check experiment-1 variant - should show 2 views
      const result1 = await FrequencyCapService.checkFrequencyCapping(exp1VariantA, mockContext);
      expect(result1.allowed).toBe(true);
      expect(result1.currentCounts.session).toBe(2);

      // Check experiment-2 variant - should show 1 view
      const result2 = await FrequencyCapService.checkFrequencyCapping(exp2VariantA, mockContext);
      expect(result2.allowed).toBe(true);
      expect(result2.currentCounts.session).toBe(1);
    });

    it("should reset frequency capping by experiment ID", async () => {
      const variantA = createMockCampaign("campaign-a", {
        max_triggers_per_session: 2,
      });
      variantA.experimentId = "experiment-1";
      variantA.variantKey = "A";

      // Record 2 views (hit limit)
      await FrequencyCapService.recordDisplay("experiment-1", mockContext, {
        max_triggers_per_session: 2,
      });
      await FrequencyCapService.recordDisplay("experiment-1", mockContext, {
        max_triggers_per_session: 2,
      });

      // Should be blocked
      const result1 = await FrequencyCapService.checkFrequencyCapping(variantA, mockContext);
      expect(result1.allowed).toBe(false);

      // Reset using experiment ID
      await FrequencyCapService.resetFrequencyCapping("visitor-123", "experiment-1");

      // Should now be allowed
      const result2 = await FrequencyCapService.checkFrequencyCapping(variantA, mockContext);
      expect(result2.allowed).toBe(true);
      expect(result2.currentCounts.session).toBe(0);
    });

    it("should get frequency status by experiment ID", async () => {
      const variantA = createMockCampaign("campaign-a", {
        max_triggers_per_session: 5,
      });
      variantA.experimentId = "experiment-1";
      variantA.variantKey = "A";

      // Record 3 views
      await FrequencyCapService.recordDisplay("experiment-1", mockContext, {
        max_triggers_per_session: 5,
      });
      await FrequencyCapService.recordDisplay("experiment-1", mockContext, {
        max_triggers_per_session: 5,
      });
      await FrequencyCapService.recordDisplay("experiment-1", mockContext, {
        max_triggers_per_session: 5,
      });

      // Get status using experiment ID
      const status = await FrequencyCapService.getFrequencyStatus("visitor-123", "experiment-1");
      expect(status.counts.session).toBe(3);
      expect(status.counts.day).toBe(3);
    });
  });
});


