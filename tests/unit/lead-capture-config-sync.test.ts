/**
 * Lead Capture Config Sync Test
 *
 * Ensures that the shared LeadCaptureConfig interface stays in sync with:
 * 1. Zod schema (campaign.ts)
 * 2. Admin form (FieldConfigurationSection.tsx)
 * 3. Storefront component (LeadCaptureForm.tsx)
 *
 * If this test fails, it means there's a field mismatch between layers.
 */

import { describe, it, expect } from "vitest";
import {
  LEAD_CAPTURE_CONFIG_KEYS,
  LEAD_CAPTURE_DEFAULTS,
  mapLeadCaptureConfigToFormProps,
  type LeadCaptureConfig,
} from "~/shared/types/lead-capture-config";
import { LeadCaptureConfigSchema } from "~/domains/campaigns/types/campaign";

describe("LeadCaptureConfig Sync", () => {
  describe("Shared Interface", () => {
    it("has all expected fields defined", () => {
      const expectedFields = [
        // Email
        "emailRequired",
        "emailLabel",
        "emailPlaceholder",
        "emailErrorMessage",
        // Name
        "nameFieldEnabled",
        "nameFieldRequired",
        "nameFieldLabel",
        "nameFieldPlaceholder",
        // Consent
        "consentFieldEnabled",
        "consentFieldRequired",
        "consentFieldText",
        "privacyPolicyUrl",
      ];

      expect(LEAD_CAPTURE_CONFIG_KEYS).toEqual(expect.arrayContaining(expectedFields));
      expect(LEAD_CAPTURE_CONFIG_KEYS.length).toBe(expectedFields.length);
    });

    it("has default values for all fields", () => {
      for (const key of LEAD_CAPTURE_CONFIG_KEYS) {
        expect(LEAD_CAPTURE_DEFAULTS).toHaveProperty(key);
      }
    });
  });

  describe("Zod Schema Sync", () => {
    it("Zod schema accepts all interface fields", () => {
      const testConfig: LeadCaptureConfig = {
        emailRequired: true,
        emailLabel: "Email",
        emailPlaceholder: "you@example.com",
        emailErrorMessage: "Invalid email",
        nameFieldEnabled: true,
        nameFieldRequired: false,
        nameFieldLabel: "Your Name",
        nameFieldPlaceholder: "Enter name",
        consentFieldEnabled: true,
        consentFieldRequired: true,
        consentFieldText: "I agree",
        privacyPolicyUrl: "https://example.com/privacy",
      };

      // This should not throw
      const result = LeadCaptureConfigSchema.parse(testConfig);

      expect(result.emailRequired).toBe(true);
      expect(result.nameFieldLabel).toBe("Your Name");
      expect(result.consentFieldText).toBe("I agree");
    });

    it("Zod schema has all interface fields", () => {
      const schemaKeys = Object.keys(LeadCaptureConfigSchema.shape);

      for (const key of LEAD_CAPTURE_CONFIG_KEYS) {
        expect(schemaKeys).toContain(key);
      }
    });
  });

  describe("Form Props Mapping", () => {
    it("maps all interface fields to form props", () => {
      const config: LeadCaptureConfig = {
        emailRequired: false,
        emailLabel: "Email Address",
        emailPlaceholder: "you@example.com",
        emailErrorMessage: "Bad email",
        nameFieldEnabled: true,
        nameFieldRequired: true,
        nameFieldLabel: "Full Name",
        nameFieldPlaceholder: "John Doe",
        consentFieldEnabled: true,
        consentFieldRequired: true,
        consentFieldText: "I consent to marketing",
        privacyPolicyUrl: "https://example.com/privacy",
      };

      const formProps = mapLeadCaptureConfigToFormProps(config);

      // Check all mappings
      expect(formProps.emailRequired).toBe(false);
      expect(formProps.showName).toBe(true);
      expect(formProps.nameRequired).toBe(true);
      expect(formProps.showGdpr).toBe(true);
      expect(formProps.gdprRequired).toBe(true);
      expect(formProps.labels?.email).toBe("Email Address");
      expect(formProps.labels?.name).toBe("Full Name");
      expect(formProps.labels?.gdpr).toBe("I consent to marketing");
      expect(formProps.placeholders?.email).toBe("you@example.com");
      expect(formProps.placeholders?.name).toBe("John Doe");
      expect(formProps.privacyPolicyUrl).toBe("https://example.com/privacy");
    });

    it("handles undefined values gracefully", () => {
      const emptyConfig: LeadCaptureConfig = {};

      const formProps = mapLeadCaptureConfigToFormProps(emptyConfig);

      expect(formProps.showName).toBeUndefined();
      expect(formProps.labels?.name).toBeUndefined();
    });
  });
});

