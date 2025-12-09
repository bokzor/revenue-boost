/**
 * Unit Tests for Store Settings Types
 */

import { describe, it, expect } from "vitest";

import {
  POPUP_FREQUENCY_BEST_PRACTICES,
  SOCIAL_PROOF_FREQUENCY_BEST_PRACTICES,
  BANNER_FREQUENCY_BEST_PRACTICES,
  GlobalFrequencyCappingSettingsSchema,
  StoreSettingsSchema,
} from "~/domains/store/types/settings";

describe("Frequency Best Practices Constants", () => {
  describe("POPUP_FREQUENCY_BEST_PRACTICES", () => {
    it("should have expected values", () => {
      expect(POPUP_FREQUENCY_BEST_PRACTICES.max_per_session).toBe(3);
      expect(POPUP_FREQUENCY_BEST_PRACTICES.max_per_day).toBe(8);
      expect(POPUP_FREQUENCY_BEST_PRACTICES.cooldown_between_popups).toBe(30);
    });
  });

  describe("SOCIAL_PROOF_FREQUENCY_BEST_PRACTICES", () => {
    it("should have higher limits than popups", () => {
      expect(SOCIAL_PROOF_FREQUENCY_BEST_PRACTICES.max_per_session).toBe(10);
      expect(SOCIAL_PROOF_FREQUENCY_BEST_PRACTICES.max_per_day).toBe(30);
      expect(SOCIAL_PROOF_FREQUENCY_BEST_PRACTICES.cooldown_between_popups).toBe(10);
    });
  });

  describe("BANNER_FREQUENCY_BEST_PRACTICES", () => {
    it("should have unlimited session/day limits", () => {
      expect(BANNER_FREQUENCY_BEST_PRACTICES.max_per_session).toBeUndefined();
      expect(BANNER_FREQUENCY_BEST_PRACTICES.max_per_day).toBeUndefined();
      expect(BANNER_FREQUENCY_BEST_PRACTICES.cooldown_between_popups).toBe(5);
    });
  });
});

describe("GlobalFrequencyCappingSettingsSchema", () => {
  it("should validate valid settings", () => {
    const result = GlobalFrequencyCappingSettingsSchema.safeParse({
      enabled: true,
      max_per_session: 5,
      max_per_day: 10,
      cooldown_between_popups: 30,
    });

    expect(result.success).toBe(true);
  });

  it("should default enabled to false", () => {
    const result = GlobalFrequencyCappingSettingsSchema.parse({});
    expect(result.enabled).toBe(false);
  });

  it("should reject negative values", () => {
    const result = GlobalFrequencyCappingSettingsSchema.safeParse({
      enabled: true,
      max_per_session: -1,
    });

    expect(result.success).toBe(false);
  });

  it("should allow optional fields", () => {
    const result = GlobalFrequencyCappingSettingsSchema.safeParse({
      enabled: true,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.max_per_session).toBeUndefined();
    }
  });
});

describe("StoreSettingsSchema", () => {
  it("should validate empty settings", () => {
    const result = StoreSettingsSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("should validate settings with frequency capping", () => {
    const result = StoreSettingsSchema.safeParse({
      frequencyCapping: {
        enabled: true,
        max_per_session: 3,
      },
      socialProofFrequencyCapping: {
        enabled: false,
      },
    });

    expect(result.success).toBe(true);
  });

  it("should validate settings with global CSS", () => {
    const result = StoreSettingsSchema.safeParse({
      globalCustomCSS: ".popup { color: red; }",
    });

    expect(result.success).toBe(true);
  });

  it("should reject invalid CSS with script tags", () => {
    const result = StoreSettingsSchema.safeParse({
      globalCustomCSS: "<script>alert('xss')</script>",
    });

    expect(result.success).toBe(false);
  });
});

