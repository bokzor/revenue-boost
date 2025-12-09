/**
 * Social Proof Content Configuration Section
 *
 * Comprehensive form for configuring social proof notifications
 * Includes all Tier 1 & Tier 2 features with organized sections
 */

import { TextField, FormGrid, SelectField } from "../form";
import { useFieldUpdater } from "~/shared/hooks/useFieldUpdater";
import { Card, BlockStack, Text, Divider, Banner, Checkbox } from "@shopify/polaris";

export interface SocialProofContent {
  // Core notification types (Tier 1)
  enablePurchaseNotifications?: boolean;
  enableVisitorNotifications?: boolean;
  enableReviewNotifications?: boolean;

  // Additional notification types (Tier 2)
  enableSalesCountNotifications?: boolean;
  enableLowStockAlerts?: boolean;
  enableTrendingNotifications?: boolean;
  enableCartActivityNotifications?: boolean;
  enableRecentlyViewedNotifications?: boolean;

  // Display & rotation settings used by SocialProofPopup
  cornerPosition?: "bottom-left" | "bottom-right" | "top-left" | "top-right";
  displayDuration?: number; // seconds (1-30)
  rotationInterval?: number;
  maxNotificationsPerSession?: number;

  // Data thresholds used for filtering notifications
  minVisitorCount?: number;
  minReviewRating?: number;
  lowStockThreshold?: number;
  purchaseLookbackHours?: number;

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

      {/* Core Notification Types (Tier 1) */}
      <Card>
        <BlockStack gap="400">
          <Text as="h3" variant="headingMd">
            Core Notifications
          </Text>
          <Text as="p" tone="subdued">
            High-impact notifications that drive conversions. Enable the types that best fit your
            business.
          </Text>
          <Divider />

          <Checkbox
            label="Purchase Notifications (+15-25% conversion)"
            checked={content.enablePurchaseNotifications ?? true}
            helpText='"John D. from New York just purchased Classic T-Shirt"'
            onChange={(checked) => updateField("enablePurchaseNotifications", checked)}
          />

          <Checkbox
            label="Live Visitor Count (+10-18% conversion)"
            checked={content.enableVisitorNotifications ?? false}
            helpText='"23 people are viewing this product right now"'
            onChange={(checked) => updateField("enableVisitorNotifications", checked)}
          />

          <Checkbox
            label="Review Notifications (+5-10% conversion)"
            checked={content.enableReviewNotifications ?? false}
            helpText='"Emily just left a 5-star review"'
            onChange={(checked) => updateField("enableReviewNotifications", checked)}
          />
        </BlockStack>
      </Card>

      {/* Additional Notification Types (Tier 2) */}
      <Card>
        <BlockStack gap="400">
          <Text as="h3" variant="headingMd">
            Additional Notifications
          </Text>
          <Text as="p" tone="subdued">
            Extra notification types for more variety. Enable selectively to avoid overwhelming
            visitors.
          </Text>
          <Divider />

          <Checkbox
            label="Sales Count (24h)"
            checked={content.enableSalesCountNotifications ?? false}
            helpText='"47 people bought this in the last 24 hours"'
            onChange={(checked) => updateField("enableSalesCountNotifications", checked)}
          />

          <Checkbox
            label="Low Stock Alerts"
            checked={content.enableLowStockAlerts ?? false}
            helpText='"Only 3 left in stock!" - Creates urgency'
            onChange={(checked) => updateField("enableLowStockAlerts", checked)}
          />

          <Checkbox
            label="Trending Products"
            checked={content.enableTrendingNotifications ?? false}
            helpText='"🔥 Trending - 50+ views today"'
            onChange={(checked) => updateField("enableTrendingNotifications", checked)}
          />

          <Checkbox
            label="Cart Activity"
            checked={content.enableCartActivityNotifications ?? false}
            helpText='"3 people added this to cart in the last hour"'
            onChange={(checked) => updateField("enableCartActivityNotifications", checked)}
          />

          <Checkbox
            label="Recently Viewed"
            checked={content.enableRecentlyViewedNotifications ?? false}
            helpText='"15 people viewed this in the last hour"'
            onChange={(checked) => updateField("enableRecentlyViewedNotifications", checked)}
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
              value={content.rotationInterval?.toString() ?? ""}
              error={errors?.rotationInterval}
              placeholder="8"
              helpText="Time between notifications (storefront rotation interval)"
              onChange={(value) => updateField("rotationInterval", value === "" ? undefined : parseInt(value))}
            />

            <TextField
              label="Max Notifications Per Session"
              name="content.maxNotificationsPerSession"
              value={content.maxNotificationsPerSession?.toString() ?? ""}
              error={errors?.maxNotificationsPerSession}
              placeholder="5"
              helpText="Hard cap per visitor for this campaign"
              onChange={(value) => updateField("maxNotificationsPerSession", value === "" ? undefined : parseInt(value))}
            />
          </FormGrid>

          <FormGrid columns={2}>
            <TextField
              label="Min Visitor Count"
              name="content.minVisitorCount"
              value={content.minVisitorCount?.toString() ?? ""}
              error={errors?.minVisitorCount}
              placeholder="5"
              helpText="Only show visitor notifications when at least this many visitors are active"
              onChange={(value) => updateField("minVisitorCount", value === "" ? undefined : parseInt(value))}
            />

            <TextField
              label="Min Review Rating"
              name="content.minReviewRating"
              value={content.minReviewRating?.toString() ?? ""}
              error={errors?.minReviewRating}
              placeholder="4.0"
              helpText="Only show review notifications with rating >= this value"
              onChange={(value) => updateField("minReviewRating", value === "" ? undefined : parseFloat(value))}
            />
          </FormGrid>

          <FormGrid columns={2}>
            <TextField
              label="Low Stock Threshold"
              name="content.lowStockThreshold"
              value={content.lowStockThreshold?.toString() ?? ""}
              error={errors?.lowStockThreshold}
              placeholder="10"
              helpText="Show low stock alert when inventory is at or below this number"
              onChange={(value) => updateField("lowStockThreshold", value === "" ? undefined : parseInt(value))}
            />

            <TextField
              label="Purchase Lookback (hours)"
              name="content.purchaseLookbackHours"
              value={content.purchaseLookbackHours?.toString() ?? ""}
              error={errors?.purchaseLookbackHours}
              placeholder="48"
              helpText="How far back to look for recent purchases (1-168 hours)"
              onChange={(value) => updateField("purchaseLookbackHours", value === "" ? undefined : parseInt(value))}
            />
          </FormGrid>

          <BlockStack gap="200">
            <Checkbox
              label="Show Product Image"
              checked={content.showProductImage ?? true}
              helpText="Include product image in purchase notifications on the storefront"
              onChange={(checked) => updateField("showProductImage", checked)}
            />

            <Checkbox
              label="Show Time Ago"
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
