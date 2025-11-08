// React import not needed with JSX transform
import { Card, BlockStack, Text, Checkbox, Button } from "@shopify/polaris";

interface ConditionalTriggerPanelProps {
  showToAll?: boolean;
  conditions?: Array<any>;
  logicOperator?: "AND" | "OR";
  onModeChange?: (showToAll: boolean) => void;
  onConditionsChange?: (conditions: Array<any>) => void;
  onLogicOperatorChange?: (operator: "AND" | "OR") => void;
}

export function ConditionalTriggerPanel({
  showToAll = true,
  conditions = [],
  onModeChange,
  onConditionsChange,
}: ConditionalTriggerPanelProps) {
  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h3" variant="headingMd">
          Conditional Trigger Rules
        </Text>

        <Checkbox
          label="Show to all visitors"
          checked={showToAll}
          onChange={(checked) => onModeChange?.(checked)}
          helpText="When enabled, popup shows to all visitors. Disable to add specific conditions."
        />

        {!showToAll && (
          <BlockStack gap="300">
            <Text as="p" variant="bodySm" tone="subdued">
              Add conditions to control when the popup appears
            </Text>

            <Button
              onClick={() =>
                onConditionsChange?.([
                  ...conditions,
                  { type: "url_contains", value: "" },
                ])
              }
            >
              Add Condition
            </Button>
          </BlockStack>
        )}
      </BlockStack>
    </Card>
  );
}
