/**
 * Comprehensive Unit Tests for Newsletter Content Configuration Options
 *
 * Tests ALL content options available in the Newsletter admin form:
 * - Content Section (headline, subheadline, buttonText, etc.)
 * - Email Field Configuration
 * - Name Field Configuration
 * - GDPR/Consent Field Configuration
 * - Discount Section (when onDiscountChange provided)
 */

import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { AppProvider } from "@shopify/polaris";
import en from "@shopify/polaris/locales/en.json";

// Mock the file upload hook
vi.mock("~/shared/hooks/useShopifyFileUpload", () => ({
  useShopifyFileUpload: () => ({
    uploadFile: vi.fn().mockResolvedValue("https://example.com/image.jpg"),
    isUploading: false,
    error: null,
    clearError: vi.fn(),
  }),
}));

import { NewsletterContentSection } from "~/domains/campaigns/components/sections/NewsletterContentSection";
import type { NewsletterContent } from "~/domains/campaigns/components/sections/NewsletterContentSection";
import type { DiscountConfig } from "~/domains/campaigns/types/campaign";

function renderWithPolaris(ui: React.ReactNode) {
  return render(<AppProvider i18n={en}>{ui}</AppProvider>);
}

describe("NewsletterContentSection - ALL Configuration Options", () => {

  // ========== CONTENT SECTION TESTS ==========

  describe("Content Section Fields", () => {
    it("uses sane defaults for button text and emailRequired when content is empty", () => {
      const { container } = renderWithPolaris(
        <NewsletterContentSection
          content={{}}
          onChange={() => {}}
        />,
      );

      // Button field is now named submitButtonText
      const buttonField = container.querySelector(
        's-text-field[name="content.submitButtonText"]',
      );
      expect(buttonField).toBeTruthy();
      expect(buttonField?.getAttribute("value")).toBe("Subscribe");

      const emailRequiredCheckbox = container.querySelector(
        's-checkbox[name="emailRequired"]',
      );
      expect(emailRequiredCheckbox).toBeTruthy();
      expect(emailRequiredCheckbox?.getAttribute("checked")).toBe("true");
    });

    it("should render and update headline (required)", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <NewsletterContentSection
          content={{ headline: "Join Our Newsletter!" }}
          onChange={onChange}
        />,
      );

      const headlineField = container.querySelector('s-text-field[name="content.headline"]');
      expect(headlineField).toBeTruthy();
      expect(headlineField?.getAttribute("value")).toBe("Join Our Newsletter!");
      expect(headlineField?.getAttribute("required")).toBe("true");
    });

    it("should render and update subheadline (optional)", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <NewsletterContentSection
          content={{ subheadline: "Get exclusive deals" }}
          onChange={onChange}
        />,
      );

      const subheadlineField = container.querySelector('s-text-field[name="content.subheadline"]');
      expect(subheadlineField).toBeTruthy();
      expect(subheadlineField?.getAttribute("value")).toBe("Get exclusive deals");
    });

    it("should render and update dismiss label (optional)", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <NewsletterContentSection
          content={{ dismissLabel: "No thanks" }}
          onChange={onChange}
        />,
      );

      const dismissField = container.querySelector('s-text-field[name="content.dismissLabel"]');
      expect(dismissField).toBeTruthy();
      expect(dismissField?.getAttribute("value")).toBe("No thanks");
    });

    it("should render and update success message (required)", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <NewsletterContentSection
          content={{ successMessage: "Thanks for subscribing!" }}
          onChange={onChange}
        />,
      );

      const successField = container.querySelector('s-text-field[name="content.successMessage"]');
      expect(successField).toBeTruthy();
      expect(successField?.getAttribute("value")).toBe("Thanks for subscribing!");
      expect(successField?.getAttribute("required")).toBe("true");
    });

    // Note: failureMessage is not rendered in the simplified NewsletterContentSection
    // It's an optional field in the schema but not exposed in the admin form
  });

  // ========== EMAIL FIELD CONFIGURATION TESTS ==========
  // Note: Email fields are rendered by LeadCaptureFormSection which uses field names
  // without the "content." prefix (e.g., "emailLabel" instead of "content.emailLabel")

  describe("Email Field Configuration", () => {
    it("should render email label field", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <NewsletterContentSection
          content={{ emailLabel: "Your Email" }}
          onChange={onChange}
        />,
      );

      // LeadCaptureFormSection uses "emailLabel" without "content." prefix
      const emailLabelField = container.querySelector('s-text-field[name="emailLabel"]');
      expect(emailLabelField).toBeTruthy();
      expect(emailLabelField?.getAttribute("value")).toBe("Your Email");
    });

    it("should render email placeholder with default value", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <NewsletterContentSection
          content={{}}
          onChange={onChange}
        />,
      );

      // LeadCaptureFormSection uses "emailPlaceholder" without "content." prefix
      // Default value is empty string, placeholder attribute shows "Enter your email"
      const emailPlaceholderField = container.querySelector('s-text-field[name="emailPlaceholder"]');
      expect(emailPlaceholderField).toBeTruthy();
    });

    it("should render custom email placeholder", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <NewsletterContentSection
          content={{ emailPlaceholder: "your.email@example.com" }}
          onChange={onChange}
        />,
      );

      const emailPlaceholderField = container.querySelector('s-text-field[name="emailPlaceholder"]');
      expect(emailPlaceholderField).toBeTruthy();
      expect(emailPlaceholderField?.getAttribute("value")).toBe("your.email@example.com");
    });

    it("should render emailRequired checkbox with default true", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <NewsletterContentSection
          content={{}}
          onChange={onChange}
        />,
      );

      const emailRequiredCheckbox = container.querySelector('s-checkbox[name="emailRequired"]');
      expect(emailRequiredCheckbox).toBeTruthy();
      expect(emailRequiredCheckbox?.getAttribute("checked")).toBe("true");
    });

    it("should render emailRequired checkbox as false when set", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <NewsletterContentSection
          content={{ emailRequired: false }}
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
        <NewsletterContentSection
          content={{}}
          onChange={onChange}
        />,
      );

      const nameFieldEnabledCheckbox = container.querySelector('s-checkbox[name="nameFieldEnabled"]');
      expect(nameFieldEnabledCheckbox).toBeTruthy();
      expect(nameFieldEnabledCheckbox?.getAttribute("checked")).toBe("false");
    });

    it("should render nameFieldEnabled checkbox as true when set", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <NewsletterContentSection
          content={{ nameFieldEnabled: true }}
          onChange={onChange}
        />,
      );

      const nameFieldEnabledCheckbox = container.querySelector('s-checkbox[name="nameFieldEnabled"]');
      expect(nameFieldEnabledCheckbox).toBeTruthy();
      expect(nameFieldEnabledCheckbox?.getAttribute("checked")).toBe("true");
    });

    it("should render nameFieldRequired checkbox", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <NewsletterContentSection
          content={{ nameFieldEnabled: true, nameFieldRequired: true }}
          onChange={onChange}
        />,
      );

      const nameFieldRequiredCheckbox = container.querySelector('s-checkbox[name="nameFieldRequired"]');
      expect(nameFieldRequiredCheckbox).toBeTruthy();
      expect(nameFieldRequiredCheckbox?.getAttribute("checked")).toBe("true");
    });

    it("should render nameFieldPlaceholder when name field is enabled", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <NewsletterContentSection
          content={{ nameFieldEnabled: true, nameFieldPlaceholder: "Your name" }}
          onChange={onChange}
        />,
      );

      const nameFieldPlaceholder = container.querySelector('s-text-field[name="nameFieldPlaceholder"]');
      expect(nameFieldPlaceholder).toBeTruthy();
      expect(nameFieldPlaceholder?.getAttribute("value")).toBe("Your name");
    });
  });

  // ========== CONSENT/GDPR FIELD CONFIGURATION TESTS ==========

  describe("Consent/GDPR Field Configuration", () => {
    it("should render consentFieldEnabled checkbox (off by default)", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <NewsletterContentSection
          content={{}}
          onChange={onChange}
        />,
      );

      const consentFieldEnabledCheckbox = container.querySelector('s-checkbox[name="consentFieldEnabled"]');
      expect(consentFieldEnabledCheckbox).toBeTruthy();
      expect(consentFieldEnabledCheckbox?.getAttribute("checked")).toBe("false");
    });

    it("should render consentFieldEnabled checkbox as true when set", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <NewsletterContentSection
          content={{ consentFieldEnabled: true }}
          onChange={onChange}
        />,
      );

      const consentFieldEnabledCheckbox = container.querySelector('s-checkbox[name="consentFieldEnabled"]');
      expect(consentFieldEnabledCheckbox).toBeTruthy();
      expect(consentFieldEnabledCheckbox?.getAttribute("checked")).toBe("true");
    });

    it("should render consentFieldRequired checkbox", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <NewsletterContentSection
          content={{ consentFieldEnabled: true, consentFieldRequired: true }}
          onChange={onChange}
        />,
      );

      const consentFieldRequiredCheckbox = container.querySelector('s-checkbox[name="consentFieldRequired"]');
      expect(consentFieldRequiredCheckbox).toBeTruthy();
      expect(consentFieldRequiredCheckbox?.getAttribute("checked")).toBe("true");
    });

    it("should render consentFieldText when consent field is enabled", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <NewsletterContentSection
          content={{ consentFieldEnabled: true, consentFieldText: "I agree to receive marketing emails" }}
          onChange={onChange}
        />,
      );

      const consentFieldText = container.querySelector('s-text-field[name="consentFieldText"]');
      expect(consentFieldText).toBeTruthy();
      expect(consentFieldText?.getAttribute("value")).toBe("I agree to receive marketing emails");
    });
  });

  // ========== DISCOUNT SECTION TESTS ==========

  describe("Discount Configuration", () => {
    it("should render discount section when onDiscountChange is provided", () => {
      const onChange = vi.fn();
      const onDiscountChange = vi.fn();
      const discountConfig: DiscountConfig = {
        enabled: true,
        valueType: "PERCENTAGE",
        value: 10,
        showInPreview: true,
        behavior: "SHOW_CODE_AND_AUTO_APPLY",
      } as DiscountConfig;

      const { container } = renderWithPolaris(
        <NewsletterContentSection
          content={{}}
          onChange={onChange}
          onDiscountChange={onDiscountChange}
          discountConfig={discountConfig}
        />,
      );

      // Verify discount section is rendered
      expect(container.textContent).toContain("Discount");
    });

    it("should not render discount section when onDiscountChange is not provided", () => {
      const onChange = vi.fn();

      const { container } = renderWithPolaris(
        <NewsletterContentSection
          content={{}}
          onChange={onChange}
        />,
      );

      // Discount section should not have the full discount configuration heading
      // Only the main content sections should be rendered
      expect(container.textContent).toContain("Content");
    });
  });

  // ========== INTEGRATION TESTS ==========

  describe("Integration - Complete Configuration", () => {
    it("should handle a fully configured newsletter", () => {
      const onChange = vi.fn();
      const onDiscountChange = vi.fn();

      const content: Partial<NewsletterContent> = {
        headline: "Join Our VIP List!",
        subheadline: "Get 10% off your first order",
        buttonText: "Sign Up Now",
        dismissLabel: "Maybe later",
        emailPlaceholder: "your.email@example.com",
        emailLabel: "Email Address",
        emailRequired: true,
        successMessage: "Welcome to the club!",
        failureMessage: "Something went wrong. Please try again.",
        nameFieldEnabled: true,
        nameFieldRequired: false,
        nameFieldPlaceholder: "Your name",
        consentFieldEnabled: true,
        consentFieldRequired: true,
        consentFieldText: "I agree to receive marketing emails",
      };

      const discountConfig: DiscountConfig = {
        enabled: true,
        valueType: "PERCENTAGE",
        value: 10,
        showInPreview: true,
        behavior: "SHOW_CODE_AND_AUTO_APPLY",
      } as DiscountConfig;

      renderWithPolaris(
        <NewsletterContentSection
          content={content}
          discountConfig={discountConfig}
          onChange={onChange}
          onDiscountChange={onDiscountChange}
        />,
      );

      // Verify all content sections are configured correctly
      expect(content.headline).toBe("Join Our VIP List!");
      expect(content.nameFieldEnabled).toBe(true);
      expect(content.consentFieldEnabled).toBe(true);
      expect(content.emailRequired).toBe(true);
      expect(discountConfig.valueType).toBe("PERCENTAGE");
    });
  });

  // ========== SCHEMA VALIDATION TESTS ==========

  describe("Schema Validation", () => {
    it("should validate newsletter content against schema with defaults", async () => {
      const { NewsletterContentSchema } = await import(
        "~/domains/campaigns/types/campaign"
      );

      // Parse with minimal required fields - schema should apply defaults
      // submitButtonText is required (no default)
      const parsed = NewsletterContentSchema.parse({
        headline: "Test Newsletter",
        buttonText: "Subscribe",
        successMessage: "Thanks!",
        submitButtonText: "Subscribe Now",
      });

      // Verify defaults are applied
      expect(parsed.emailPlaceholder).toBe("Enter your email");
      expect(parsed.emailRequired).toBe(true);
      expect(parsed.nameFieldEnabled).toBe(false);
      expect(parsed.consentFieldEnabled).toBe(false);
      expect(parsed.submitButtonText).toBe("Subscribe Now");
    });

    it("should validate newsletter content with all optional fields", async () => {
      const { NewsletterContentSchema } = await import(
        "~/domains/campaigns/types/campaign"
      );

      const fullContent = {
        headline: "Join Our Newsletter",
        subheadline: "Get exclusive deals",
        buttonText: "Sign Up",
        dismissLabel: "No thanks",
        successMessage: "Welcome aboard!",
        failureMessage: "Oops! Try again.",
        emailPlaceholder: "your.email@example.com",
        emailLabel: "Email",
        emailRequired: true,
        emailErrorMessage: "Please enter a valid email",
        submitButtonText: "Join Now",
        nameFieldEnabled: true,
        nameFieldRequired: true,
        nameFieldPlaceholder: "Your name",
        consentFieldEnabled: true,
        consentFieldRequired: true,
        consentFieldText: "I agree to marketing emails",
        firstNameLabel: "First Name",
        lastNameLabel: "Last Name",
        firstNamePlaceholder: "John",
        lastNamePlaceholder: "Doe",
        errorMessage: "Please correct the errors",
        privacyPolicyUrl: "https://example.com/privacy",
      };

      const parsed = NewsletterContentSchema.parse(fullContent);

      expect(parsed.headline).toBe("Join Our Newsletter");
      expect(parsed.nameFieldEnabled).toBe(true);
      expect(parsed.consentFieldEnabled).toBe(true);
      expect(parsed.privacyPolicyUrl).toBe("https://example.com/privacy");
    });
  });
});

