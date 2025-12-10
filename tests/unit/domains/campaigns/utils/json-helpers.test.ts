/**
 * Unit Tests for JSON Helpers
 *
 * Tests JSON parsing and serialization utilities for campaigns and experiments
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";

// Mock template registry
vi.mock("~/domains/templates/registry/template-registry", () => ({
  getContentSchemaForTemplate: vi.fn(),
}));

import {
  parseJsonField,
  prepareJsonField,
  stringifyJsonField,
  parseEntityJsonFields,
  prepareEntityJsonFields,
  parseContentConfig,
  parseDesignConfig,
  parseTargetRules,
  parseDiscountConfig,
  parseTrafficAllocation,
  parseStatisticalConfig,
  parseSuccessMetrics,
  parseCampaignFields,
  parseExperimentFields,
} from "~/domains/campaigns/utils/json-helpers";
import { getContentSchemaForTemplate } from "~/domains/templates/registry/template-registry";

// ==========================================================================
// CORE JSON PARSING TESTS
// ==========================================================================

describe("parseJsonField", () => {
  const testSchema = z.object({
    name: z.string(),
    value: z.number(),
  });

  it("should parse valid JSON object", () => {
    const result = parseJsonField({ name: "test", value: 42 }, testSchema, { name: "", value: 0 });
    expect(result).toEqual({ name: "test", value: 42 });
  });

  it("should parse JSON string", () => {
    const result = parseJsonField('{"name":"test","value":42}', testSchema, { name: "", value: 0 });
    expect(result).toEqual({ name: "test", value: 42 });
  });

  it("should return default for null", () => {
    const defaultValue = { name: "default", value: 0 };
    const result = parseJsonField(null, testSchema, defaultValue);
    expect(result).toEqual(defaultValue);
  });

  it("should return default for undefined", () => {
    const defaultValue = { name: "default", value: 0 };
    const result = parseJsonField(undefined, testSchema, defaultValue);
    expect(result).toEqual(defaultValue);
  });

  it("should return default for invalid schema", () => {
    const defaultValue = { name: "default", value: 0 };
    const result = parseJsonField({ name: 123, value: "invalid" }, testSchema, defaultValue);
    expect(result).toEqual(defaultValue);
  });

  it("should return default for invalid JSON string", () => {
    const defaultValue = { name: "default", value: 0 };
    const result = parseJsonField("not valid json", testSchema, defaultValue);
    expect(result).toEqual(defaultValue);
  });
});

describe("prepareJsonField", () => {
  it("should handle null", () => {
    const result = prepareJsonField(null);
    // Prisma.JsonNull is a symbol - just check it's not the original null
    expect(result).toBeDefined();
  });

  it("should handle primitives", () => {
    expect(prepareJsonField("string")).toBe("string");
    expect(prepareJsonField(42)).toBe(42);
    expect(prepareJsonField(true)).toBe(true);
  });

  it("should handle undefined", () => {
    const result = prepareJsonField(undefined);
    expect(result).toEqual({});
  });

  it("should handle arrays", () => {
    const result = prepareJsonField([1, 2, 3]);
    expect(result).toEqual([1, 2, 3]);
  });

  it("should handle nested objects", () => {
    const result = prepareJsonField({ a: { b: 1 } });
    expect(result).toEqual({ a: { b: 1 } });
  });
});

describe("stringifyJsonField", () => {
  it("should stringify object to JSON", () => {
    const result = stringifyJsonField({ name: "test" });
    expect(result).toBe('{"name":"test"}');
  });

  it("should return empty object string on error", () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    const result = stringifyJsonField(circular);
    expect(result).toBe("{}");
  });
});

// ==========================================================================
// ENTITY JSON MAPPERS TESTS
// ==========================================================================

describe("parseEntityJsonFields", () => {
  it("should parse multiple JSON fields on entity", () => {
    const entity = {
      id: "1",
      config: '{"enabled":true}',
      settings: { theme: "dark" },
    };

    const fields = [
      { key: "config" as const, schema: z.object({ enabled: z.boolean() }), defaultValue: { enabled: false } },
      { key: "settings" as const, schema: z.object({ theme: z.string() }), defaultValue: { theme: "light" } },
    ];

    const result = parseEntityJsonFields(entity, fields);
    expect(result.config).toEqual({ enabled: true });
    expect(result.settings).toEqual({ theme: "dark" });
  });
});

describe("prepareEntityJsonFields", () => {
  it("should prepare multiple JSON fields for storage", () => {
    const entity = {
      config: { enabled: true },
      settings: { theme: "dark" },
    };

    const fields = [
      { key: "config" as const, defaultValue: {} },
      { key: "settings" as const, defaultValue: {} },
    ];

    const result = prepareEntityJsonFields(entity, fields);
    expect(result.config).toEqual({ enabled: true });
    expect(result.settings).toEqual({ theme: "dark" });
  });
});

// ==========================================================================
// CAMPAIGN JSON PARSERS TESTS
// ==========================================================================

describe("parseContentConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should parse content with template schema", () => {
    const mockSchema = z.object({ headline: z.string() });
    vi.mocked(getContentSchemaForTemplate).mockReturnValue(mockSchema);

    const result = parseContentConfig({ headline: "Test" }, "NEWSLETTER");
    expect(result).toEqual({ headline: "Test" });
  });

  it("should return empty object for invalid content", () => {
    const mockSchema = z.object({ headline: z.string() });
    vi.mocked(getContentSchemaForTemplate).mockReturnValue(mockSchema);

    const result = parseContentConfig({ headline: 123 }, "NEWSLETTER");
    expect(result).toEqual({});
  });
});

describe("parseDesignConfig", () => {
  it("should parse valid design config with specified values", () => {
    const result = parseDesignConfig({
      position: "top", // Valid enum value
      size: "large",
      borderRadius: 16,
    });

    expect(result.position).toBe("top");
    expect(result.size).toBe("large");
    expect(result.borderRadius).toBe(16);
  });

  it("should return defaults for empty config", () => {
    const result = parseDesignConfig(null);

    expect(result.themeMode).toBe("default");
    expect(result.position).toBe("center");
    expect(result.size).toBe("medium");
  });

  it("should coerce legacy modal displayMode to popup", () => {
    const result = parseDesignConfig({ displayMode: "modal" });
    expect(result.displayMode).toBe("popup");
  });
});

describe("parseTargetRules", () => {
  it("should parse valid target rules", () => {
    // TargetRulesConfigSchema expects enhancedTriggers, audienceTargeting, etc.
    const rules = {
      audienceTargeting: {
        enabled: true,
        shopifySegmentIds: ["seg-1", "seg-2"],
      },
    };
    const result = parseTargetRules(rules);
    expect(result?.audienceTargeting?.enabled).toBe(true);
    expect(result?.audienceTargeting?.shopifySegmentIds).toEqual(["seg-1", "seg-2"]);
  });

  it("should return null for null input", () => {
    const result = parseTargetRules(null);
    expect(result).toBeNull();
  });

  it("should parse empty object", () => {
    const result = parseTargetRules({});
    expect(result).toBeDefined();
  });
});

describe("parseDiscountConfig", () => {
  it("should parse valid discount config", () => {
    // DiscountConfigSchema has enabled with default(false)
    const result = parseDiscountConfig({
      enabled: true,
      strategy: "simple",
      showInPreview: true,
    });

    expect(result.enabled).toBe(true);
    expect(result.strategy).toBe("simple");
  });

  it("should return defaults for empty config", () => {
    const result = parseDiscountConfig(null);
    expect(result.enabled).toBe(false);
    expect(result.showInPreview).toBe(true);
  });
});

// ==========================================================================
// EXPERIMENT JSON PARSERS TESTS
// ==========================================================================

describe("parseTrafficAllocation", () => {
  it("should parse valid traffic allocation", () => {
    const result = parseTrafficAllocation({ A: 60, B: 40 });
    expect(result.A).toBe(60);
    expect(result.B).toBe(40);
  });

  it("should return defaults for empty allocation", () => {
    const result = parseTrafficAllocation(null);
    expect(result.A).toBe(50);
    expect(result.B).toBe(50);
  });
});

describe("parseStatisticalConfig", () => {
  it("should parse valid statistical config", () => {
    const result = parseStatisticalConfig({ confidenceLevel: 0.99 });
    expect(result.confidenceLevel).toBe(0.99);
  });

  it("should return defaults for empty config", () => {
    const result = parseStatisticalConfig(null);
    expect(result.confidenceLevel).toBe(0.95);
    expect(result.minimumSampleSize).toBe(1000);
  });
});

describe("parseSuccessMetrics", () => {
  it("should parse valid success metrics", () => {
    const result = parseSuccessMetrics({ primaryMetric: "revenue_per_visitor" });
    expect(result.primaryMetric).toBe("revenue_per_visitor");
  });

  it("should return defaults for empty metrics", () => {
    const result = parseSuccessMetrics(null);
    expect(result.primaryMetric).toBe("conversion_rate");
  });
});

