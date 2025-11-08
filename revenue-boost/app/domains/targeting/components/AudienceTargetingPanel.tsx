/**
 * Audience Targeting Panel - Configure campaign audience targeting
 *
 * Allows merchants to:
 * - Enable/disable audience targeting
 * - Select predefined segments (VIP, Cart Abandoners, Mobile, etc.)
 * - Create custom targeting rules
 * - Preview matched audience
 */

import { useState, useCallback } from "react";
import {
  Card,
  BlockStack,
  InlineStack,
  Text,
  Checkbox,
  Button,
  Banner,
  Box,
  Tabs,
} from "@shopify/polaris";
import { PlusIcon } from "@shopify/polaris-icons";
import { SegmentSelector } from "./SegmentSelector";
import { ConditionBuilder } from "./ConditionBuilder";
import type { TriggerCondition, LogicOperator } from "./types";

export interface AudienceTargetingConfig {
  enabled: boolean;
  segments: string[];
  customRules: {
    enabled: boolean;
    conditions: TriggerCondition[];
    logicOperator: LogicOperator;
  };
}

export interface AudienceTargetingPanelProps {
  storeId: string;
  config: AudienceTargetingConfig;
  onConfigChange: (config: AudienceTargetingConfig) => void;
  disabled?: boolean;
}

export function AudienceTargetingPanel({
  storeId,
  config,
  onConfigChange,
  disabled = false,
}: AudienceTargetingPanelProps) {
  const [selectedTab, setSelectedTab] = useState(0);

  // Update config helper
  const updateConfig = useCallback(
    (updates: Partial<AudienceTargetingConfig>) => {
      onConfigChange({ ...config, ...updates });
    },
    [config, onConfigChange],
  );

  // Update custom rules helper
  const updateCustomRules = useCallback(
    (updates: Partial<AudienceTargetingConfig["customRules"]>) => {
      updateConfig({
        customRules: { ...config.customRules, ...updates },
      });
    },
    [config.customRules, updateConfig],
  );

  // Add new condition
  const handleAddCondition = useCallback(() => {
    const newCondition: TriggerCondition = {
      id: `condition_${Date.now()}`,
      type: "cart-value",
      operator: "greater-than",
      value: 0,
    };

    updateCustomRules({
      conditions: [...config.customRules.conditions, newCondition],
    });
  }, [config.customRules.conditions, updateCustomRules]);

  // Update condition
  const handleUpdateCondition = useCallback(
    (id: string, updates: Partial<TriggerCondition>) => {
      updateCustomRules({
        conditions: config.customRules.conditions.map((c) =>
          c.id === id ? { ...c, ...updates } : c,
        ),
      });
    },
    [config.customRules.conditions, updateCustomRules],
  );

  // Remove condition
  const handleRemoveCondition = useCallback(
    (id: string) => {
      updateCustomRules({
        conditions: config.customRules.conditions.filter((c) => c.id !== id),
      });
    },
    [config.customRules.conditions, updateCustomRules],
  );

  const tabs = [
    {
      id: "segments",
      content: "Predefined Segments",
      panelID: "segments-panel",
    },
    {
      id: "custom",
      content: "Custom Rules",
      panelID: "custom-panel",
    },
  ];

  const hasSegments = config.segments.length > 0;
  const hasCustomRules =
    config.customRules.enabled && config.customRules.conditions.length > 0;
  const hasTargeting = hasSegments || hasCustomRules;

  return (
    <BlockStack gap="400">
      {/* Enable/Disable Toggle */}
      <Card>
        <BlockStack gap="400">
          <Checkbox
            label="Enable audience targeting"
            checked={config.enabled}
            onChange={(checked) => updateConfig({ enabled: checked })}
            disabled={disabled}
            helpText="Only show this campaign to specific audience segments"
          />

          {config.enabled && (
            <Banner tone="info">
              <Text as="p" variant="bodySm">
                Your campaign will only show to visitors who match the selected
                segments or custom rules below.
              </Text>
            </Banner>
          )}
        </BlockStack>
      </Card>

      {/* Targeting Configuration (only show if enabled) */}
      {config.enabled && (
        <Card>
          <BlockStack gap="400">
            <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab}>
              {/* Predefined Segments Tab */}
              {selectedTab === 0 && (
                <Box paddingBlockStart="400">
                  <SegmentSelector
                    storeId={storeId}
                    selectedSegments={config.segments}
                    onSegmentsChange={(segments) => updateConfig({ segments })}
                    disabled={disabled}
                  />
                </Box>
              )}

              {/* Custom Rules Tab */}
              {selectedTab === 1 && (
                <Box paddingBlockStart="400">
                  <BlockStack gap="400">
                    <InlineStack align="space-between" blockAlign="center">
                      <BlockStack gap="100">
                        <Text as="h3" variant="headingSm">
                          Custom Targeting Rules
                        </Text>
                        <Text as="p" variant="bodySm" tone="subdued">
                          Create advanced targeting rules based on cart value,
                          customer tags, device type, and more.
                        </Text>
                      </BlockStack>

                      <Checkbox
                        label="Enable custom rules"
                        checked={config.customRules.enabled}
                        onChange={(checked) =>
                          updateCustomRules({ enabled: checked })
                        }
                        disabled={disabled}
                      />
                    </InlineStack>

                    {config.customRules.enabled && (
                      <BlockStack gap="400">
                        {config.customRules.conditions.length > 0 ? (
                          <ConditionBuilder
                            conditions={config.customRules.conditions}
                            logicOperator={config.customRules.logicOperator}
                            onUpdateCondition={handleUpdateCondition}
                            onRemoveCondition={handleRemoveCondition}
                            onLogicOperatorChange={(operator) =>
                              updateCustomRules({ logicOperator: operator })
                            }
                          />
                        ) : (
                          <Banner tone="info">
                            <Text as="p" variant="bodySm">
                              No custom rules yet. Click "Add condition" to
                              create your first targeting rule.
                            </Text>
                          </Banner>
                        )}

                        <Box>
                          <Button
                            icon={PlusIcon}
                            onClick={handleAddCondition}
                            disabled={disabled}
                          >
                            Add condition
                          </Button>
                        </Box>
                      </BlockStack>
                    )}
                  </BlockStack>
                </Box>
              )}
            </Tabs>
          </BlockStack>
        </Card>
      )}

      {/* Summary */}
      {config.enabled && hasTargeting && (
        <Card>
          <BlockStack gap="300">
            <Text as="h3" variant="headingSm">
              Targeting Summary
            </Text>

            <BlockStack gap="200">
              {hasSegments && (
                <InlineStack gap="200" blockAlign="center">
                  <Text as="span" variant="bodySm" fontWeight="semibold">
                    Segments:
                  </Text>
                  <Text as="span" variant="bodySm">
                    {config.segments.length} selected
                  </Text>
                </InlineStack>
              )}

              {hasCustomRules && (
                <InlineStack gap="200" blockAlign="center">
                  <Text as="span" variant="bodySm" fontWeight="semibold">
                    Custom Rules:
                  </Text>
                  <Text as="span" variant="bodySm">
                    {config.customRules.conditions.length} condition(s) with{" "}
                    {config.customRules.logicOperator} logic
                  </Text>
                </InlineStack>
              )}

              {hasSegments && hasCustomRules && (
                <Banner tone="info">
                  <Text as="p" variant="bodySm">
                    Visitors must match <strong>either</strong> a selected
                    segment <strong>or</strong> the custom rules to see this
                    campaign.
                  </Text>
                </Banner>
              )}
            </BlockStack>
          </BlockStack>
        </Card>
      )}
    </BlockStack>
  );
}
