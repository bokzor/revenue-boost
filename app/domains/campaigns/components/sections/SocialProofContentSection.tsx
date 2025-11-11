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
  // Tier 1 Notification Types
  enablePurchaseNotifications?: boolean;
  enableVisitorNotifications?: boolean;
  enableReviewNotifications?: boolean;

  // Tier 2 Notification Types
  enableSalesCountNotifications?: boolean;
  enableLowStockAlerts?: boolean;
  enableTrendingNotifications?: boolean;
  enableCartActivityNotifications?: boolean;
  enableRecentlyViewedNotifications?: boolean;

  // Display Settings
  position?: "bottom-left" | "bottom-right" | "top-left" | "top-right";
  displayDuration?: number;
  rotationInterval?: number;
  maxNotificationsPerSession?: number;

  // Data Settings
  purchaseLookbackHours?: number;
  minVisitorCount?: number;
  minReviewRating?: number;
  lowStockThreshold?: number;

  // Privacy Settings
  anonymizeCustomerNames?: boolean;
  showCustomerLocation?: boolean;
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
          Social proof notifications build trust by showing real activity on your store.
          Enable the notification types that best fit your business and configure display settings below.
        </Text>
      </Banner>

      {/* Tier 1 Notification Types */}
      <Card>
        <BlockStack gap="400">
          <Text as="h3" variant="headingMd">
            Tier 1 Notifications (Highest Impact)
          </Text>
          <Text as="p" tone="subdued">
            These notification types have the highest conversion impact (+10-25% each)
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
            label="Sales Count - 24h (+12-20% conversion)"
            name="content.enableSalesCountNotifications"
            checked={content.enableSalesCountNotifications ?? true}
            helpText='Show "47 people bought this in the last 24 hours"'
            onChange={(checked) => updateField("enableSalesCountNotifications", checked)}
          />
        </BlockStack>
      </Card>

      {/* Tier 2 Notification Types */}
      <Card>
        <BlockStack gap="400">
          <Text as="h3" variant="headingMd">
            Tier 2 Notifications (High Impact)
          </Text>
          <Text as="p" tone="subdued">
            Additional notification types for increased urgency and social proof (+5-15% each)
          </Text>
          <Divider />

          <CheckboxField
            label="Low Stock Alerts (+15-25% conversion)"
            name="content.enableLowStockAlerts"
            checked={content.enableLowStockAlerts ?? false}
            helpText='Show "Only 3 left in stock!" when inventory is low'
            onChange={(checked) => updateField("enableLowStockAlerts", checked)}
          />

          <CheckboxField
            label="Trending Products (+8-12% conversion)"
            name="content.enableTrendingNotifications"
            checked={content.enableTrendingNotifications ?? false}
            helpText='Show "🔥 Trending - 50+ views in the last hour"'
            onChange={(checked) => updateField("enableTrendingNotifications", checked)}
          />

          <CheckboxField
            label="Cart Activity (+8-15% conversion)"
            name="content.enableCartActivityNotifications"
            checked={content.enableCartActivityNotifications ?? false}
            helpText='Show "5 people added to cart in the last hour"'
            onChange={(checked) => updateField("enableCartActivityNotifications", checked)}
          />

          <CheckboxField
            label="Recently Viewed (+5-10% conversion)"
            name="content.enableRecentlyViewedNotifications"
            checked={content.enableRecentlyViewedNotifications ?? false}
            helpText='Show "25 people viewed this in the last hour"'
            onChange={(checked) => updateField("enableRecentlyViewedNotifications", checked)}
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
            Display Settings
          </Text>
          <Divider />

          <SelectField
            label="Position"
            name="content.position"
            value={content.position || "bottom-left"}
            options={[
              { label: "Bottom Left", value: "bottom-left" },
              { label: "Bottom Right", value: "bottom-right" },
              { label: "Top Left", value: "top-left" },
              { label: "Top Right", value: "top-right" },
            ]}
            helpText="Where to display notifications on the page"
            onChange={(value) => {
              type PositionOption = "bottom-left" | "bottom-right" | "top-left" | "top-right";
              updateField("position", (value as PositionOption));
            }}
          />

          <FormGrid columns={3}>
            <TextField
              label="Display Duration (seconds)"
              name="content.displayDuration"
              value={content.displayDuration?.toString() || "5"}
              error={errors?.displayDuration}
              placeholder="5"
              helpText="How long each notification shows"
              onChange={(value) => updateField("displayDuration", parseInt(value) || 5)}
            />

            <TextField
              label="Rotation Interval (seconds)"
              name="content.rotationInterval"
              value={content.rotationInterval?.toString() || "8"}
              error={errors?.rotationInterval}
              placeholder="8"
              helpText="Time between notifications"
              onChange={(value) => updateField("rotationInterval", parseInt(value) || 8)}
            />

            <TextField
              label="Max Per Session"
              name="content.maxNotificationsPerSession"
              value={content.maxNotificationsPerSession?.toString() || "5"}
              error={errors?.maxNotificationsPerSession}
              placeholder="5"
              helpText="Limit per visitor"
              onChange={(value) => updateField("maxNotificationsPerSession", parseInt(value) || 5)}
            />
          </FormGrid>
        </BlockStack>
      </Card>

      {/* Data Settings */}
      <Card>
        <BlockStack gap="400">
          <Text as="h3" variant="headingMd">
            Data Settings
          </Text>
          <Text as="p" tone="subdued">
            Configure data sources and thresholds for notifications
          </Text>
          <Divider />

          <FormGrid columns={2}>
            <TextField
              label="Purchase Lookback (hours)"
              name="content.purchaseLookbackHours"
              value={content.purchaseLookbackHours?.toString() || "48"}
              error={errors?.purchaseLookbackHours}
              placeholder="48"
              helpText="Show purchases from last X hours"
              onChange={(value) => updateField("purchaseLookbackHours", parseInt(value) || 48)}
            />

            <TextField
              label="Low Stock Threshold"
              name="content.lowStockThreshold"
              value={content.lowStockThreshold?.toString() || "10"}
              error={errors?.lowStockThreshold}
              placeholder="10"
              helpText="Show alert when inventory ≤ X"
              onChange={(value) => updateField("lowStockThreshold", parseInt(value) || 10)}
            />

            <TextField
              label="Min Visitor Count"
              name="content.minVisitorCount"
              value={content.minVisitorCount?.toString() || "5"}
              error={errors?.minVisitorCount}
              placeholder="5"
              helpText="Minimum visitors to show count"
              onChange={(value) => updateField("minVisitorCount", parseInt(value) || 5)}
            />

            <TextField
              label="Min Review Rating"
              name="content.minReviewRating"
              value={content.minReviewRating?.toString() || "4.0"}
              error={errors?.minReviewRating}
              placeholder="4.0"
              helpText="Only show reviews ≥ X stars"
              onChange={(value) => updateField("minReviewRating", parseFloat(value) || 4.0)}
            />
          </FormGrid>
        </BlockStack>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <BlockStack gap="400">
          <Text as="h3" variant="headingMd">
            Privacy & Compliance
          </Text>
          <Text as="p" tone="subdued">
            GDPR-compliant privacy settings for customer data
          </Text>
          <Divider />

          <CheckboxField
            label="Anonymize Customer Names"
            name="content.anonymizeCustomerNames"
            checked={content.anonymizeCustomerNames ?? true}
            helpText='Show "John D." instead of "John Doe" (recommended for GDPR compliance)'
            onChange={(checked) => updateField("anonymizeCustomerNames", checked)}
          />

          <CheckboxField
            label="Show Customer Location"
            name="content.showCustomerLocation"
            checked={content.showCustomerLocation ?? true}
            helpText='Show city and state in purchase notifications (e.g., "New York, NY")'
            onChange={(checked) => updateField("showCustomerLocation", checked)}
          />
        </BlockStack>
      </Card>

      {/* Performance Tips */}
      <Banner tone="success">
        <BlockStack gap="200">
          <Text as="p" fontWeight="semibold">
            💡 Performance Tips
          </Text>
          <Text as="p">
            • Enable 3-5 notification types for best results<br />
            • Purchase + Visitor + Sales Count = highest impact combination<br />
            • Low Stock Alerts work best for limited inventory products<br />
            • All data is cached for 30-60 seconds for optimal performance
          </Text>
        </BlockStack>
      </Banner>
    </BlockStack>
  );
}

