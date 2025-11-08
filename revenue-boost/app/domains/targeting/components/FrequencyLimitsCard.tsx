/**
 * Frequency Limits Card Component
 * 
 * Configure maximum views, time window, and cooldown period
 */

import {
  Card,
  BlockStack,
  Text,
  TextField,
  Select,
  Banner,
  Box,
  InlineStack,
} from "@shopify/polaris";
import {
  TIME_WINDOW_OPTIONS,
  COOLDOWN_OPTIONS,
} from "~/domains/targeting/utils/frequency-capping-helpers";

interface FrequencyLimitsCardProps {
  maxViews: number;
  timeWindow: number;
  cooldownHours?: number;
  onMaxViewsChange: (value: string) => void;
  onTimeWindowChange: (value: string) => void;
  onCooldownChange: (value: string) => void;
}

export function FrequencyLimitsCard({
  maxViews,
  timeWindow,
  cooldownHours = 0,
  onMaxViewsChange,
  onTimeWindowChange,
  onCooldownChange,
}: FrequencyLimitsCardProps) {
  return (
    <Card>
      <Box padding="400">
        <BlockStack gap="400">
          <Text as="h3" variant="headingMd">
            Frequency Limits
          </Text>

          <Text as="p" variant="bodySm" tone="subdued">
            Control how often this popup can be shown to the same visitor
          </Text>

          <InlineStack gap="400" blockAlign="end">
            <div style={{ flex: 1 }}>
              <TextField
                label="Maximum views"
                type="number"
                value={maxViews.toString()}
                onChange={onMaxViewsChange}
                min={1}
                autoComplete="off"
                helpText="How many times can this popup be shown"
              />
            </div>

            <div style={{ flex: 1 }}>
              <Select
                label="Time window"
                options={TIME_WINDOW_OPTIONS}
                value={timeWindow.toString()}
                onChange={onTimeWindowChange}
                helpText="Within what time period"
              />
            </div>
          </InlineStack>

          <div style={{ maxWidth: "300px" }}>
            <Select
              label="Cooldown period"
              options={COOLDOWN_OPTIONS}
              value={cooldownHours.toString()}
              onChange={onCooldownChange}
              helpText="Minimum time between popup displays"
            />
          </div>

          <Banner tone="info">
            <p>
              <strong>Current setting:</strong> This popup will be shown a
              maximum of{" "}
              <strong>
                {maxViews} time{maxViews !== 1 ? "s" : ""}
              </strong>{" "}
              {TIME_WINDOW_OPTIONS.find(opt => opt.value === timeWindow.toString())?.label.toLowerCase() || "per day"} to each visitor.
              {cooldownHours > 0 && (
                <span>
                  {" "}
                  With a <strong>{cooldownHours < 1 ? `${cooldownHours * 60} minute` : `${cooldownHours} hour`}</strong>{" "}
                  cooldown between displays.
                </span>
              )}
            </p>
          </Banner>
        </BlockStack>
      </Box>
    </Card>
  );
}

