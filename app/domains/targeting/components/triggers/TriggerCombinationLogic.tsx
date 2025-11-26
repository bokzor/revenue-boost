/**
 * TriggerCombinationLogic - Configure how multiple triggers work together
 *
 * Single Responsibility: Configure trigger combination logic (AND/OR)
 */

import { Card, BlockStack, Text, ChoiceList, Banner } from "@shopify/polaris";
import type { EnhancedTriggerConfig } from "~/domains/targeting/types/enhanced-triggers.types";

interface TriggerCombinationLogicProps {
  config: EnhancedTriggerConfig;
  onChange: (config: EnhancedTriggerConfig) => void;
}

export function TriggerCombinationLogic({ config, onChange }: TriggerCombinationLogicProps) {
  const updateConfig = (operator: "AND" | "OR") => {
    onChange({
      ...config,
      trigger_combination: {
        ...(typeof config.trigger_combination === "object" && config.trigger_combination !== null
          ? config.trigger_combination
          : {}),
        operator,
      },
    });
  };

  return (
    <Card>
      <BlockStack gap="300">
        <Text as="span" variant="headingSm">
          Trigger Combination
        </Text>
        <Text as="p" variant="bodyMd" tone="subdued">
          When multiple triggers are enabled, choose how they should work together.
        </Text>

        <ChoiceList
          title="How should multiple triggers work?"
          choices={[
            {
              label: "Show popup when ANY enabled trigger fires (OR)",
              value: "OR",
            },
            {
              label: "Show popup only when ALL enabled triggers fire (AND)",
              value: "AND",
            },
          ]}
          selected={[config.trigger_combination?.operator || "OR"]}
          onChange={(selected) => updateConfig(selected[0] as "AND" | "OR")}
        />

        <Banner tone="info">
          <p>
            <strong>OR logic (recommended):</strong> Popup shows when any enabled trigger activates.
            More flexible and catches more visitors.
          </p>
          <p>
            <strong>AND logic:</strong> Popup shows only when all enabled triggers activate
            simultaneously. More restrictive but highly targeted.
          </p>
        </Banner>
      </BlockStack>
    </Card>
  );
}
