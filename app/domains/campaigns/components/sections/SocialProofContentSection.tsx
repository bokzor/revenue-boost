/**
 * Social Proof Content Configuration Section
 *
 * Comprehensive form for configuring social proof notifications
 * Includes all Tier 1 & Tier 2 features with organized sections
 */

import { TextField, CheckboxField, FormGrid, SelectField } from "../form";
import { useFieldUpdater } from "~/shared/hooks/useFieldUpdater";
import { Card, BlockStack, Text, Divider, Banner } from "@shopify/polaris";

export interface SocialProofContent {
  // Core notification types (Tier 1)
  enablePurchaseNotifications?: boolean;
  enableVisitorNotifications?: boolean;
  enableReviewNotifications?: boolean;

  // Display & rotation settings used by SocialProofPopup
  cornerPosition?: "bottom-left" | "bottom-right" | "top-left" | "top-right";
  displayDuration?: number; // seconds (1-30)
  rotationInterval?: number;
  maxNotificationsPerSession?: number;

  // Data thresholds used for filtering notifications
  minVisitorCount?: number;
  minReviewRating?: number;

  // Visual toggles used on storefront
  showProductImage?: boolean;
  showTimer?: boolean;
}

export interface SocialProofContentSectionProps {
  content: Partial<SocialProofContent>;
  errors?: Record<string, string>;
  onChange: (content: Partial<SocialProofContent>) => void;
}

export function SocialProofContentSection({
  content,
  errors,
  onChange,
}: SocialProofContentSectionProps) {
  const updateField = useFieldUpdater(content, onChange);

  return (
    <BlockStack gap="600">
      {/* Info Banner */}
      <Banner tone="info">
        <Text as="p">
          Social proof notifications build trust by showing real activity on your store. Enable the
          notification types that best fit your business and configure display settings below.
        </Text>
      </Banner>

      {/* Notification Types */}
      <Card>
        <BlockStack gap="400">
          <Text as="h3" variant="headingMd">
            Notification Types
          </Text>
          <Text as="p" tone="subdued">
            Choose which real-time activity to highlight. These toggles directly control which
            notifications are shown on your storefront.
          </Text>
          <Divider />

          <CheckboxField
            label="Purchase Notifications (+15-25% conversion)"
            name="content.enablePurchaseNotifications"
            checked={content.enablePurchaseNotifications ?? true}
            helpText='Show "John D. from New York just purchased Classic T-Shirt"'
            onChange={(checked) => updateField("enablePurchaseNotifications", checked)}
          />

          <CheckboxField
            label="Visitor Count (+10-18% conversion)"
            name="content.enableVisitorNotifications"
            checked={content.enableVisitorNotifications ?? true}
            helpText='Show "23 people are viewing this product right now"'
            onChange={(checked) => updateField("enableVisitorNotifications", checked)}
          />

          <CheckboxField
            label="Review Notifications (+5-10% conversion)"
            name="content.enableReviewNotifications"
            checked={content.enableReviewNotifications ?? false}
            helpText='Show "Emily just left a 5-star review"'
            onChange={(checked) => updateField("enableReviewNotifications", checked)}
          />
        </BlockStack>
      </Card>

      {/* Display Settings */}
      <Card>
        <BlockStack gap="400">
          <Text as="h3" variant="headingMd">
            Display & Frequency
          </Text>
          <Text as="p" tone="subdued">
            Control where notifications appear, how often they rotate, and basic visibility rules.
          </Text>
          <Divider />

          <SelectField
            label="Position"
            name="content.cornerPosition"
            value={content.cornerPosition || "bottom-left"}
            options={[
              { label: "Bottom Left", value: "bottom-left" },
              { label: "Bottom Right", value: "bottom-right" },
              { label: "Top Left", value: "top-left" },
              { label: "Top Right", value: "top-right" },
            ]}
            helpText="Where to display notifications on the page"
            onChange={(value) => {
              type PositionOption = "bottom-left" | "bottom-right" | "top-left" | "top-right";
              updateField("cornerPosition", value as PositionOption);
            }}
          />

          <FormGrid columns={2}>
            <TextField
              label="Rotation Interval (seconds)"
              name="content.rotationInterval"
              value={content.rotationInterval?.toString() || "8"}
              error={errors?.rotationInterval}
              placeholder="8"
              helpText="Time between notifications (storefront rotation interval)"
              onChange={(value) => updateField("rotationInterval", parseInt(value) || 8)}
            />

            <TextField
              label="Max Notifications Per Session"
              name="content.maxNotificationsPerSession"
              value={content.maxNotificationsPerSession?.toString() || "5"}
              error={errors?.maxNotificationsPerSession}
              placeholder="5"
              helpText="Hard cap per visitor for this campaign"
              onChange={(value) => updateField("maxNotificationsPerSession", parseInt(value) || 5)}
            />
          </FormGrid>

          <FormGrid columns={2}>
            <TextField
              label="Min Visitor Count"
              name="content.minVisitorCount"
              value={content.minVisitorCount?.toString() || "5"}
              error={errors?.minVisitorCount}
              placeholder="5"
              helpText="Only show visitor count notifications when at least this many visitors are active"
              onChange={(value) => updateField("minVisitorCount", parseInt(value) || 5)}
            />

            <TextField
              label="Min Review Rating"
              name="content.minReviewRating"
              value={content.minReviewRating?.toString() || "4.0"}
              error={errors?.minReviewRating}
              placeholder="4.0"
              helpText="Only show review notifications with rating >= this value"
              onChange={(value) => updateField("minReviewRating", parseFloat(value) || 4.0)}
            />
          </FormGrid>

          <BlockStack gap="200">
            <CheckboxField
              label="Show Product Image"
              name="content.showProductImage"
              checked={content.showProductImage ?? true}
              helpText="Include product image in purchase notifications on the storefront"
              onChange={(checked) => updateField("showProductImage", checked)}
            />

            <CheckboxField
              label="Show Time Ago"
              name="content.showTimer"
              checked={content.showTimer ?? true}
              helpText='Show how long ago the event happened (e.g. "2 minutes ago")'
              onChange={(checked) => updateField("showTimer", checked)}
            />
          </BlockStack>
        </BlockStack>
      </Card>

      {/* Performance Tips */}
      <Banner tone="success">
        <BlockStack gap="200">
          <Text as="p" fontWeight="semibold">
            💡 Performance Tips
          </Text>
          <Text as="p">
            • Start with Purchase + Visitor + Reviews for a strong baseline
            <br />
            • Use a rotation interval of 6-10 seconds to avoid feeling spammy
            <br />
            • Cap notifications to 3-7 per session for each visitor
            <br />• Use visitor/review thresholds to keep notifications trustworthy
          </Text>
        </BlockStack>
      </Banner>
    </BlockStack>
  );
}
