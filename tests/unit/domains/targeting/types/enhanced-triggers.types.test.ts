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
        page_load: { enabled: true, delay: 1000 },
      };

      expect(config.enabled).toBe(true);
      expect(config.page_load?.enabled).toBe(true);
    });

    it("should export EnhancedTriggerConfig as alias", () => {
      // EnhancedTriggerConfig is an alias for EnhancedTriggersConfig
      const config: EnhancedTriggerConfig = {
        enabled: false,
        exit_intent: { enabled: true, sensitivity: "medium" },
      };

      expect(config.enabled).toBe(false);
    });

    it("should export AudienceTargetingConfig type", () => {
      const config: AudienceTargetingConfig = {
        enabled: true,
        shopifySegmentIds: ["segment-1", "segment-2"],
      };

      expect(config.enabled).toBe(true);
      expect(config.shopifySegmentIds).toHaveLength(2);
    });

    it("should export PageTargetingConfig type", () => {
      const config: PageTargetingConfig = {
        enabled: true,
        pages: ["/products/*"],
        customPatterns: [],
        excludePages: ["/cart"],
        productTags: [],
        collections: [],
      };

      expect(config.enabled).toBe(true);
      expect(config.pages).toContain("/products/*");
    });

    it("should export TargetRulesConfig type", () => {
      const config: TargetRulesConfig = {
        audienceTargeting: {
          enabled: true,
          shopifySegmentIds: [],
        },
        pageTargeting: {
          enabled: false,
          pages: [],
          customPatterns: [],
          excludePages: [],
          productTags: [],
          collections: [],
        },
      };

      expect(config.audienceTargeting?.enabled).toBe(true);
      expect(config.pageTargeting?.enabled).toBe(false);
    });

    it("should export TriggerType type", () => {
      const triggerType: TriggerType = "exit_intent";

      expect(triggerType).toBe("exit_intent");
    });

    it("should export TriggerRule type", () => {
      const rule: TriggerRule = {
        field: "delay",
        operator: "equals",
        value: 5000,
      };

      expect(rule.field).toBe("delay");
      expect(rule.value).toBe(5000);
    });

    it("should export EnhancedTrigger type", () => {
      const trigger: EnhancedTrigger = {
        id: "trigger-1",
        name: "Scroll Depth Trigger",
        rules: [{ field: "percentage", operator: "gte", value: 50 }],
        condition: "and",
      };

      expect(trigger.id).toBe("trigger-1");
      expect(trigger.name).toBe("Scroll Depth Trigger");
      expect(trigger.condition).toBe("and");
    });
  });
});

