/**
 * Lead Capture Form Section
 *
 * Admin form for configuring the LeadCaptureForm block (email, name, consent fields).
 * Uses the shared LeadCaptureConfig interface as the single source of truth.
 *
 * This component maps 1:1 with the storefront LeadCaptureForm component.
 * Any field added here should also be used by the storefront component.
 *
 * Reusable across Newsletter, SpinToWin, and other campaign templates.
 */

import { BlockStack } from "@shopify/polaris";
import { TextField, CheckboxField, FormGrid } from "../form";
import type { LeadCaptureConfig } from "~/shared/types/lead-capture-config";

export interface LeadCaptureFormSectionProps extends LeadCaptureConfig {
  onChange: (updates: Partial<LeadCaptureConfig>) => void;
  errors?: Record<string, string>;
}

export function LeadCaptureFormSection({
  emailRequired = true,
  emailLabel,
  emailPlaceholder,
  nameFieldEnabled = false,
  nameFieldRequired,
  nameFieldLabel,
  nameFieldPlaceholder,
  consentFieldEnabled = false,
  consentFieldRequired,
  consentFieldText,
  privacyPolicyUrl,
  onChange,
  errors,
}: LeadCaptureFormSectionProps) {
  const updateField = <K extends keyof LeadCaptureConfig>(field: K, value: LeadCaptureConfig[K]) => {
    onChange({ [field]: value });
  };

  return (
    <BlockStack gap="400">
      <FormGrid columns={2}>
        <TextField
          label="Email Label"
          name="emailLabel"
          value={emailLabel || ""}
          placeholder="Email"
          onChange={(value) => updateField("emailLabel", value)}
          error={errors?.emailLabel}
        />
        <TextField
          label="Email Placeholder"
          name="emailPlaceholder"
          value={emailPlaceholder || ""}
          placeholder="Enter your email"
          onChange={(value) => updateField("emailPlaceholder", value)}
          error={errors?.emailPlaceholder}
        />
      </FormGrid>

      <FormGrid columns={2}>
        <CheckboxField
          label="Require Email"
          name="emailRequired"
          checked={emailRequired !== false}
          helpText="Make email field mandatory"
          onChange={(checked) => updateField("emailRequired", checked)}
        />

        <CheckboxField
          label="Enable Name Field"
          name="nameFieldEnabled"
          checked={nameFieldEnabled}
          helpText="Add an optional name field"
          onChange={(checked) => updateField("nameFieldEnabled", checked)}
        />
      </FormGrid>

      {nameFieldEnabled && (
        <BlockStack gap="300">
          <FormGrid columns={2}>
            <TextField
              label="Name Field Label"
              name="nameFieldLabel"
              value={nameFieldLabel || ""}
              placeholder="Name"
              helpText="Label shown above name input"
              onChange={(value) => updateField("nameFieldLabel", value)}
            />
            <TextField
              label="Name Field Placeholder"
              name="nameFieldPlaceholder"
              value={nameFieldPlaceholder || ""}
              placeholder="Enter your name"
              onChange={(value) => updateField("nameFieldPlaceholder", value)}
            />
          </FormGrid>
          <CheckboxField
            label="Require Name"
            name="nameFieldRequired"
            checked={nameFieldRequired || false}
            helpText="Make name field mandatory"
            onChange={(checked) => updateField("nameFieldRequired", checked)}
          />
        </BlockStack>
      )}

      <CheckboxField
        label="Enable Consent Checkbox"
        name="consentFieldEnabled"
        checked={consentFieldEnabled}
        helpText="Add a consent checkbox (e.g., for GDPR compliance)"
        onChange={(checked) => updateField("consentFieldEnabled", checked)}
      />

      {consentFieldEnabled && (
        <BlockStack gap="400">
          <FormGrid columns={2}>
            <CheckboxField
              label="Require Consent"
              name="consentFieldRequired"
              checked={consentFieldRequired || false}
              onChange={(checked) => updateField("consentFieldRequired", checked)}
            />

            <TextField
              label="Consent Text"
              name="consentFieldText"
              value={consentFieldText || ""}
              placeholder="I agree to receive marketing emails and accept the {privacyPolicy}"
              helpText="Use {privacyPolicy} to insert a link to your privacy policy"
              multiline
              rows={2}
              onChange={(value) => updateField("consentFieldText", value)}
            />
          </FormGrid>

          <TextField
            label="Privacy Policy URL"
            name="privacyPolicyUrl"
            value={privacyPolicyUrl || ""}
            placeholder="https://your-store.com/privacy-policy"
            helpText="GDPR compliance: Link to your privacy policy (required for EU customers)"
            onChange={(value) => updateField("privacyPolicyUrl", value)}
            error={errors?.privacyPolicyUrl}
          />
        </BlockStack>
      )}
    </BlockStack>
  );
}
