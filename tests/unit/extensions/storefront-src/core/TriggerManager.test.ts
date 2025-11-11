/**
 * TriggerManager Tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { TriggerManager } from "../../../../../extensions/storefront-src/core/TriggerManager";

describe("TriggerManager", () => {
  let manager: TriggerManager;

  beforeEach(() => {
    manager = new TriggerManager();
  });

  describe("evaluateTriggers", () => {
    it("should return true if no triggers are defined", async () => {
      const campaign = {
        id: "test-campaign",
        clientTriggers: {},
      };

      const result = await manager.evaluateTriggers(campaign);

      expect(result).toBe(true);
    });

    it("should return true if enhancedTriggers is empty", async () => {
      const campaign = {
        id: "test-campaign",
        clientTriggers: {
          enhancedTriggers: {},
        },
      };

      const result = await manager.evaluateTriggers(campaign);

      expect(result).toBe(true);
    });

    it("should evaluate page_load trigger", async () => {
      const campaign = {
        id: "test-campaign",
        clientTriggers: {
          enhancedTriggers: {
            page_load: {
              enabled: true,
              delay: 0, // Immediate
            },
          },
        },
      };

      const result = await manager.evaluateTriggers(campaign);

      expect(result).toBe(true);
    });

    it("should wait for page_load delay", async () => {
      const campaign = {
        id: "test-campaign",
        clientTriggers: {
          enhancedTriggers: {
            page_load: {
              enabled: true,
              delay: 100, // 100ms delay
            },
          },
        },
      };

      const startTime = Date.now();
      const result = await manager.evaluateTriggers(campaign);
      const elapsed = Date.now() - startTime;

      expect(result).toBe(true);
      expect(elapsed).toBeGreaterThanOrEqual(90); // Allow some margin
    });

    it("should return false if page_load is disabled", async () => {
      const campaign = {
        id: "test-campaign",
        clientTriggers: {
          enhancedTriggers: {
            page_load: {
              enabled: false,
              delay: 0,
            },
          },
        },
      };

      const result = await manager.evaluateTriggers(campaign);

      expect(result).toBe(false);
    });
  });

  describe("cleanup", () => {
    it("should cleanup all triggers", () => {
      const campaign = {
        id: "test-campaign",
        clientTriggers: {
          enhancedTriggers: {
            page_load: {
              enabled: true,
              delay: 1000,
            },
          },
        },
      };

      // Start evaluation (don't await)
      manager.evaluateTriggers(campaign);

      // Cleanup should cancel pending timers
      expect(() => manager.cleanup()).not.toThrow();
    });
  });

  describe("multiple triggers with AND logic", () => {
    it("should require all triggers to pass with AND logic", async () => {
      const campaign = {
        id: "test-campaign",
        clientTriggers: {
          enhancedTriggers: {
            page_load: {
              enabled: true,
              delay: 0,
            },
            scroll_depth: {
              enabled: true,
              depth_percentage: 50,
            },
            logic_operator: "AND" as const,
          },
        },
      };

      // Mock scroll depth as not met
      vi.spyOn(manager as unknown as { checkScrollDepth: () => Promise<boolean> }, "checkScrollDepth").mockResolvedValue(false);

      const result = await manager.evaluateTriggers(campaign);

      // Should fail because scroll_depth is not met
      expect(result).toBe(false);
    });
  });

  describe("multiple triggers with OR logic", () => {
    it("should pass if any trigger passes with OR logic", async () => {
      const campaign = {
        id: "test-campaign",
        clientTriggers: {
          enhancedTriggers: {
            page_load: {
              enabled: true,
              delay: 0,
            },
            scroll_depth: {
              enabled: true,
              depth_percentage: 50,
            },
            logic_operator: "OR" as const,
          },
        },
      };

      // Mock scroll depth as not met
      vi.spyOn(manager as unknown as { checkScrollDepth: () => Promise<boolean> }, "checkScrollDepth").mockResolvedValue(false);

      const result = await manager.evaluateTriggers(campaign);

      // Should pass because page_load is met
      expect(result).toBe(true);
    });
  });
});

