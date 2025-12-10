/**
 * Unit Tests for Frequency Defaults
 */

import { describe, it, expect } from "vitest";

import {
  getFrequencyCappingDefaults,
  getFrequencyCappingHelpText,
  shouldEnableFrequencyCapping,
  getServerFrequencyCapping,
} from "~/domains/campaigns/utils/frequency-defaults";

describe("getFrequencyCappingDefaults", () => {
  describe("Banner Templates", () => {
    it("should return no frequency cap for FREE_SHIPPING", () => {
      const defaults = getFrequencyCappingDefaults("FREE_SHIPPING");

      expect(defaults.enabled).toBe(false);
      expect(defaults.max_triggers_per_session).toBeUndefined();
      expect(defaults.max_triggers_per_day).toBeUndefined();
      expect(defaults.respectGlobalCap).toBe(false);
    });

    it("should return limited frequency for ANNOUNCEMENT", () => {
      const defaults = getFrequencyCappingDefaults("ANNOUNCEMENT");

      expect(defaults.enabled).toBe(true);
      expect(defaults.max_triggers_per_session).toBe(3);
      expect(defaults.max_triggers_per_day).toBe(10);
    });
  });

  describe("Modal Templates", () => {
    it("should return once per session for NEWSLETTER", () => {
      const defaults = getFrequencyCappingDefaults("NEWSLETTER");

      expect(defaults.enabled).toBe(true);
      expect(defaults.max_triggers_per_session).toBe(1);
      expect(defaults.max_triggers_per_day).toBe(1);
    });

    it("should return once per week for SPIN_TO_WIN", () => {
      const defaults = getFrequencyCappingDefaults("SPIN_TO_WIN");

      expect(defaults.enabled).toBe(true);
      expect(defaults.cooldown_between_triggers).toBe(604800); // 7 days
    });
  });

  describe("Other Templates", () => {
    it("should return defaults for FLASH_SALE", () => {
      const defaults = getFrequencyCappingDefaults("FLASH_SALE");

      expect(defaults.enabled).toBe(true);
      expect(defaults.max_triggers_per_session).toBe(2);
    });

    it("should return defaults for CART_ABANDONMENT", () => {
      const defaults = getFrequencyCappingDefaults("CART_ABANDONMENT");

      expect(defaults.enabled).toBe(true);
      expect(defaults.max_triggers_per_session).toBe(3);
    });
  });
});

describe("getFrequencyCappingHelpText", () => {
  it("should return help text for template type", () => {
    const helpText = getFrequencyCappingHelpText("NEWSLETTER");

    expect(helpText).toContain("once per session");
  });

  it("should return help text for FREE_SHIPPING", () => {
    const helpText = getFrequencyCappingHelpText("FREE_SHIPPING");

    expect(helpText).toContain("banner");
  });
});

describe("shouldEnableFrequencyCapping", () => {
  it("should return false for FREE_SHIPPING", () => {
    expect(shouldEnableFrequencyCapping("FREE_SHIPPING")).toBe(false);
  });

  it("should return true for NEWSLETTER", () => {
    expect(shouldEnableFrequencyCapping("NEWSLETTER")).toBe(true);
  });

  it("should return true for SPIN_TO_WIN", () => {
    expect(shouldEnableFrequencyCapping("SPIN_TO_WIN")).toBe(true);
  });
});

describe("getServerFrequencyCapping", () => {
  it("should return undefined for disabled frequency capping", () => {
    const config = getServerFrequencyCapping("FREE_SHIPPING");
    expect(config).toBeUndefined();
  });

  it("should return config for enabled frequency capping", () => {
    const config = getServerFrequencyCapping("NEWSLETTER");

    expect(config).toBeDefined();
    expect(config?.max_triggers_per_session).toBe(1);
    expect(config?.max_triggers_per_day).toBe(1);
  });

  it("should include cooldown for SPIN_TO_WIN", () => {
    const config = getServerFrequencyCapping("SPIN_TO_WIN");

    expect(config?.cooldown_between_triggers).toBe(604800);
  });
});

