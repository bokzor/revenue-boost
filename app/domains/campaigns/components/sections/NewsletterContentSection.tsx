/**
 * Newsletter Content Configuration Section
 *
 * Form section for configuring newsletter popup content
 * Follows Interface Segregation Principle - specific to newsletter needs
 */

import { TextField, CheckboxField, FormGrid } from "../form";
import type { NewsletterContentSchema } from "../../types/campaign";
import { z } from "zod";
import { useFieldUpdater } from "~/shared/hooks/useFieldUpdater";
import { DiscountSection } from "~/domains/popups/components/design/DiscountSection";
import type { DiscountConfig } from "~/domains/popups/services/discounts/discount.server";

type NewsletterContent = z.infer<typeof NewsletterContentSchema>;

export interface NewsletterContentSectionProps {
  content: Partial<NewsletterContent>;
  discountConfig?: DiscountConfig;
  errors?: Record<string, string>;
  onChange: (content: Partial<NewsletterContent>) => void;
  onDiscountChange?: (config: DiscountConfig) => void;
}

export function NewsletterContentSection({
  content,
  discountConfig,
  errors,
  onChange,
  onDiscountChange,
}: NewsletterContentSectionProps) {
  const updateField = useFieldUpdater(content, onChange);

  return (
    <>
      <TextField
        label="Headline"
        name="content.headline"
        value={content.headline || ""}
        error={errors?.headline}
        required
        placeholder="Get 10% off your first order!"
        helpText="Main headline that grabs attention"
        onChange={(value) => updateField("headline", value)}
      />

      <TextField
        label="Subheadline"
        name="content.subheadline"
        value={content.subheadline || ""}
        error={errors?.subheadline}
        placeholder="Join our newsletter for exclusive deals"
        helpText="Supporting text (optional)"
        onChange={(value) => updateField("subheadline", value)}
      />

      <FormGrid columns={2}>
        <TextField
          label="Button Text"
          name="content.buttonText"
          value={content.buttonText || "Subscribe"}
          error={errors?.buttonText}
          required
          placeholder="Subscribe"
          onChange={(value) => updateField("buttonText", value)}
        />

        <TextField
          label="Email Label"
          name="content.emailLabel"
          value={content.emailLabel || ""}
          error={errors?.emailLabel}
          placeholder="Email"
          helpText="Label shown above email field"
          onChange={(value) => updateField("emailLabel", value)}
        />
      </FormGrid>

      <TextField
        label="Email Placeholder"
        name="content.emailPlaceholder"
        value={content.emailPlaceholder || "Enter your email"}
        error={errors?.emailPlaceholder}
        placeholder="Enter your email"
        helpText="Placeholder text inside email field"
        onChange={(value) => updateField("emailPlaceholder", value)}
      />

      <TextField
        label="Success Message"
        name="content.successMessage"
        value={content.successMessage || ""}
        error={errors?.successMessage}
        required
        placeholder="Thanks for subscribing!"
        helpText="Message shown after successful submission"
        onChange={(value) => updateField("successMessage", value)}
      />

      <TextField
        label="Failure Message"
        name="content.failureMessage"
        value={content.failureMessage || ""}
        error={errors?.failureMessage}
        placeholder="Something went wrong. Please try again."
        helpText="Message shown if submission fails (optional)"
        onChange={(value) => updateField("failureMessage", value)}
      />

      <FormGrid columns={2}>
        <CheckboxField
          label="Require Email"
          name="content.emailRequired"
          checked={content.emailRequired !== false}
          helpText="Make email field mandatory"
          onChange={(checked) => updateField("emailRequired", checked)}
        />

        <CheckboxField
          label="Enable Name Field"
          name="content.nameFieldEnabled"
          checked={content.nameFieldEnabled || false}
          helpText="Add an optional name field"
          onChange={(checked) => updateField("nameFieldEnabled", checked)}
        />
      </FormGrid>

      {content.nameFieldEnabled && (
        <FormGrid columns={2}>
          <CheckboxField
            label="Require Name"
            name="content.nameFieldRequired"
            checked={content.nameFieldRequired || false}
            onChange={(checked) => updateField("nameFieldRequired", checked)}
          />

          <TextField
            label="Name Field Placeholder"
            name="content.nameFieldPlaceholder"
            value={content.nameFieldPlaceholder || ""}
            placeholder="Enter your name"
            onChange={(value) => updateField("nameFieldPlaceholder", value)}
          />
        </FormGrid>
      )}

      <CheckboxField
        label="Enable Consent Checkbox"
        name="content.consentFieldEnabled"
        checked={content.consentFieldEnabled || false}
        helpText="Add a consent checkbox (e.g., for GDPR compliance)"
        onChange={(checked) => updateField("consentFieldEnabled", checked)}
      />

      {content.consentFieldEnabled && (
        <FormGrid columns={2}>
          <CheckboxField
            label="Require Consent"
            name="content.consentFieldRequired"
            checked={content.consentFieldRequired || false}
            onChange={(checked) => updateField("consentFieldRequired", checked)}
          />

          <TextField
            label="Consent Text"
            name="content.consentFieldText"
            value={content.consentFieldText || ""}
            placeholder="I agree to receive marketing emails"
            multiline
            rows={2}
            onChange={(value) => updateField("consentFieldText", value)}
          />
        </FormGrid>
      )}

      {/* Discount Configuration */}
      {onDiscountChange && (
        <DiscountSection
          goal="NEWSLETTER_SIGNUP"
          discountConfig={discountConfig}
          onConfigChange={onDiscountChange}
        />
      )}
    </>
  );
}

