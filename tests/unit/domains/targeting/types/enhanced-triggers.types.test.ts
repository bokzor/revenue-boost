/**
 * Unit Tests for Enhanced Triggers Types
 *
 * Tests the re-exported targeting types from campaign types.
 */

import { describe, it, expect } from "vitest";

import type {
  EnhancedTriggersConfig,
  EnhancedTriggerConfig,
  AudienceTargetingConfig,
  PageTargetingConfig,
  TargetRulesConfig,
  TriggerType,
  TriggerRule,
  EnhancedTrigger,
} from "~/domains/targeting/types/enhanced-triggers.types";

describe("Enhanced Triggers Types", () => {
  describe("Type Exports", () => {
    it("should export EnhancedTriggersConfig type", () => {
      const config: EnhancedTriggersConfig = {
        enabled: true,
        triggers: [],
      };

      expect(config.enabled).toBe(true);
      expect(config.triggers).toEqual([]);
    });

    it("should export EnhancedTriggerConfig as alias", () => {
      // EnhancedTriggerConfig is an alias for EnhancedTriggersConfig
      const config: EnhancedTriggerConfig = {
        enabled: false,
        triggers: [],
      };

      expect(config.enabled).toBe(false);
    });

    it("should export AudienceTargetingConfig type", () => {
      const config: AudienceTargetingConfig = {
        enabled: true,
        segments: ["vip", "new-customers"],
      };

      expect(config.enabled).toBe(true);
      expect(config.segments).toHaveLength(2);
    });

    it("should export PageTargetingConfig type", () => {
      const config: PageTargetingConfig = {
        enabled: true,
        includePatterns: ["/products/*"],
        excludePatterns: ["/cart"],
      };

      expect(config.enabled).toBe(true);
      expect(config.includePatterns).toContain("/products/*");
    });

    it("should export TargetRulesConfig type", () => {
      const config: TargetRulesConfig = {
        audience: {
          enabled: true,
          segments: [],
        },
        pages: {
          enabled: false,
          includePatterns: [],
          excludePatterns: [],
        },
      };

      expect(config.audience.enabled).toBe(true);
      expect(config.pages.enabled).toBe(false);
    });

    it("should export TriggerType type", () => {
      const triggerType: TriggerType = "exit_intent";

      expect(triggerType).toBe("exit_intent");
    });

    it("should export TriggerRule type", () => {
      const rule: TriggerRule = {
        type: "delay",
        value: 5000,
      };

      expect(rule.type).toBe("delay");
      expect(rule.value).toBe(5000);
    });

    it("should export EnhancedTrigger type", () => {
      const trigger: EnhancedTrigger = {
        id: "trigger-1",
        type: "scroll_depth",
        enabled: true,
        config: {
          percentage: 50,
        },
      };

      expect(trigger.id).toBe("trigger-1");
      expect(trigger.type).toBe("scroll_depth");
      expect(trigger.enabled).toBe(true);
    });
  });
});

