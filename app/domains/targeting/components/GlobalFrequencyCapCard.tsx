/**
 * Global Frequency Cap Card Component
 *
 * Configure cross-campaign coordination
 */

import { Card, BlockStack, Checkbox, Text, Banner, Box } from "@shopify/polaris";

interface GlobalFrequencyCapCardProps {
  respectGlobalCap: boolean;
  onGlobalCapChange: (respectGlobalCap: boolean) => void;
}

export function GlobalFrequencyCapCard({
  respectGlobalCap,
  onGlobalCapChange,
}: GlobalFrequencyCapCardProps) {
  return (
    <Card>
      <Box padding="400">
        <BlockStack gap="400">
          <Text as="h3" variant="headingMd">
            Cross-Campaign Coordination
          </Text>

          <Text as="p" variant="bodySm" tone="subdued">
            Prevent popup fatigue by coordinating with other campaigns
          </Text>

          <Checkbox
            label="Respect global frequency cap"
            checked={respectGlobalCap}
            onChange={onGlobalCapChange}
            helpText="Coordinate with other campaigns to avoid showing too many popups"
          />

          {respectGlobalCap ? (
            <Banner tone="success">
              <p>
                <strong>Global coordination enabled:</strong> This campaign will respect the global
                frequency limits set across all your campaigns. This helps prevent showing too many
                popups to the same visitor, even if they come from different campaigns.
              </p>
              <p style={{ marginTop: "8px" }}>
                You can configure global limits in the Frequency Capping Dashboard.
              </p>
            </Banner>
          ) : (
            <Banner tone="warning">
              <p>
                <strong>Independent frequency tracking:</strong> This campaign will track frequency
                independently. Visitors may see multiple popups if they match multiple campaigns.
              </p>
              <p style={{ marginTop: "8px" }}>
                Consider enabling global coordination if you have multiple active campaigns.
              </p>
            </Banner>
          )}
        </BlockStack>
      </Box>
    </Card>
  );
}
