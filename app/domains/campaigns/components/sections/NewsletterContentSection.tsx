/**
 * Newsletter Content Configuration Section
 *
 * Template-specific content section for Newsletter campaigns.
 * Contains only Content and Discount subsections.
 * Design configuration is handled by the shared DesignConfigSection.
 *
 * Follows Interface Segregation Principle - specific to newsletter content needs
 */

import { Card, BlockStack, Text, Divider } from "@shopify/polaris";
import { TextField, FormGrid } from "../form";
import { FieldConfigurationSection } from "./FieldConfigurationSection";
import { DiscountSection } from "~/domains/popups/components/design/DiscountSection";
import type { NewsletterContentSchema } from "../../types/campaign";
import type { DiscountConfig } from "~/domains/popups/services/discounts/discount.server";
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
              helpText="Supporting text (optional)"
              onChange={(value) => updateField("subheadline", value)}
              data-test-id="newsletter-subheadline"
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
                data-test-id="newsletter-button-text"
              />

              <TextField
                label="Email Label"
                name="content.emailLabel"
                value={content.emailLabel || ""}
                error={errors?.emailLabel}
                placeholder="Email"
                helpText="Label shown above email field"
                onChange={(value) => updateField("emailLabel", value)}
                data-test-id="newsletter-email-label"
              />
            </FormGrid>

            <TextField
              label="Dismiss Button Text"
              name="content.dismissLabel"
              value={content.dismissLabel || ""}
              error={errors?.dismissLabel}
              placeholder="No thanks"
              helpText="Secondary button text that closes the popup"
              onChange={(value) => updateField("dismissLabel", value)}
            />

            <TextField
              label="Email Placeholder"
              name="content.emailPlaceholder"
              value={content.emailPlaceholder || "Enter your email"}
              error={errors?.emailPlaceholder}
              placeholder="Enter your email"
              helpText="Placeholder text inside email field"
              onChange={(value) => updateField("emailPlaceholder", value)}
              data-test-id="newsletter-email-placeholder"
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

            <TextField
              label="Failure Message"
              name="content.failureMessage"
              value={content.failureMessage || ""}
              error={errors?.failureMessage}
              placeholder="Something went wrong. Please try again."
              helpText="Message shown if submission fails (optional)"
              onChange={(value) => updateField("failureMessage", value)}
              data-test-id="newsletter-failure-message"
            />

            {/* Field Configuration Section - Email, Name, GDPR */}
            <BlockStack gap="300">
              <Text as="h4" variant="headingSm">
                Field Configuration
              </Text>
              <FieldConfigurationSection
                emailRequired={content.emailRequired}
                emailLabel={content.emailLabel}
                emailPlaceholder={content.emailPlaceholder}
                nameFieldEnabled={content.nameFieldEnabled}
                nameFieldRequired={content.nameFieldRequired}
                nameFieldPlaceholder={content.nameFieldPlaceholder}
                consentFieldEnabled={content.consentFieldEnabled}
                consentFieldRequired={content.consentFieldRequired}
                consentFieldText={content.consentFieldText}
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
            />
          </BlockStack>
        </Card>
      )}

    </>
  );
}
