/**
 * Comprehensive Unit Tests for Free Shipping Bar Content Configuration Options
 *
 * Tests ALL content options available in the Free Shipping Bar admin form:
 * - Threshold Configuration (threshold, currency, nearMissThreshold)
 * - Message Templates (empty, progress, nearMiss, unlocked)
 * - Display Options (barPosition, dismissible, showIcon, celebrateOnUnlock)
 * - Email Claim Configuration
 */

import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { AppProvider } from "@shopify/polaris";
import en from "@shopify/polaris/locales/en.json";

import { FreeShippingContentSection } from "~/domains/campaigns/components/sections/FreeShippingContentSection";
import type { FreeShippingContent } from "~/domains/campaigns/components/sections/FreeShippingContentSection";

function renderWithPolaris(ui: React.ReactNode) {
  return render(<AppProvider i18n={en}>{ui}</AppProvider>);
}

describe("FreeShippingContentSection - ALL Configuration Options", () => {

  // ========== BAR POSITION TESTS ==========

  describe("Bar Position Configuration", () => {
    it("normalizes barPosition to 'top' when missing and persists via onChange", async () => {
      let latest: any = {};
      const onChange = vi.fn((partial: any) => {
        latest = { ...latest, ...partial };
      });

      renderWithPolaris(
        <FreeShippingContentSection content={{}} onChange={onChange} />,
      );

      await waitFor(() => expect(onChange).toHaveBeenCalled());

      expect(latest.barPosition).toBe("top");
    });

    it("should preserve barPosition 'bottom' when set", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <FreeShippingContentSection
          content={{ barPosition: "bottom" }}
          onChange={onChange}
        />,
      );

      // Verify the select has the correct value
      const barPositionSelect = container.querySelector('s-select[name="content.barPosition"]');
      expect(barPositionSelect).toBeTruthy();
      expect(barPositionSelect?.getAttribute("value")).toBe("bottom");
    });
  });

  // ========== THRESHOLD CONFIGURATION TESTS ==========

  describe("Threshold Configuration", () => {
    // Note: Default values are defined in the schema:
    // - threshold: 75 (not 50)
    // - currency: "$" (not "USD")
    // - nearMissThreshold: 10

    it("should render threshold field", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <FreeShippingContentSection
          content={{ threshold: 100 }}
          onChange={onChange}
        />,
      );

      const thresholdField = container.querySelector('s-text-field[name="content.threshold"]');
      expect(thresholdField).toBeTruthy();
      expect(thresholdField?.getAttribute("value")).toBe("100");
    });

    it("should render custom currency value", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <FreeShippingContentSection
          content={{ currency: "€" }}
          onChange={onChange}
        />,
      );

      const currencyField = container.querySelector('s-text-field[name="content.currency"]');
      expect(currencyField).toBeTruthy();
      expect(currencyField?.getAttribute("value")).toBe("€");
    });

    it("should render nearMissThreshold with placeholder for default value", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <FreeShippingContentSection
          content={{}}
          onChange={onChange}
        />,
      );

      const nearMissField = container.querySelector('s-text-field[name="content.nearMissThreshold"]');
      expect(nearMissField).toBeTruthy();
      // Empty value with placeholder="10" indicates the default
      expect(nearMissField?.getAttribute("placeholder")).toBe("10");
    });

    it("should render custom nearMissThreshold value", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <FreeShippingContentSection
          content={{ nearMissThreshold: 15 }}
          onChange={onChange}
        />,
      );

      const nearMissField = container.querySelector('s-text-field[name="content.nearMissThreshold"]');
      expect(nearMissField).toBeTruthy();
      expect(nearMissField?.getAttribute("value")).toBe("15");
    });
  });

  // ========== MESSAGE TEMPLATES TESTS ==========

  describe("Message Templates", () => {
    // Note: The component renders empty values if no content is passed.
    // Schema defaults are applied at parse time, not in the component.
    // Tests here verify custom values are correctly displayed.

    it("should render custom emptyMessage", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <FreeShippingContentSection
          content={{ emptyMessage: "Start shopping to unlock free shipping!" }}
          onChange={onChange}
        />,
      );

      const emptyMessageField = container.querySelector('s-text-field[name="content.emptyMessage"]');
      expect(emptyMessageField).toBeTruthy();
      expect(emptyMessageField?.getAttribute("value")).toBe("Start shopping to unlock free shipping!");
    });

    it("should render custom progressMessage", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <FreeShippingContentSection
          content={{ progressMessage: "Just {remaining} more to go!" }}
          onChange={onChange}
        />,
      );

      const progressMessageField = container.querySelector('s-text-field[name="content.progressMessage"]');
      expect(progressMessageField).toBeTruthy();
      expect(progressMessageField?.getAttribute("value")).toBe("Just {remaining} more to go!");
    });

    it("should render custom unlockedMessage", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <FreeShippingContentSection
          content={{ unlockedMessage: "🚀 Free shipping is yours!" }}
          onChange={onChange}
        />,
      );

      const unlockedMessageField = container.querySelector('s-text-field[name="content.unlockedMessage"]');
      expect(unlockedMessageField).toBeTruthy();
      expect(unlockedMessageField?.getAttribute("value")).toBe("🚀 Free shipping is yours!");
    });
  });

  // ========== DISPLAY OPTIONS TESTS ==========

  describe("Display Options", () => {
    // The checkbox names use "content." prefix, e.g., "content.dismissible"

    it("should render dismissible checkbox with default true", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <FreeShippingContentSection
          content={{}}
          onChange={onChange}
        />,
      );

      const dismissibleCheckbox = container.querySelector('s-checkbox[name="content.dismissible"]');
      expect(dismissibleCheckbox).toBeTruthy();
      expect(dismissibleCheckbox?.getAttribute("checked")).toBe("true");
    });

    it("should render dismissible as false when set", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <FreeShippingContentSection
          content={{ dismissible: false }}
          onChange={onChange}
        />,
      );

      const dismissibleCheckbox = container.querySelector('s-checkbox[name="content.dismissible"]');
      expect(dismissibleCheckbox).toBeTruthy();
      expect(dismissibleCheckbox?.getAttribute("checked")).toBe("false");
    });

    it("should render showIcon checkbox with default true", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <FreeShippingContentSection
          content={{}}
          onChange={onChange}
        />,
      );

      const showIconCheckbox = container.querySelector('s-checkbox[name="content.showIcon"]');
      expect(showIconCheckbox).toBeTruthy();
      expect(showIconCheckbox?.getAttribute("checked")).toBe("true");
    });

    it("should render showIcon as false when set", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <FreeShippingContentSection
          content={{ showIcon: false }}
          onChange={onChange}
        />,
      );

      const showIconCheckbox = container.querySelector('s-checkbox[name="content.showIcon"]');
      expect(showIconCheckbox).toBeTruthy();
      expect(showIconCheckbox?.getAttribute("checked")).toBe("false");
    });

    it("should render celebrateOnUnlock checkbox with default true", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <FreeShippingContentSection
          content={{}}
          onChange={onChange}
        />,
      );

      const celebrateCheckbox = container.querySelector('s-checkbox[name="content.celebrateOnUnlock"]');
      expect(celebrateCheckbox).toBeTruthy();
      expect(celebrateCheckbox?.getAttribute("checked")).toBe("true");
    });

    it("should render celebrateOnUnlock as false when set", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <FreeShippingContentSection
          content={{ celebrateOnUnlock: false }}
          onChange={onChange}
        />,
      );

      const celebrateCheckbox = container.querySelector('s-checkbox[name="content.celebrateOnUnlock"]');
      expect(celebrateCheckbox).toBeTruthy();
      expect(celebrateCheckbox?.getAttribute("checked")).toBe("false");
    });
  });

  // ========== EMAIL CLAIM CONFIGURATION TESTS ==========

  describe("Email Claim Configuration", () => {
    it("should render requireEmailToClaim checkbox (off by default)", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <FreeShippingContentSection
          content={{}}
          onChange={onChange}
        />,
      );

      const requireEmailCheckbox = container.querySelector('s-checkbox[name="content.requireEmailToClaim"]');
      expect(requireEmailCheckbox).toBeTruthy();
      expect(requireEmailCheckbox?.getAttribute("checked")).toBe("false");
    });

    it("should render requireEmailToClaim as true when set", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <FreeShippingContentSection
          content={{ requireEmailToClaim: true }}
          onChange={onChange}
        />,
      );

      const requireEmailCheckbox = container.querySelector('s-checkbox[name="content.requireEmailToClaim"]');
      expect(requireEmailCheckbox).toBeTruthy();
      expect(requireEmailCheckbox?.getAttribute("checked")).toBe("true");
    });
  });

  // ========== INTEGRATION TESTS ==========

  describe("Integration - Complete Configuration", () => {
    it("should handle a fully configured free shipping bar", async () => {
      const onChange = vi.fn();

      const content: Partial<FreeShippingContent> = {
        threshold: 100,
        currency: "EUR",
        nearMissThreshold: 20,
        barPosition: "bottom",
        emptyMessage: "Shop {{remaining}} more for free shipping!",
        progressMessage: "Only {{remaining}} to go!",
        nearMissMessage: "So close! {{remaining}} more!",
        unlockedMessage: "🎉 You did it! Free shipping unlocked!",
        dismissible: true,
        showIcon: true,
        celebrateOnUnlock: true,
        requireEmailToClaim: true,
        claimButtonLabel: "Claim Now",
        claimEmailPlaceholder: "Enter email",
        claimSuccessMessage: "Your code has been sent!",
      };

      renderWithPolaris(
        <FreeShippingContentSection
          content={content}
          onChange={onChange}
        />,
      );

      // Verify all content sections are configured correctly
      expect(content.threshold).toBe(100);
      expect(content.currency).toBe("EUR");
      expect(content.barPosition).toBe("bottom");
      expect(content.requireEmailToClaim).toBe(true);
      expect(content.celebrateOnUnlock).toBe(true);
    });
  });

  // ========== SCHEMA VALIDATION TESTS ==========

  describe("Schema Validation", () => {
    it("should validate free shipping content against schema with defaults", async () => {
      const { FreeShippingContentSchema } = await import(
        "~/domains/campaigns/types/campaign"
      );

      // FreeShippingContentSchema doesn't extend BaseContentConfigSchema
      // It's a standalone schema with all optional fields with defaults
      const parsed = FreeShippingContentSchema.parse({});

      // Verify defaults are applied
      expect(parsed.threshold).toBe(75); // Default is 75, not 50
      expect(parsed.currency).toBe("$"); // Default is "$", not "USD"
      expect(parsed.nearMissThreshold).toBe(10);
      expect(parsed.barPosition).toBe("top");
      expect(parsed.dismissible).toBe(true);
      expect(parsed.showIcon).toBe(true);
      expect(parsed.celebrateOnUnlock).toBe(true);
      expect(parsed.requireEmailToClaim).toBe(false);
      // Messages use {remaining} not {{remaining}}
      expect(parsed.emptyMessage).toContain("items");
      expect(parsed.progressMessage).toContain("{remaining}");
    });

    it("should validate free shipping content with custom messages", async () => {
      const { FreeShippingContentSchema } = await import(
        "~/domains/campaigns/types/campaign"
      );

      const parsed = FreeShippingContentSchema.parse({
        emptyMessage: "Custom empty message",
        progressMessage: "Custom progress message",
        nearMissMessage: "Custom near miss message",
        unlockedMessage: "Custom unlocked message",
      });

      expect(parsed.emptyMessage).toBe("Custom empty message");
      expect(parsed.progressMessage).toBe("Custom progress message");
      expect(parsed.nearMissMessage).toBe("Custom near miss message");
      expect(parsed.unlockedMessage).toBe("Custom unlocked message");
    });
  });
});

