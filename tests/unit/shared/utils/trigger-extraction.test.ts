/**
 * Unit Tests for Trigger Extraction Utilities
 */

import { describe, it, expect } from "vitest";

import { extractTriggerConfig } from "~/shared/utils/trigger-extraction";

describe("extractTriggerConfig", () => {
  it("should return default config when campaign has no targetRules", () => {
    const campaign = {
      id: "1",
      targetRules: null,
    } as any;

    const result = extractTriggerConfig(campaign);

    expect(result.enabled).toBe(true);
    expect(result.page_load?.enabled).toBe(true);
    expect(result.page_load?.delay).toBe(0);
  });

  it("should extract enhancedTriggers from nested structure", () => {
    const campaign = {
      id: "1",
      targetRules: {
        enhancedTriggers: {
          enabled: true,
          page_load: { enabled: true, delay: 3000 },
          exit_intent: { enabled: true },
        },
      },
    } as any;

    const result = extractTriggerConfig(campaign);

    expect(result.enabled).toBe(true);
    expect(result.page_load?.delay).toBe(3000);
    expect(result.exit_intent?.enabled).toBe(true);
  });

  it("should handle legacy direct trigger structure", () => {
    const campaign = {
      id: "1",
      targetRules: {
        enabled: true,
        page_load: { enabled: false, delay: 5000 },
      },
    } as any;

    const result = extractTriggerConfig(campaign);

    expect(result.enabled).toBe(true);
    expect(result.page_load?.enabled).toBe(false);
    expect(result.page_load?.delay).toBe(5000);
  });

  it("should return default config for empty targetRules object", () => {
    const campaign = {
      id: "1",
      targetRules: {},
    } as any;

    const result = extractTriggerConfig(campaign);

    expect(result.enabled).toBe(true);
    expect(result.page_load?.enabled).toBe(true);
  });

  it("should handle exit_intent trigger", () => {
    const campaign = {
      id: "1",
      targetRules: {
        exit_intent: { enabled: true, sensitivity: "high" },
      },
    } as any;

    const result = extractTriggerConfig(campaign);

    expect(result.exit_intent?.enabled).toBe(true);
  });
});

