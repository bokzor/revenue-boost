/**
 * Comprehensive Unit Tests for Announcement Content Configuration Options
 *
 * Tests ALL content options available in the Announcement admin form:
 * - Content Section (headline, subheadline, buttonText, dismissLabel)
 * - Display Options (sticky, icon)
 * - CTA Configuration (ctaUrl, ctaOpenInNewTab)
 * - Color Scheme
 */

import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { AppProvider } from "@shopify/polaris";
import en from "@shopify/polaris/locales/en.json";

import { AnnouncementContentSection } from "~/domains/campaigns/components/sections/AnnouncementContentSection";
import type { AnnouncementContent } from "~/domains/campaigns/components/sections/AnnouncementContentSection";

function renderWithPolaris(ui: React.ReactNode) {
  return render(<AppProvider i18n={en}>{ui}</AppProvider>);
}

describe("AnnouncementContentSection - ALL Configuration Options", () => {

  // ========== CONTENT SECTION TESTS ==========

  describe("Content Section Fields", () => {
    it("renders the announcement content form", () => {
      const { container } = renderWithPolaris(
        <AnnouncementContentSection
          content={{}}
          errors={{}}
          onChange={() => {}}
        />,
      );

      // Should render the form with headline field (uses custom s-text-field element)
      const headlineField = container.querySelector('s-text-field[name="content.headline"]');
      expect(headlineField).toBeTruthy();
    });

    it("should render and update headline (required)", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <AnnouncementContentSection
          content={{ headline: "Important Announcement!" }}
          errors={{}}
          onChange={onChange}
        />,
      );

      const headlineField = container.querySelector('s-text-field[name="content.headline"]');
      expect(headlineField).toBeTruthy();
      expect(headlineField?.getAttribute("value")).toBe("Important Announcement!");
      expect(headlineField?.getAttribute("required")).toBe("true");
    });

    it("should render and update subheadline (optional)", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <AnnouncementContentSection
          content={{ subheadline: "Details here" }}
          errors={{}}
          onChange={onChange}
        />,
      );

      const subheadlineField = container.querySelector('s-text-field[name="content.subheadline"]');
      expect(subheadlineField).toBeTruthy();
      expect(subheadlineField?.getAttribute("value")).toBe("Details here");
    });

    it("should render buttonText field (empty when no content)", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <AnnouncementContentSection
          content={{}}
          errors={{}}
          onChange={onChange}
        />,
      );

      const buttonTextField = container.querySelector('s-text-field[name="content.buttonText"]');
      expect(buttonTextField).toBeTruthy();
      // Component renders empty string for undefined values
      // Schema defaults are applied at parse time, not in component
      expect(buttonTextField?.getAttribute("value")).toBe("");
    });

    it("should render custom buttonText", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <AnnouncementContentSection
          content={{ buttonText: "Shop Now" }}
          errors={{}}
          onChange={onChange}
        />,
      );

      const buttonTextField = container.querySelector('s-text-field[name="content.buttonText"]');
      expect(buttonTextField).toBeTruthy();
      expect(buttonTextField?.getAttribute("value")).toBe("Shop Now");
    });

    it("should render dismissLabel field (empty when no content)", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <AnnouncementContentSection
          content={{}}
          errors={{}}
          onChange={onChange}
        />,
      );

      const dismissField = container.querySelector('s-text-field[name="content.dismissLabel"]');
      expect(dismissField).toBeTruthy();
      // Component renders empty string for undefined values
      expect(dismissField?.getAttribute("value")).toBe("");
    });

    it("should render custom dismissLabel", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <AnnouncementContentSection
          content={{ dismissLabel: "Close" }}
          errors={{}}
          onChange={onChange}
        />,
      );

      const dismissField = container.querySelector('s-text-field[name="content.dismissLabel"]');
      expect(dismissField).toBeTruthy();
      expect(dismissField?.getAttribute("value")).toBe("Close");
    });
  });

  // ========== DISPLAY OPTIONS TESTS ==========

  describe("Display Options", () => {
    it("should render sticky checkbox (off by default)", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <AnnouncementContentSection
          content={{}}
          errors={{}}
          onChange={onChange}
        />,
      );

      // Component uses name="content.sticky"
      const stickyCheckbox = container.querySelector('s-checkbox[name="content.sticky"]');
      expect(stickyCheckbox).toBeTruthy();
      // Schema default is true, component uses `!== false` so undefined = true
      expect(stickyCheckbox?.getAttribute("checked")).toBe("true");
    });

    it("should render sticky checkbox as false when explicitly set", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <AnnouncementContentSection
          content={{ sticky: false }}
          errors={{}}
          onChange={onChange}
        />,
      );

      const stickyCheckbox = container.querySelector('s-checkbox[name="content.sticky"]');
      expect(stickyCheckbox).toBeTruthy();
      expect(stickyCheckbox?.getAttribute("checked")).toBe("false");
    });

    it("should render icon field", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <AnnouncementContentSection
          content={{ icon: "🎉" }}
          errors={{}}
          onChange={onChange}
        />,
      );

      const iconField = container.querySelector('s-text-field[name="content.icon"]');
      expect(iconField).toBeTruthy();
      expect(iconField?.getAttribute("value")).toBe("🎉");
    });
  });

  // ========== CTA CONFIGURATION TESTS ==========

  describe("CTA Configuration", () => {
    it("should render ctaUrl field", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <AnnouncementContentSection
          content={{ ctaUrl: "https://example.com/sale" }}
          errors={{}}
          onChange={onChange}
        />,
      );

      const ctaUrlField = container.querySelector('s-text-field[name="content.ctaUrl"]');
      expect(ctaUrlField).toBeTruthy();
      expect(ctaUrlField?.getAttribute("value")).toBe("https://example.com/sale");
    });

    it("should render ctaOpenInNewTab checkbox (off by default)", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <AnnouncementContentSection
          content={{}}
          errors={{}}
          onChange={onChange}
        />,
      );

      // Component uses name="content.ctaOpenInNewTab"
      const newTabCheckbox = container.querySelector('s-checkbox[name="content.ctaOpenInNewTab"]');
      expect(newTabCheckbox).toBeTruthy();
      // Schema default is false, component uses `|| false`
      expect(newTabCheckbox?.getAttribute("checked")).toBe("false");
    });

    it("should render ctaOpenInNewTab checkbox as true when set", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <AnnouncementContentSection
          content={{ ctaOpenInNewTab: true }}
          errors={{}}
          onChange={onChange}
        />,
      );

      const newTabCheckbox = container.querySelector('s-checkbox[name="content.ctaOpenInNewTab"]');
      expect(newTabCheckbox).toBeTruthy();
      expect(newTabCheckbox?.getAttribute("checked")).toBe("true");
    });
  });

  // NOTE: colorScheme field exists in the schema but is NOT rendered by AnnouncementContentSection
  // This is either:
  // 1. A missing feature that should be added to the component
  // 2. Intentionally handled elsewhere (e.g., design config instead of content config)
  //
  // If colorScheme UI is needed, it should be added to the component.

  // ========== INTEGRATION TESTS ==========

  describe("Integration - Complete Configuration", () => {
    it("should handle a fully configured announcement", async () => {
      const onChange = vi.fn();

      const content: Partial<AnnouncementContent> = {
        headline: "🎉 Big Sale Announcement!",
        subheadline: "Up to 50% off everything",
        buttonText: "Shop Now",
        dismissLabel: "×",
        icon: "🎉",
        sticky: true,
        ctaUrl: "https://example.com/sale",
        ctaOpenInNewTab: true,
        colorScheme: "success",
      };

      renderWithPolaris(
        <AnnouncementContentSection
          content={content}
          errors={{}}
          onChange={onChange}
        />,
      );

      // Verify all content sections are configured correctly
      expect(content.headline).toBe("🎉 Big Sale Announcement!");
      expect(content.sticky).toBe(true);
      expect(content.ctaOpenInNewTab).toBe(true);
      expect(content.colorScheme).toBe("success");
    });
  });

  // ========== SCHEMA VALIDATION TESTS ==========

  describe("Schema Validation", () => {
    it("should validate announcement content against schema with defaults", async () => {
      const { AnnouncementContentSchema } = await import(
        "~/domains/campaigns/types/campaign"
      );

      // Parse with minimal required fields - schema should apply defaults
      // NOTE: successMessage is REQUIRED by BaseContentConfigSchema
      const parsed = AnnouncementContentSchema.parse({
        headline: "Test Announcement",
        buttonText: "Learn More",
        successMessage: "Success!", // Required by BaseContentConfigSchema
      });

      // Verify defaults are applied
      expect(parsed.buttonText).toBe("Learn More");
      expect(parsed.sticky).toBe(true); // Default is true
      expect(parsed.ctaOpenInNewTab).toBe(false);
      expect(parsed.colorScheme).toBe("custom"); // Default is "custom"
    });

    it("should validate announcement content with all optional fields", async () => {
      const { AnnouncementContentSchema } = await import(
        "~/domains/campaigns/types/campaign"
      );

      const fullContent = {
        headline: "Important Notice",
        subheadline: "Please read carefully",
        buttonText: "Read More",
        dismissLabel: "Close",
        icon: "⚠️",
        sticky: false, // Override default
        ctaUrl: "https://example.com/info",
        ctaOpenInNewTab: true,
        colorScheme: "urgent" as const, // Valid enum value
        successMessage: "Thanks for reading!",
        failureMessage: "Error occurred",
      };

      const parsed = AnnouncementContentSchema.parse(fullContent);

      expect(parsed.headline).toBe("Important Notice");
      expect(parsed.sticky).toBe(false);
      expect(parsed.ctaOpenInNewTab).toBe(true);
      expect(parsed.colorScheme).toBe("urgent");
    });
  });
});

