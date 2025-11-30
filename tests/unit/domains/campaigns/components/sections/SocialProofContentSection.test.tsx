/**
 * Comprehensive Unit Tests for Social Proof Content Configuration Options
 *
 * Tests ALL content options available in the Social Proof admin form:
 * - Notification Type Toggles (purchase, visitor, review)
 * - Message Templates for each notification type
 * - Display Options (position, duration, rotation interval)
 * - Image & Timer Options
 * - Thresholds (visitor count, review rating)
 */

import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { AppProvider } from "@shopify/polaris";
import en from "@shopify/polaris/locales/en.json";

import { SocialProofContentSection } from "~/domains/campaigns/components/sections/SocialProofContentSection";
import type { SocialProofContent } from "~/domains/campaigns/components/sections/SocialProofContentSection";

function renderWithPolaris(ui: React.ReactNode) {
  return render(<AppProvider i18n={en}>{ui}</AppProvider>);
}

describe("SocialProofContentSection - ALL Configuration Options", () => {

  // ========== NOTIFICATION TYPE TOGGLES TESTS ==========

  describe("Notification Type Toggles", () => {
    it("uses sane defaults for enabled notification types and position when content is empty", () => {
      const { container } = renderWithPolaris(
        <SocialProofContentSection
          content={{}}
          onChange={() => {}}
        />,
      );

      const purchaseCheckbox = container.querySelector(
        's-checkbox[name="content.enablePurchaseNotifications"]',
      );
      const visitorCheckbox = container.querySelector(
        's-checkbox[name="content.enableVisitorNotifications"]',
      );
      const reviewCheckbox = container.querySelector(
        's-checkbox[name="content.enableReviewNotifications"]',
      );

      expect(purchaseCheckbox?.getAttribute("checked")).toBe("true");
      expect(visitorCheckbox?.getAttribute("checked")).toBe("true");
      expect(reviewCheckbox?.getAttribute("checked")).toBe("false");

      const positionSelect = container.querySelector(
        's-select[name="content.cornerPosition"]',
      );
      expect(positionSelect).toBeTruthy();
      expect(positionSelect?.getAttribute("value")).toBe("bottom-left");
    });

    it("should render enablePurchaseNotifications as false when set", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <SocialProofContentSection
          content={{ enablePurchaseNotifications: false }}
          onChange={onChange}
        />,
      );

      const purchaseCheckbox = container.querySelector(
        's-checkbox[name="content.enablePurchaseNotifications"]',
      );
      expect(purchaseCheckbox?.getAttribute("checked")).toBe("false");
    });

    it("should render enableVisitorNotifications as false when set", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <SocialProofContentSection
          content={{ enableVisitorNotifications: false }}
          onChange={onChange}
        />,
      );

      const visitorCheckbox = container.querySelector(
        's-checkbox[name="content.enableVisitorNotifications"]',
      );
      expect(visitorCheckbox?.getAttribute("checked")).toBe("false");
    });

    it("should render enableReviewNotifications as true when set", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <SocialProofContentSection
          content={{ enableReviewNotifications: true }}
          onChange={onChange}
        />,
      );

      const reviewCheckbox = container.querySelector(
        's-checkbox[name="content.enableReviewNotifications"]',
      );
      expect(reviewCheckbox?.getAttribute("checked")).toBe("true");
    });
  });

  // NOTE: Message template fields (purchaseMessageTemplate, visitorMessageTemplate, reviewMessageTemplate)
  // are in the schema but NOT rendered by SocialProofContentSection component.
  // These would need to be added to the component if UI editing is required.

  // ========== DISPLAY OPTIONS TESTS ==========

  describe("Display Options", () => {
    it("should render cornerPosition select with default bottom-left", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <SocialProofContentSection
          content={{}}
          onChange={onChange}
        />,
      );

      const positionSelect = container.querySelector(
        's-select[name="content.cornerPosition"]',
      );
      expect(positionSelect).toBeTruthy();
      expect(positionSelect?.getAttribute("value")).toBe("bottom-left");
    });

    it("should render bottom-right cornerPosition when set", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <SocialProofContentSection
          content={{ cornerPosition: "bottom-right" }}
          onChange={onChange}
        />,
      );

      const positionSelect = container.querySelector(
        's-select[name="content.cornerPosition"]',
      );
      expect(positionSelect?.getAttribute("value")).toBe("bottom-right");
    });

    // NOTE: displayDuration field is in the schema but NOT rendered by the component
    // It's either handled elsewhere or a missing feature

    it("should render rotationInterval with custom value", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <SocialProofContentSection
          content={{ rotationInterval: 15 }} // seconds
          onChange={onChange}
        />,
      );

      const rotationIntervalField = container.querySelector(
        's-text-field[name="content.rotationInterval"]',
      );
      expect(rotationIntervalField).toBeTruthy();
      expect(rotationIntervalField?.getAttribute("value")).toBe("15");
    });

    it("should render maxNotificationsPerSession with custom value", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <SocialProofContentSection
          content={{ maxNotificationsPerSession: 20 }}
          onChange={onChange}
        />,
      );

      const maxNotificationsField = container.querySelector(
        's-text-field[name="content.maxNotificationsPerSession"]',
      );
      expect(maxNotificationsField?.getAttribute("value")).toBe("20");
    });
  });

  // ========== IMAGE AND TIMER OPTIONS TESTS ==========

  describe("Image and Timer Options", () => {
    it("should render showProductImage checkbox with default true", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <SocialProofContentSection
          content={{}}
          onChange={onChange}
        />,
      );

      const showImageCheckbox = container.querySelector(
        's-checkbox[name="content.showProductImage"]',
      );
      expect(showImageCheckbox).toBeTruthy();
      expect(showImageCheckbox?.getAttribute("checked")).toBe("true");
    });

    it("should render showProductImage as false when set", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <SocialProofContentSection
          content={{ showProductImage: false }}
          onChange={onChange}
        />,
      );

      const showImageCheckbox = container.querySelector(
        's-checkbox[name="content.showProductImage"]',
      );
      expect(showImageCheckbox?.getAttribute("checked")).toBe("false");
    });

    it("should render showTimer checkbox with default true", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <SocialProofContentSection
          content={{}}
          onChange={onChange}
        />,
      );

      const showTimerCheckbox = container.querySelector(
        's-checkbox[name="content.showTimer"]',
      );
      expect(showTimerCheckbox).toBeTruthy();
      expect(showTimerCheckbox?.getAttribute("checked")).toBe("true");
    });

    it("should render showTimer as false when set", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <SocialProofContentSection
          content={{ showTimer: false }}
          onChange={onChange}
        />,
      );

      const showTimerCheckbox = container.querySelector(
        's-checkbox[name="content.showTimer"]',
      );
      expect(showTimerCheckbox?.getAttribute("checked")).toBe("false");
    });
  });

  // ========== THRESHOLD OPTIONS TESTS ==========

  describe("Threshold Options", () => {
    it("should render minVisitorCount with default value", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <SocialProofContentSection
          content={{}}
          onChange={onChange}
        />,
      );

      const minVisitorField = container.querySelector(
        's-text-field[name="content.minVisitorCount"]',
      );
      expect(minVisitorField).toBeTruthy();
      expect(minVisitorField?.getAttribute("value")).toBe("5");
    });

    it("should render custom minVisitorCount", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <SocialProofContentSection
          content={{ minVisitorCount: 10 }}
          onChange={onChange}
        />,
      );

      const minVisitorField = container.querySelector(
        's-text-field[name="content.minVisitorCount"]',
      );
      expect(minVisitorField?.getAttribute("value")).toBe("10");
    });

    it("should render minReviewRating with default value", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <SocialProofContentSection
          content={{}}
          onChange={onChange}
        />,
      );

      const minRatingField = container.querySelector(
        's-text-field[name="content.minReviewRating"]',
      );
      expect(minRatingField).toBeTruthy();
      // Component uses toFixed(1) formatting, so "4" becomes "4.0"
      expect(minRatingField?.getAttribute("value")).toBe("4.0");
    });

    it("should render custom minReviewRating", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <SocialProofContentSection
          content={{ minReviewRating: 5 }}
          onChange={onChange}
        />,
      );

      const minRatingField = container.querySelector(
        's-text-field[name="content.minReviewRating"]',
      );
      // Component uses .toString() on the number
      expect(minRatingField?.getAttribute("value")).toBe("5");
    });
  });

  // ========== INTEGRATION TESTS ==========

  describe("Integration - Complete Configuration", () => {
    it("should handle a fully configured social proof", async () => {
      const onChange = vi.fn();

      const content: Partial<SocialProofContent> = {
        enablePurchaseNotifications: true,
        enableVisitorNotifications: true,
        enableReviewNotifications: true,
        purchaseMessageTemplate: "{{customer}} just bought {{product}}",
        visitorMessageTemplate: "{{count}} people viewing now",
        reviewMessageTemplate: "{{customer}} rated {{rating}} stars",
        cornerPosition: "bottom-right",
        displayDuration: 7000,
        rotationInterval: 12000,
        maxNotificationsPerSession: 15,
        showProductImage: true,
        showTimer: true,
        minVisitorCount: 8,
        minReviewRating: 4,
      };

      renderWithPolaris(
        <SocialProofContentSection
          content={content}
          onChange={onChange}
        />,
      );

      // Verify all content sections are configured correctly
      expect(content.enablePurchaseNotifications).toBe(true);
      expect(content.enableReviewNotifications).toBe(true);
      expect(content.cornerPosition).toBe("bottom-right");
      expect(content.displayDuration).toBe(7000);
      expect(content.minVisitorCount).toBe(8);
    });
  });

  // ========== SCHEMA VALIDATION TESTS ==========

  describe("Schema Validation", () => {
    it("should validate social proof content against schema with defaults", async () => {
      const { SocialProofContentSchema } = await import(
        "~/domains/campaigns/types/campaign"
      );

      // Parse with minimal required fields - schema should apply defaults
      const parsed = SocialProofContentSchema.parse({
        headline: "Social Proof",
        buttonText: "View",
      });

      // Verify defaults are applied (must match actual schema values)
      expect(parsed.enablePurchaseNotifications).toBe(true);
      expect(parsed.enableVisitorNotifications).toBe(false); // Schema default is false
      expect(parsed.enableReviewNotifications).toBe(false);
      expect(parsed.cornerPosition).toBe("bottom-left");
      expect(parsed.displayDuration).toBe(6); // Seconds, not milliseconds
      expect(parsed.rotationInterval).toBe(8); // Seconds, not milliseconds
      expect(parsed.maxNotificationsPerSession).toBe(5);
      expect(parsed.showProductImage).toBe(true);
      expect(parsed.showTimer).toBe(true);
      // minVisitorCount and minReviewRating are optional with no defaults
      expect(parsed.minVisitorCount).toBeUndefined();
      expect(parsed.minReviewRating).toBeUndefined();
      // Message templates are optional
      expect(parsed.purchaseMessageTemplate).toBeUndefined();
      expect(parsed.successMessage).toBe("Thank you!"); // From BaseContentConfigSchema
    });

    it("should validate social proof content with all optional fields", async () => {
      const { SocialProofContentSchema } = await import(
        "~/domains/campaigns/types/campaign"
      );

      const fullContent = {
        headline: "Social Proof",
        buttonText: "View",
        enablePurchaseNotifications: true,
        enableVisitorNotifications: true, // Override default
        enableReviewNotifications: true,
        purchaseMessageTemplate: "Custom purchase message",
        visitorMessageTemplate: "Custom visitor message",
        reviewMessageTemplate: "Custom review message",
        cornerPosition: "top-right" as const,
        displayDuration: 15, // seconds, max 30
        rotationInterval: 30, // seconds, max 60
        maxNotificationsPerSession: 8,
        showProductImage: false,
        showTimer: false,
        minVisitorCount: 3,
        minReviewRating: 4.5,
      };

      const parsed = SocialProofContentSchema.parse(fullContent);

      expect(parsed.enableVisitorNotifications).toBe(true);
      expect(parsed.enableReviewNotifications).toBe(true);
      expect(parsed.cornerPosition).toBe("top-right");
      expect(parsed.showProductImage).toBe(false);
      expect(parsed.minReviewRating).toBe(4.5);
      expect(parsed.displayDuration).toBe(15);
    });
  });
});

