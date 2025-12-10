/**
 * Unit Tests for Template Field Definitions
 */

import { describe, it, expect } from "vitest";

import { getFieldsForTemplate } from "~/lib/template-field-definitions";

describe("getFieldsForTemplate", () => {
  describe("NEWSLETTER template", () => {
    it("should return common newsletter fields", () => {
      const fields = getFieldsForTemplate("NEWSLETTER");

      expect(fields.length).toBeGreaterThan(0);
      expect(fields.some((f) => f.id === "headline")).toBe(true);
      expect(fields.some((f) => f.id === "subheadline")).toBe(true);
      expect(fields.some((f) => f.id === "buttonText")).toBe(true);
      expect(fields.some((f) => f.id === "successMessage")).toBe(true);
      expect(fields.some((f) => f.id === "emailPlaceholder")).toBe(true);
    });

    it("should have required validation on headline", () => {
      const fields = getFieldsForTemplate("NEWSLETTER");
      const headline = fields.find((f) => f.id === "headline");

      expect(headline?.validation?.required).toBe(true);
    });
  });

  describe("SPIN_TO_WIN template", () => {
    it("should include wheel-specific fields", () => {
      const fields = getFieldsForTemplate("SPIN_TO_WIN");

      expect(fields.some((f) => f.id === "wheelColors")).toBe(true);
      expect(fields.some((f) => f.id === "prizes")).toBe(true);
    });

    it("should also include common newsletter fields", () => {
      const fields = getFieldsForTemplate("SPIN_TO_WIN");

      expect(fields.some((f) => f.id === "headline")).toBe(true);
      expect(fields.some((f) => f.id === "buttonText")).toBe(true);
    });
  });

  describe("SCRATCH_CARD template", () => {
    it("should have same fields as SPIN_TO_WIN", () => {
      const spinFields = getFieldsForTemplate("SPIN_TO_WIN");
      const scratchFields = getFieldsForTemplate("SCRATCH_CARD");

      expect(scratchFields).toEqual(spinFields);
    });
  });

  describe("FLASH_SALE template", () => {
    it("should include countdown-specific fields", () => {
      const fields = getFieldsForTemplate("FLASH_SALE");

      expect(fields.some((f) => f.id === "countdownDuration")).toBe(true);
      expect(fields.some((f) => f.id === "urgencyText")).toBe(true);
    });

    it("should have countdown duration validation", () => {
      const fields = getFieldsForTemplate("FLASH_SALE");
      const countdown = fields.find((f) => f.id === "countdownDuration");

      expect(countdown?.validation?.min).toBe(1);
      expect(countdown?.validation?.max).toBe(1440);
    });
  });

  describe("COUNTDOWN_TIMER template", () => {
    it("should have same fields as FLASH_SALE", () => {
      const flashFields = getFieldsForTemplate("FLASH_SALE");
      const countdownFields = getFieldsForTemplate("COUNTDOWN_TIMER");

      expect(countdownFields).toEqual(flashFields);
    });
  });

  describe("CART_ABANDONMENT template", () => {
    it("should include cart reminder field", () => {
      const fields = getFieldsForTemplate("CART_ABANDONMENT");

      expect(fields.some((f) => f.id === "cartReminderText")).toBe(true);
    });
  });

  describe("Case insensitivity", () => {
    it("should handle lowercase template types", () => {
      const fields = getFieldsForTemplate("newsletter");

      expect(fields.some((f) => f.id === "headline")).toBe(true);
    });

    it("should handle mixed case template types", () => {
      const fields = getFieldsForTemplate("Newsletter");

      expect(fields.some((f) => f.id === "headline")).toBe(true);
    });
  });

  describe("Unknown template", () => {
    it("should return common newsletter fields for unknown template", () => {
      const fields = getFieldsForTemplate("UNKNOWN_TEMPLATE");

      expect(fields.some((f) => f.id === "headline")).toBe(true);
      expect(fields.some((f) => f.id === "buttonText")).toBe(true);
    });
  });
});

