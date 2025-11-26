/**
 * Condition Builder - Visual builder for trigger conditions
 *
 * Based on research from docs/ui-analysis/:
 * - Discovery #27: "Condition builder uses dropdowns, not code"
 * - Discovery #28: "AND/OR logic between conditions"
 * - Discovery #29: "Add/remove condition buttons"
 *
 * Features:
 * - Visual condition rows
 * - Dropdown selectors (no code)
 * - AND/OR logic toggle
 * - Add/remove conditions
 * - Validation
 */

// React import not needed with JSX transform
import { BlockStack, InlineStack, Button, ButtonGroup, Text, Box } from "@shopify/polaris";
import { ConditionRow } from "./ConditionRow";
import type { TriggerCondition, LogicOperator } from "./types";
import styles from "./ConditionBuilder.module.css";

export interface ConditionBuilderProps {
  conditions: TriggerCondition[];
  logicOperator: LogicOperator;
  onUpdateCondition: (id: string, updates: Partial<TriggerCondition>) => void;
  onRemoveCondition: (id: string) => void;
  onLogicOperatorChange: (operator: LogicOperator) => void;
}

export function ConditionBuilder({
  conditions,
  logicOperator,
  onUpdateCondition,
  onRemoveCondition,
  onLogicOperatorChange,
}: ConditionBuilderProps) {
  return (
    <BlockStack gap="300">
      {/* Logic Operator Toggle (only show if multiple conditions) */}
      {conditions.length > 1 && (
        <Box>
          <InlineStack gap="200" blockAlign="center">
            <Text as="span" variant="bodySm" tone="subdued">
              Match
            </Text>
            <ButtonGroup variant="segmented">
              <Button
                pressed={logicOperator === "AND"}
                onClick={() => onLogicOperatorChange("AND")}
                size="slim"
              >
                ALL
              </Button>
              <Button
                pressed={logicOperator === "OR"}
                onClick={() => onLogicOperatorChange("OR")}
                size="slim"
              >
                ANY
              </Button>
            </ButtonGroup>
            <Text as="span" variant="bodySm" tone="subdued">
              of the following conditions:
            </Text>
          </InlineStack>
        </Box>
      )}

      {/* Condition Rows */}
      <BlockStack gap="200">
        {conditions.map((condition, index) => (
          <div key={condition.id}>
            <ConditionRow
              condition={condition}
              onUpdate={(updates) => onUpdateCondition(condition.id, updates)}
              onRemove={() => onRemoveCondition(condition.id)}
              showRemove={conditions.length > 1}
            />

            {/* Logic Operator Label (between conditions) */}
            {index < conditions.length - 1 && (
              <Box paddingBlock="200">
                <div className={styles.logicLabel}>
                  <Text as="span" variant="bodySm" fontWeight="semibold" tone="subdued">
                    {logicOperator}
                  </Text>
                </div>
              </Box>
            )}
          </div>
        ))}
      </BlockStack>
    </BlockStack>
  );
}
