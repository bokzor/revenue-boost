/**
 * Announcement Content Configuration Section
 *
 * Form section for configuring announcement banner popup content.
 * Follows the established pattern of other template content sections.
 */

import { Card, BlockStack, Text, Divider } from "@shopify/polaris";
import { TextField, CheckboxField, FormGrid } from "../form";
import type { AnnouncementContentSchema } from "../../types/campaign";
import { z } from "zod";
import { useFieldUpdater } from "~/shared/hooks/useFieldUpdater";

export type AnnouncementContent = z.infer<typeof AnnouncementContentSchema>;

export interface AnnouncementContentSectionProps {
  content: Partial<AnnouncementContent>;
  errors?: Record<string, string>;
  onChange: (content: Partial<AnnouncementContent>) => void;
}

export function AnnouncementContentSection({
  content,
  errors,
  onChange,
}: AnnouncementContentSectionProps) {
  const updateField = useFieldUpdater(content, onChange);

  return (
    <Card data-test-id="announcement-admin-form">
      <BlockStack gap="400">
        <BlockStack gap="200">
          <Text as="h3" variant="headingMd">
            📢 Content
          </Text>
          <Text as="p" tone="subdued">
            Configure the text and messaging for your announcement ribbon
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
            placeholder="Flash Sale: 25% OFF Everything - Today Only!"
            helpText="Main announcement message"
            onChange={(value) => updateField("headline", value)}
          />

          <TextField
            label="Subheadline"
            name="content.subheadline"
            value={content.subheadline || ""}
            error={errors?.subheadline}
            placeholder="Use code FLASH25 at checkout"
            helpText="Additional details (optional)"
            onChange={(value) => updateField("subheadline", value)}
          />

          {/* Visual Elements Section */}
          <BlockStack gap="300">
            <Text as="h4" variant="headingSm">
              Visual Elements
            </Text>
            <TextField
              label="Icon/Emoji"
              name="content.icon"
              value={content.icon || ""}
              placeholder=""
              helpText="Emoji or icon to display (optional)"
              onChange={(value) => updateField("icon", value)}
            />
          </BlockStack>

          {/* Call to Action Section */}
          <BlockStack gap="300">
            <Text as="h4" variant="headingSm">
              Call to Action
            </Text>
            <FormGrid columns={2}>
              <TextField
                label="Button Text"
                name="content.buttonText"
                value={content.buttonText || ""}
                error={errors?.buttonText}
                placeholder="Shop Now"
                helpText="CTA button text (optional)"
                onChange={(value) => updateField("buttonText", value)}
              />

              <TextField
                label="CTA URL"
                name="content.ctaUrl"
                value={content.ctaUrl || ""}
                error={errors?.ctaUrl}
                placeholder="/collections/sale"
                helpText="Where to send users when they click"
                onChange={(value) => updateField("ctaUrl", value)}
              />
            </FormGrid>

            <CheckboxField
              label="Open Link in New Tab"
              name="content.ctaOpenInNewTab"
              checked={content.ctaOpenInNewTab || false}
              helpText="Open CTA link in a new browser tab"
              onChange={(checked) => updateField("ctaOpenInNewTab", checked)}
            />

            <TextField
              label="Dismiss Button Text"
              name="content.dismissLabel"
              value={content.dismissLabel || ""}
              error={errors?.dismissLabel}
              placeholder="No thanks"
              helpText="Text for the dismiss action that closes the banner"
              onChange={(value) => updateField("dismissLabel", value)}
            />
          </BlockStack>

          {/* Behavior Section */}
          <BlockStack gap="300">
            <Text as="h4" variant="headingSm">
              Behavior
            </Text>
            <CheckboxField
              label="Sticky Banner"
              name="content.sticky"
              checked={content.sticky !== false}
              helpText="Keep banner visible when scrolling"
              onChange={(checked) => updateField("sticky", checked)}
            />
          </BlockStack>
        </BlockStack>
      </BlockStack>
    </Card>
  );
}
