/**
 * Frequency Capping Toggle Component
 * 
 * Enable/disable toggle with informational banner
 */

import { Card, BlockStack, Checkbox, Banner, Box } from "@shopify/polaris";

interface FrequencyCappingToggleProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
}

export function FrequencyCappingToggle({
  enabled,
  onEnabledChange,
}: FrequencyCappingToggleProps) {
  return (
    <Card>
      <Box padding="400">
        <BlockStack gap="400">
          <Checkbox
            label="Enable frequency capping"
            checked={enabled}
            onChange={onEnabledChange}
            helpText="Limit how often this popup is shown to the same visitor to prevent fatigue"
          />

          {!enabled && (
            <Banner tone="info">
              <p>
                Without frequency capping, this popup may be shown repeatedly
                to the same visitor. This can lead to a poor user experience
                and lower conversion rates.
              </p>
            </Banner>
          )}
        </BlockStack>
      </Box>
    </Card>
  );
}

