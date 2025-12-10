/**
 * Newsletter Content Configuration Section (Simplified)
 *
 * Template-specific content section for Newsletter campaigns.
 *
 * SIMPLIFIED FORM STRUCTURE:
 * - Essential text fields (headline, subheadline, button, success message)
 * - Lead Capture Form block (email, name, consent - from shared component)
 * - Discount configuration
 *
 * Design configuration is handled separately by:
 * - Theme picker (provides colors, typography, effects)
 * - Layout picker (image position)
 * - Background picker (image selection)
 *
 * @see LeadCaptureFormSection for email/name/consent configuration
 * @see CAMPAIGN_FORM_STRATEGY.md for architecture decisions
 */

import { Card, BlockStack, Text, Divider } from "@shopify/polaris";
import { TextField } from "../form";
import { LeadCaptureFormSection } from "./LeadCaptureFormSection";
import { DiscountSection } from "~/domains/popups/components/design/DiscountSection";
import type { NewsletterContentSchema, DiscountConfig } from "../../types/campaign";
import { z } from "zod";
import { useFieldUpdater } from "~/shared/hooks/useFieldUpdater";

export type NewsletterContent = z.infer<typeof NewsletterContentSchema>;

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
      {/* ========== CONTENT SECTION ========== */}
      <Card data-test-id="newsletter-admin-form">
        <BlockStack gap="400">
          <BlockStack gap="200">
            <Text as="h3" variant="headingMd">
              📝 Content
            </Text>
            <Text as="p" tone="subdued">
              Configure the text and messaging for your newsletter popup
            </Text>
          </BlockStack>

          <Divider />

          <BlockStack gap="400">
            {/* Essential Text Fields */}
            <TextField
              label="Headline"
              name="content.headline"
              value={content.headline || ""}
              error={errors?.headline}
              required
              placeholder="Get 10% off your first order!"
              helpText="Main headline that grabs attention"
              onChange={(value) => updateField("headline", value)}
              data-test-id="newsletter-headline"
            />

            <TextField
              label="Subheadline"
              name="content.subheadline"
              value={content.subheadline || ""}
              error={errors?.subheadline}
              placeholder="Join our newsletter for exclusive deals"
              helpText="Supporting text below headline (optional)"
              onChange={(value) => updateField("subheadline", value)}
              data-test-id="newsletter-subheadline"
            />

            <TextField
              label="Button Text"
              name="content.submitButtonText"
              value={content.submitButtonText || content.buttonText || "Subscribe"}
              error={errors?.submitButtonText}
              required
              placeholder="Subscribe"
              helpText="Text on the submit button"
              onChange={(value) => updateField("submitButtonText", value)}
              data-test-id="newsletter-button-text"
            />

            <TextField
              label="Dismiss Button Text"
              name="content.dismissLabel"
              value={content.dismissLabel || ""}
              error={errors?.dismissLabel}
              placeholder="No thanks"
              helpText="Text for the secondary 'close' button"
              onChange={(value) => updateField("dismissLabel", value)}
              data-test-id="newsletter-dismiss-label"
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
              data-test-id="newsletter-success-message"
            />

            <Divider />

            {/* Lead Capture Form - Email, Name, GDPR */}
            <BlockStack gap="300">
              <Text as="h4" variant="headingSm">
                📧 Lead Capture Form
              </Text>
              <Text as="p" tone="subdued">
                Configure email, name, and consent fields
              </Text>
              <LeadCaptureFormSection
                emailRequired={content.emailRequired}
                emailLabel={content.emailLabel}
                emailPlaceholder={content.emailPlaceholder}
                nameFieldEnabled={content.nameFieldEnabled}
                nameFieldRequired={content.nameFieldRequired}
                nameFieldLabel={content.nameFieldLabel}
                nameFieldPlaceholder={content.nameFieldPlaceholder}
                consentFieldEnabled={content.consentFieldEnabled}
                consentFieldRequired={content.consentFieldRequired}
                consentFieldText={content.consentFieldText}
                privacyPolicyUrl={content.privacyPolicyUrl}
                onChange={(updates) => onChange({ ...content, ...updates })}
                errors={errors}
              />
            </BlockStack>
          </BlockStack>
        </BlockStack>
      </Card>

      {/* ========== DISCOUNT SECTION ========== */}
      {onDiscountChange && (
        <Card>
          <BlockStack gap="400">
            <BlockStack gap="200">
              <Text as="h3" variant="headingMd">
                💰 Discount
              </Text>
              <Text as="p" tone="subdued">
                Offer a discount incentive to encourage newsletter signups
              </Text>
            </BlockStack>

            <Divider />

            <DiscountSection
              goal="NEWSLETTER_SIGNUP"
              discountConfig={discountConfig}
              onConfigChange={onDiscountChange}
              hasEmailCapture={true}
            />
          </BlockStack>
        </Card>
      )}

    </>
  );
}
