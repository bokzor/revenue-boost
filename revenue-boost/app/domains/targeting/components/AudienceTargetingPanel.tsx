/**
 * Audience Targeting Panel - Configure campaign audience targeting
 *
 * Allows merchants to:
 * - Enable/disable audience targeting
 * - Select predefined segments (VIP, Cart Abandoners, Mobile, etc.)
 * - Create custom targeting rules
 * - Preview matched audience
 */

import { useState, useCallback, useMemo } from "react";
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
import type { AudienceTargetingConfig } from "~/domains/campaigns/types/campaign";
import { toUiConfig, toDbConfig } from "~/domains/targeting/utils/condition-adapter";


export interface AudienceTargetingPanelProps {
  storeId: string;
  config: AudienceTargetingConfig;
  onConfigChange: (config: AudienceTargetingConfig) => void;
  disabled?: boolean;
}

// Note: The panel now strictly accepts AudienceTargetingConfig and adapts it for the UI

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

  // Derive UI-friendly custom rules from DB config
  const uiCustom = useMemo(() => toUiConfig(config), [config]);

  // Update custom rules via adapter (UI -> DB)
  const updateCustomRules = useCallback(
    (
      updates: Partial<{
        enabled: boolean;
        conditions: TriggerCondition[];
        logicOperator: LogicOperator;
      }>,
    ) => {
      const nextUi = { ...uiCustom, ...updates };
      updateConfig({
        customRules: toDbConfig(nextUi),
      });
    },
    [uiCustom, updateConfig],
  );

  // Add new condition
  const handleAddCondition = useCallback(() => {
    const newCondition: TriggerCondition = {
      id: `condition_${Date.now()}`,
      type: "cart-value",
      operator: "greater-than",
      value: 0,
    };

    const conditions = uiCustom.conditions || [];
    updateCustomRules({
      conditions: [...conditions, newCondition],
    });
  }, [uiCustom.conditions, updateCustomRules]);

  // Update condition
  const handleUpdateCondition = useCallback(
    (id: string, updates: Partial<TriggerCondition>) => {
      const conditions = uiCustom.conditions || [];
      updateCustomRules({
        conditions: conditions.map((c: TriggerCondition) => (c.id === id ? { ...c, ...updates } : c)),
      });
    },
    [config?.customRules, updateCustomRules],
  );

  // Remove condition
  const handleRemoveCondition = useCallback(
    (id: string) => {
      const conditions = uiCustom.conditions || [];
      updateCustomRules({
        conditions: conditions.filter((c: TriggerCondition) => c.id !== id),
      });
    },
    [config?.customRules, updateCustomRules],
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

  const segments = (config?.segments ?? []) as string[];
  const hasSegments = segments.length > 0;
  const hasCustomRules = uiCustom.enabled && (uiCustom.conditions?.length ?? 0) > 0;
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
                    selectedSegments={config.segments ?? []}
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
                        checked={uiCustom.enabled}
                        onChange={(checked) =>
                          updateCustomRules({ enabled: checked })
                        }
                        disabled={disabled}
                      />
                    </InlineStack>

                    {uiCustom.enabled && (
                      <BlockStack gap="400">
                        {uiCustom.conditions.length > 0 ? (
                          <ConditionBuilder
                            conditions={uiCustom.conditions}
                            logicOperator={uiCustom.logicOperator}
                            onUpdateCondition={handleUpdateCondition}
                            onRemoveCondition={handleRemoveCondition}
                            onLogicOperatorChange={(operator) =>
                              updateCustomRules({ logicOperator: operator })
                            }
                          />
                        ) : (
                          <Banner tone="info">
                            <Text as="p" variant="bodySm">
                              No custom rules yet. Click &quot;Add condition&quot; to
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
                    {segments.length} selected
                  </Text>
                </InlineStack>
              )}

              {hasCustomRules && (
                <InlineStack gap="200" blockAlign="center">
                  <Text as="span" variant="bodySm" fontWeight="semibold">
                    Custom Rules:
                  </Text>
                  <Text as="span" variant="bodySm">
                    {uiCustom.conditions.length} condition(s) with {uiCustom.logicOperator} logic
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
