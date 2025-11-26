/**
 * Countries Utility Tests
 *
 * Tests for geographic targeting country utilities
 */

import { describe, it, expect } from "vitest";
import {
  COUNTRIES,
  COMMON_COUNTRIES,
  EU_COUNTRIES,
  NORTH_AMERICA_COUNTRIES,
  ENGLISH_SPEAKING_COUNTRIES,
  getCountry,
  getCountryName,
  getCountryFlag,
} from "~/domains/targeting/utils/countries";

describe("Countries Utility", () => {
  describe("COUNTRIES array", () => {
    it("should contain at least 50 countries", () => {
      expect(COUNTRIES.length).toBeGreaterThanOrEqual(50);
    });

    it("should have unique country codes", () => {
      const codes = COUNTRIES.map((c) => c.code);
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(codes.length);
    });

    it("should have ISO 3166-1 alpha-2 codes (2 uppercase letters)", () => {
      for (const country of COUNTRIES) {
        expect(country.code).toMatch(/^[A-Z]{2}$/);
      }
    });

    it("should have non-empty names for all countries", () => {
      for (const country of COUNTRIES) {
        expect(country.name.length).toBeGreaterThan(0);
      }
    });

    it("should have emoji flags for all countries", () => {
      for (const country of COUNTRIES) {
        expect(country.flag.length).toBeGreaterThan(0);
      }
    });
  });

  describe("COMMON_COUNTRIES array", () => {
    it("should contain US, CA, GB", () => {
      const codes = COMMON_COUNTRIES.map((c) => c.code);
      expect(codes).toContain("US");
      expect(codes).toContain("CA");
      expect(codes).toContain("GB");
    });

    it("should be a subset of COUNTRIES", () => {
      const allCodes = new Set(COUNTRIES.map((c) => c.code));
      for (const common of COMMON_COUNTRIES) {
        expect(allCodes.has(common.code)).toBe(true);
      }
    });
  });

  describe("getCountry", () => {
    it("should return country object for valid code", () => {
      const us = getCountry("US");
      expect(us).toBeDefined();
      expect(us?.code).toBe("US");
      expect(us?.name).toBe("United States");
      expect(us?.flag).toBe("🇺🇸");
    });

    it("should be case-insensitive", () => {
      const lower = getCountry("us");
      const upper = getCountry("US");
      expect(lower).toEqual(upper);
    });

    it("should return undefined for invalid code", () => {
      const invalid = getCountry("XX");
      expect(invalid).toBeUndefined();
    });

    it("should return undefined for empty string", () => {
      const empty = getCountry("");
      expect(empty).toBeUndefined();
    });
  });

  describe("getCountryName", () => {
    it("should return country name for valid code", () => {
      expect(getCountryName("US")).toBe("United States");
      expect(getCountryName("CA")).toBe("Canada");
      expect(getCountryName("GB")).toBe("United Kingdom");
      expect(getCountryName("DE")).toBe("Germany");
    });

    it("should return the code itself for invalid code", () => {
      expect(getCountryName("XX")).toBe("XX");
      expect(getCountryName("INVALID")).toBe("INVALID");
    });
  });

  describe("getCountryFlag", () => {
    it("should return emoji flag for valid code", () => {
      expect(getCountryFlag("US")).toBe("🇺🇸");
      expect(getCountryFlag("CA")).toBe("🇨🇦");
      expect(getCountryFlag("JP")).toBe("🇯🇵");
    });

    it("should return default flag for invalid code", () => {
      expect(getCountryFlag("XX")).toBe("🏳️");
    });
  });

  describe("Region constants", () => {
    it("should have valid EU country codes", () => {
      expect(EU_COUNTRIES).toContain("DE");
      expect(EU_COUNTRIES).toContain("FR");
      expect(EU_COUNTRIES).toContain("IT");
      expect(EU_COUNTRIES).toContain("ES");
      expect(EU_COUNTRIES.length).toBeGreaterThanOrEqual(20);
    });

    it("should have valid North America country codes", () => {
      expect(NORTH_AMERICA_COUNTRIES).toEqual(["US", "CA", "MX"]);
    });

    it("should have valid English-speaking country codes", () => {
      expect(ENGLISH_SPEAKING_COUNTRIES).toContain("US");
      expect(ENGLISH_SPEAKING_COUNTRIES).toContain("GB");
      expect(ENGLISH_SPEAKING_COUNTRIES).toContain("AU");
    });
  });
});

