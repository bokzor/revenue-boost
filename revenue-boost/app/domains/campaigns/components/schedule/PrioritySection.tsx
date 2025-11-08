/**
 * PrioritySection - Campaign priority configuration
 * 
 * SOLID Compliance:
 * - Single Responsibility: Only handles priority selection
 * - Component is <50 lines
 */

import { Card, BlockStack, Text, FormLayout, RangeSlider, Box } from "@shopify/polaris";
import { getPriorityDescription } from "../../utils/schedule-helpers";

interface PrioritySectionProps {
  priority: number;
  onPriorityChange: (priority: number) => void;
}

export function PrioritySection({ priority, onPriorityChange }: PrioritySectionProps) {
  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h3" variant="headingMd">
          Campaign Priority
        </Text>
        <Text as="p" variant="bodySm" tone="subdued">
          Set the priority level when multiple campaigns match the same visitor.
        </Text>

        <FormLayout>
          <Box>
            <Text as="p" variant="bodyMd">
              Priority: {priority}
            </Text>
            <RangeSlider
              label="Priority level"
              value={priority}
              onChange={(value) => onPriorityChange(typeof value === "number" ? value : value[0])}
              output
              min={0}
              max={10}
              step={1}
              helpText={getPriorityDescription(priority)}
            />
          </Box>
        </FormLayout>
      </BlockStack>
    </Card>
  );
}

