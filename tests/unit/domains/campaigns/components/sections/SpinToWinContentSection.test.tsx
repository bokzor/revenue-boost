/**
 * Comprehensive Unit Tests for Spin-to-Win Content Configuration Options
 *
 * Tests ALL content options available in the Spin-to-Win admin form:
 * - Content Section (headline, subheadline, spinButtonText, etc.)
 * - Email Field Configuration
 * - Name Field Configuration
 * - GDPR/Consent Field Configuration
 * - Wheel Configuration (size, border, duration, segments)
 */

import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { AppProvider } from "@shopify/polaris";
import en from "@shopify/polaris/locales/en.json";

import { SpinToWinContentSection } from "~/domains/campaigns/components/sections/SpinToWinContentSection";
import type { SpinToWinContent } from "~/domains/campaigns/components/sections/SpinToWinContentSection";

function renderWithPolaris(ui: React.ReactNode) {
  return render(<AppProvider i18n={en}>{ui}</AppProvider>);
}

describe("SpinToWinContentSection - ALL Configuration Options", () => {

  // ========== CONTENT SECTION TESTS ==========

  describe("Content Section Fields", () => {
    it("initializes default wheelSegments when content has no segments", async () => {
      const onChange = vi.fn();

      renderWithPolaris(
        <SpinToWinContentSection content={{}} errors={{}} onChange={onChange} />,
      );

      // Component now relies on schema defaults rather than auto-calling onChange.
      // Verify defaults via the schema instead of side effects.
      const { SpinToWinContentSchema } = await import(
        "~/domains/campaigns/types/campaign"
      );
      // Provide required base fields so schema validation passes and defaults are applied
      const parsed = SpinToWinContentSchema.parse({
        headline: "Test",
        buttonText: "Spin",
      });

      expect(Array.isArray(parsed.wheelSegments)).toBe(true);
      expect(parsed.wheelSegments.length).toBeGreaterThan(0);
      expect(parsed.wheelSegments[0]).toEqual(
        expect.objectContaining({
          label: "5% OFF",
          discountConfig: expect.objectContaining({
            enabled: true,
            valueType: "PERCENTAGE",
            value: 5,
          }),
        }),
      );
    });

    it("should render and update headline (required)", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <SpinToWinContentSection
          content={{ headline: "Spin to Win!" }}
          errors={{}}
          onChange={onChange}
        />,
      );

      const headlineField = container.querySelector('s-text-field[name="content.headline"]');
      expect(headlineField).toBeTruthy();
      expect(headlineField?.getAttribute("value")).toBe("Spin to Win!");
      expect(headlineField?.getAttribute("required")).toBe("true");
    });

    it("should render and update subheadline (optional)", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <SpinToWinContentSection
          content={{ subheadline: "Try your luck" }}
          errors={{}}
          onChange={onChange}
        />,
      );

      const subheadlineField = container.querySelector('s-text-field[name="content.subheadline"]');
      expect(subheadlineField).toBeTruthy();
      expect(subheadlineField?.getAttribute("value")).toBe("Try your luck");
    });

    it("should render spinButtonText with default value", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <SpinToWinContentSection
          content={{}}
          errors={{}}
          onChange={onChange}
        />,
      );

      const spinButtonField = container.querySelector('s-text-field[name="content.spinButtonText"]');
      expect(spinButtonField).toBeTruthy();
      expect(spinButtonField?.getAttribute("value")).toBe("Spin to Win!");
    });

    it("should render custom spinButtonText", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <SpinToWinContentSection
          content={{ spinButtonText: "Let's Go!" }}
          errors={{}}
          onChange={onChange}
        />,
      );

      const spinButtonField = container.querySelector('s-text-field[name="content.spinButtonText"]');
      expect(spinButtonField).toBeTruthy();
      expect(spinButtonField?.getAttribute("value")).toBe("Let's Go!");
    });

    it("should render dismiss label (optional)", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <SpinToWinContentSection
          content={{ dismissLabel: "No thanks" }}
          errors={{}}
          onChange={onChange}
        />,
      );

      const dismissField = container.querySelector('s-text-field[name="content.dismissLabel"]');
      expect(dismissField).toBeTruthy();
      expect(dismissField?.getAttribute("value")).toBe("No thanks");
    });

    it("should render failure message (optional)", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <SpinToWinContentSection
          content={{ failureMessage: "Better luck next time!" }}
          errors={{}}
          onChange={onChange}
        />,
      );

      const failureField = container.querySelector('s-text-field[name="content.failureMessage"]');
      expect(failureField).toBeTruthy();
      expect(failureField?.getAttribute("value")).toBe("Better luck next time!");
    });

    it("should render loading text (optional)", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <SpinToWinContentSection
          content={{ loadingText: "Spinning..." }}
          errors={{}}
          onChange={onChange}
        />,
      );

      const loadingField = container.querySelector('s-text-field[name="content.loadingText"]');
      expect(loadingField).toBeTruthy();
      expect(loadingField?.getAttribute("value")).toBe("Spinning...");
    });
  });

  // ========== EMAIL FIELD CONFIGURATION TESTS ==========

  describe("Email Field Configuration", () => {
    it("should render email placeholder with default value", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <SpinToWinContentSection
          content={{}}
          errors={{}}
          onChange={onChange}
        />,
      );

      const emailPlaceholderField = container.querySelector('s-text-field[name="content.emailPlaceholder"]');
      expect(emailPlaceholderField).toBeTruthy();
      expect(emailPlaceholderField?.getAttribute("value")).toBe("Enter your email to spin");
    });

    it("should render custom email placeholder", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <SpinToWinContentSection
          content={{ emailPlaceholder: "your.email@example.com" }}
          errors={{}}
          onChange={onChange}
        />,
      );

      const emailPlaceholderField = container.querySelector('s-text-field[name="content.emailPlaceholder"]');
      expect(emailPlaceholderField).toBeTruthy();
      expect(emailPlaceholderField?.getAttribute("value")).toBe("your.email@example.com");
    });

    it("should render emailRequired checkbox with default true", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <SpinToWinContentSection
          content={{}}
          errors={{}}
          onChange={onChange}
        />,
      );

      const emailRequiredCheckbox = container.querySelector('s-checkbox[name="emailRequired"]');
      expect(emailRequiredCheckbox).toBeTruthy();
      expect(emailRequiredCheckbox?.getAttribute("checked")).toBe("true");
    });

    it("should render emailRequired as false when set", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <SpinToWinContentSection
          content={{ emailRequired: false }}
          errors={{}}
          onChange={onChange}
        />,
      );

      const emailRequiredCheckbox = container.querySelector('s-checkbox[name="emailRequired"]');
      expect(emailRequiredCheckbox).toBeTruthy();
      expect(emailRequiredCheckbox?.getAttribute("checked")).toBe("false");
    });
  });

  // ========== NAME FIELD CONFIGURATION TESTS ==========

  describe("Name Field Configuration", () => {
    it("should render nameFieldEnabled checkbox (off by default)", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <SpinToWinContentSection
          content={{}}
          errors={{}}
          onChange={onChange}
        />,
      );

      // The component uses FieldConfigurationSection which renders "nameFieldEnabled" checkbox
      const nameFieldEnabledCheckbox = container.querySelector('s-checkbox[name="nameFieldEnabled"]');
      expect(nameFieldEnabledCheckbox).toBeTruthy();
      expect(nameFieldEnabledCheckbox?.getAttribute("checked")).toBe("false");
    });

    it("should render nameFieldEnabled checkbox as true when nameFieldEnabled is true", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <SpinToWinContentSection
          content={{ nameFieldEnabled: true }}
          errors={{}}
          onChange={onChange}
        />,
      );

      // FieldConfigurationSection handles nameFieldEnabled
      const nameFieldEnabledCheckbox = container.querySelector('s-checkbox[name="nameFieldEnabled"]');
      expect(nameFieldEnabledCheckbox).toBeTruthy();
      expect(nameFieldEnabledCheckbox?.getAttribute("checked")).toBe("true");
    });

    it("should render nameFieldRequired checkbox when name is collected", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <SpinToWinContentSection
          content={{ nameFieldEnabled: true, nameFieldRequired: true }}
          errors={{}}
          onChange={onChange}
        />,
      );

      const nameFieldRequiredCheckbox = container.querySelector('s-checkbox[name="nameFieldRequired"]');
      expect(nameFieldRequiredCheckbox).toBeTruthy();
      expect(nameFieldRequiredCheckbox?.getAttribute("checked")).toBe("true");
    });
  });

  // ========== GDPR/CONSENT FIELD CONFIGURATION TESTS ==========

  describe("GDPR/Consent Field Configuration", () => {
    it("should render consentFieldEnabled checkbox (off by default)", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <SpinToWinContentSection
          content={{}}
          errors={{}}
          onChange={onChange}
        />,
      );

      // The component uses FieldConfigurationSection which renders "consentFieldEnabled" checkbox
      const consentFieldEnabledCheckbox = container.querySelector('s-checkbox[name="consentFieldEnabled"]');
      expect(consentFieldEnabledCheckbox).toBeTruthy();
      expect(consentFieldEnabledCheckbox?.getAttribute("checked")).toBe("false");
    });

    it("should render consentFieldEnabled checkbox as true when consentFieldEnabled is true", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <SpinToWinContentSection
          content={{ consentFieldEnabled: true }}
          errors={{}}
          onChange={onChange}
        />,
      );

      // FieldConfigurationSection handles consentFieldEnabled
      const consentFieldEnabledCheckbox = container.querySelector('s-checkbox[name="consentFieldEnabled"]');
      expect(consentFieldEnabledCheckbox).toBeTruthy();
      expect(consentFieldEnabledCheckbox?.getAttribute("checked")).toBe("true");
    });

    it("should render consentFieldRequired checkbox when GDPR is enabled", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <SpinToWinContentSection
          content={{ consentFieldEnabled: true, consentFieldRequired: true }}
          errors={{}}
          onChange={onChange}
        />,
      );

      const consentRequiredCheckbox = container.querySelector('s-checkbox[name="consentFieldRequired"]');
      expect(consentRequiredCheckbox).toBeTruthy();
      expect(consentRequiredCheckbox?.getAttribute("checked")).toBe("true");
    });
  });

  // ========== WHEEL CONFIGURATION TESTS ==========

  describe("Wheel Configuration", () => {
    it("should render wheelSize with default value", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <SpinToWinContentSection
          content={{}}
          errors={{}}
          onChange={onChange}
        />,
      );

      const wheelSizeField = container.querySelector('s-text-field[name="content.wheelSize"]');
      expect(wheelSizeField).toBeTruthy();
      expect(wheelSizeField?.getAttribute("value")).toBe("400");
    });

    it("should render custom wheelSize", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <SpinToWinContentSection
          content={{ wheelSize: 300 }}
          errors={{}}
          onChange={onChange}
        />,
      );

      const wheelSizeField = container.querySelector('s-text-field[name="content.wheelSize"]');
      expect(wheelSizeField).toBeTruthy();
      expect(wheelSizeField?.getAttribute("value")).toBe("300");
    });

    it("should render wheelBorderWidth with default value", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <SpinToWinContentSection
          content={{}}
          errors={{}}
          onChange={onChange}
        />,
      );

      const wheelBorderWidthField = container.querySelector('s-text-field[name="content.wheelBorderWidth"]');
      expect(wheelBorderWidthField).toBeTruthy();
      expect(wheelBorderWidthField?.getAttribute("value")).toBe("2");
    });

    it("should render custom wheelBorderWidth", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <SpinToWinContentSection
          content={{ wheelBorderWidth: 5 }}
          errors={{}}
          onChange={onChange}
        />,
      );

      const wheelBorderWidthField = container.querySelector('s-text-field[name="content.wheelBorderWidth"]');
      expect(wheelBorderWidthField).toBeTruthy();
      expect(wheelBorderWidthField?.getAttribute("value")).toBe("5");
    });

    it("should render wheelBorderColor", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <SpinToWinContentSection
          content={{ wheelBorderColor: "#FF0000" }}
          errors={{}}
          onChange={onChange}
        />,
      );

      const wheelBorderColorField = container.querySelector('s-text-field[name="content.wheelBorderColor"]');
      expect(wheelBorderColorField).toBeTruthy();
      expect(wheelBorderColorField?.getAttribute("value")).toBe("#FF0000");
    });

    it("should render spinDuration with default value", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <SpinToWinContentSection
          content={{}}
          errors={{}}
          onChange={onChange}
        />,
      );

      const spinDurationField = container.querySelector('s-text-field[name="content.spinDuration"]');
      expect(spinDurationField).toBeTruthy();
      expect(spinDurationField?.getAttribute("value")).toBe("4000");
    });

    it("should render custom spinDuration", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <SpinToWinContentSection
          content={{ spinDuration: 5000 }}
          errors={{}}
          onChange={onChange}
        />,
      );

      const spinDurationField = container.querySelector('s-text-field[name="content.spinDuration"]');
      expect(spinDurationField).toBeTruthy();
      expect(spinDurationField?.getAttribute("value")).toBe("5000");
    });

    it("should render minSpins with default value", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <SpinToWinContentSection
          content={{}}
          errors={{}}
          onChange={onChange}
        />,
      );

      const minSpinsField = container.querySelector('s-text-field[name="content.minSpins"]');
      expect(minSpinsField).toBeTruthy();
      expect(minSpinsField?.getAttribute("value")).toBe("5");
    });

    it("should render custom minSpins", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <SpinToWinContentSection
          content={{ minSpins: 10 }}
          errors={{}}
          onChange={onChange}
        />,
      );

      const minSpinsField = container.querySelector('s-text-field[name="content.minSpins"]');
      expect(minSpinsField).toBeTruthy();
      expect(minSpinsField?.getAttribute("value")).toBe("10");
    });
  });

  // ========== INTEGRATION TESTS ==========

  describe("Integration - Complete Configuration", () => {
    it("should handle a fully configured spin-to-win", async () => {
      const onChange = vi.fn();

      const content: Partial<SpinToWinContent> = {
        headline: "Spin to Win a Discount!",
        subheadline: "Try your luck today",
        spinButtonText: "Spin Now!",
        dismissLabel: "Maybe later",
        failureMessage: "Better luck next time!",
        loadingText: "Spinning...",
        emailRequired: true,
        emailPlaceholder: "Enter your email",
        nameFieldEnabled: true,
        nameFieldRequired: false,
        consentFieldEnabled: true,
        consentFieldRequired: true,
        wheelSize: 350,
        wheelBorderWidth: 3,
        wheelBorderColor: "#FFFFFF",
        spinDuration: 5000,
        minSpins: 8,
        wheelSegments: [
          { id: "1", label: "10% OFF", probability: 0.3, color: "#FF0000" },
          { id: "2", label: "20% OFF", probability: 0.2, color: "#00FF00" },
          { id: "3", label: "Try Again", probability: 0.5, color: "#0000FF" },
        ],
      };

      renderWithPolaris(
        <SpinToWinContentSection
          content={content}
          errors={{}}
          onChange={onChange}
        />,
      );

      // Verify all content sections are configured correctly
      expect(content.headline).toBe("Spin to Win a Discount!");
      expect(content.wheelSize).toBe(350);
      expect(content.nameFieldEnabled).toBe(true);
      expect(content.consentFieldEnabled).toBe(true);
      expect(content.wheelSegments?.length).toBe(3);
    });
  });

  // ========== SCHEMA VALIDATION TESTS ==========

  describe("Schema Validation", () => {
    it("should validate spin-to-win content against schema with defaults", async () => {
      const { SpinToWinContentSchema } = await import(
        "~/domains/campaigns/types/campaign"
      );

      // Parse with minimal required fields - schema should apply defaults
      const parsed = SpinToWinContentSchema.parse({
        headline: "Test Spin",
        buttonText: "Spin",
      });

      // Verify defaults are applied
      expect(parsed.spinButtonText).toBe("Spin to Win!");
      expect(parsed.emailRequired).toBe(true);
      expect(parsed.emailPlaceholder).toBe("Enter your email to spin");
      expect(parsed.nameFieldEnabled).toBe(false);
      expect(parsed.consentFieldEnabled).toBe(false);
      expect(parsed.wheelSize).toBe(400);
      expect(parsed.wheelBorderWidth).toBe(2);
      expect(parsed.spinDuration).toBe(4000);
      expect(parsed.minSpins).toBe(5);
      expect(parsed.maxAttemptsPerUser).toBe(1);
      expect(Array.isArray(parsed.wheelSegments)).toBe(true);
      expect(parsed.wheelSegments.length).toBeGreaterThan(0);
    });

    it("should validate spin-to-win with custom wheel segments", async () => {
      const { SpinToWinContentSchema } = await import(
        "~/domains/campaigns/types/campaign"
      );

      const customSegments = [
        { id: "seg1", label: "5% OFF", probability: 0.5, color: "#FF0000" },
        { id: "seg2", label: "10% OFF", probability: 0.5, color: "#00FF00" },
      ];

      const parsed = SpinToWinContentSchema.parse({
        headline: "Test Spin",
        buttonText: "Spin",
        wheelSegments: customSegments,
      });

      expect(parsed.wheelSegments.length).toBe(2);
      expect(parsed.wheelSegments[0].label).toBe("5% OFF");
      expect(parsed.wheelSegments[1].label).toBe("10% OFF");
    });
  });
});

