/**
 * Unit Tests for Lead Capture Config
 */

import { describe, it, expect } from "vitest";

import {
  LEAD_CAPTURE_CONFIG_KEYS,
  LEAD_CAPTURE_DEFAULTS,
  mapLeadCaptureConfigToFormProps,
} from "~/shared/types/lead-capture-config";
import type { LeadCaptureConfig, LeadCaptureFormConfigProps } from "~/shared/types/lead-capture-config";

describe("LEAD_CAPTURE_CONFIG_KEYS", () => {
  it("should have 12 keys", () => {
    expect(LEAD_CAPTURE_CONFIG_KEYS).toHaveLength(12);
  });

  it("should include email keys", () => {
    expect(LEAD_CAPTURE_CONFIG_KEYS).toContain("emailRequired");
    expect(LEAD_CAPTURE_CONFIG_KEYS).toContain("emailLabel");
    expect(LEAD_CAPTURE_CONFIG_KEYS).toContain("emailPlaceholder");
    expect(LEAD_CAPTURE_CONFIG_KEYS).toContain("emailErrorMessage");
  });

  it("should include name keys", () => {
    expect(LEAD_CAPTURE_CONFIG_KEYS).toContain("nameFieldEnabled");
    expect(LEAD_CAPTURE_CONFIG_KEYS).toContain("nameFieldRequired");
    expect(LEAD_CAPTURE_CONFIG_KEYS).toContain("nameFieldLabel");
    expect(LEAD_CAPTURE_CONFIG_KEYS).toContain("nameFieldPlaceholder");
  });

  it("should include consent keys", () => {
    expect(LEAD_CAPTURE_CONFIG_KEYS).toContain("consentFieldEnabled");
    expect(LEAD_CAPTURE_CONFIG_KEYS).toContain("consentFieldRequired");
    expect(LEAD_CAPTURE_CONFIG_KEYS).toContain("consentFieldText");
    expect(LEAD_CAPTURE_CONFIG_KEYS).toContain("privacyPolicyUrl");
  });
});

describe("LEAD_CAPTURE_DEFAULTS", () => {
  it("should have email required by default", () => {
    expect(LEAD_CAPTURE_DEFAULTS.emailRequired).toBe(true);
  });

  it("should have name field disabled by default", () => {
    expect(LEAD_CAPTURE_DEFAULTS.nameFieldEnabled).toBe(false);
    expect(LEAD_CAPTURE_DEFAULTS.nameFieldRequired).toBe(false);
  });

  it("should have consent field disabled by default", () => {
    expect(LEAD_CAPTURE_DEFAULTS.consentFieldEnabled).toBe(false);
    expect(LEAD_CAPTURE_DEFAULTS.consentFieldRequired).toBe(false);
  });

  it("should have default placeholders", () => {
    expect(LEAD_CAPTURE_DEFAULTS.emailPlaceholder).toBe("Enter your email");
    expect(LEAD_CAPTURE_DEFAULTS.nameFieldPlaceholder).toBe("Your name");
  });

  it("should have default error message", () => {
    expect(LEAD_CAPTURE_DEFAULTS.emailErrorMessage).toBe("Please enter a valid email address");
  });
});

describe("mapLeadCaptureConfigToFormProps", () => {
  it("should map empty config to defaults", () => {
    const result = mapLeadCaptureConfigToFormProps({});

    expect(result.showName).toBeUndefined();
    expect(result.showGdpr).toBeUndefined();
    expect(result.emailRequired).toBeUndefined();
  });

  it("should map name field settings", () => {
    const config: LeadCaptureConfig = {
      nameFieldEnabled: true,
      nameFieldRequired: true,
      nameFieldLabel: "Full Name",
      nameFieldPlaceholder: "Enter your full name",
    };

    const result = mapLeadCaptureConfigToFormProps(config);

    expect(result.showName).toBe(true);
    expect(result.nameRequired).toBe(true);
    expect(result.labels?.name).toBe("Full Name");
    expect(result.placeholders?.name).toBe("Enter your full name");
  });

  it("should map consent field settings", () => {
    const config: LeadCaptureConfig = {
      consentFieldEnabled: true,
      consentFieldRequired: true,
      consentFieldText: "I agree to the terms",
      privacyPolicyUrl: "https://example.com/privacy",
    };

    const result = mapLeadCaptureConfigToFormProps(config);

    expect(result.showGdpr).toBe(true);
    expect(result.gdprRequired).toBe(true);
    expect(result.labels?.gdpr).toBe("I agree to the terms");
    expect(result.privacyPolicyUrl).toBe("https://example.com/privacy");
  });

  it("should map email settings", () => {
    const config: LeadCaptureConfig = {
      emailRequired: true,
      emailLabel: "Email Address",
      emailPlaceholder: "you@example.com",
    };

    const result = mapLeadCaptureConfigToFormProps(config);

    expect(result.emailRequired).toBe(true);
    expect(result.labels?.email).toBe("Email Address");
    expect(result.placeholders?.email).toBe("you@example.com");
  });

  it("should map full config", () => {
    const config: LeadCaptureConfig = {
      emailRequired: true,
      emailLabel: "Email",
      emailPlaceholder: "Enter email",
      nameFieldEnabled: true,
      nameFieldRequired: false,
      nameFieldLabel: "Name",
      nameFieldPlaceholder: "Enter name",
      consentFieldEnabled: true,
      consentFieldRequired: true,
      consentFieldText: "I consent",
      privacyPolicyUrl: "https://example.com/privacy",
    };

    const result = mapLeadCaptureConfigToFormProps(config);

    expect(result.showName).toBe(true);
    expect(result.showGdpr).toBe(true);
    expect(result.emailRequired).toBe(true);
    expect(result.privacyPolicyUrl).toBe("https://example.com/privacy");
  });
});

