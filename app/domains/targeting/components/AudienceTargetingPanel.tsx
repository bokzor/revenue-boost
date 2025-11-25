/**
 * Audience Targeting Panel - Configure campaign audience targeting
 *
 * Shopify-first audience model:
 * - Shopify customer segments define customer-level "who" for known customers.
 * - Session rules define anonymous/session-only audience logic on StorefrontContext.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Card,
  BlockStack,
  InlineStack,
  Text,
  Checkbox,
  Banner,
  Box,
  Button,
} from "@shopify/polaris";
import type { AudienceTargetingConfig } from "~/domains/campaigns/types/campaign";
import {
  audienceConditionsToUi,
  uiConditionsToAudience,
} from "~/domains/targeting/utils/condition-adapter";
import type { TriggerCondition, LogicOperator } from "./types";
import { ConditionBuilder } from "./ConditionBuilder";
import { ShopifySegmentSelector, type ShopifySegmentOption } from "./ShopifySegmentSelector";

const computePreviewConfigKey = (config: AudienceTargetingConfig) => {
  const sessionRules = config.sessionRules ?? {
    enabled: false,
    conditions: [],
    logicOperator: "AND" as LogicOperator,
  };

  return JSON.stringify({
    enabled: config.enabled,
    shopifySegmentIds: config.shopifySegmentIds ?? [],
    sessionRules,
  });
};

export interface AudienceTargetingPanelProps {
  storeId: string;
  config: AudienceTargetingConfig;
  onConfigChange: (config: AudienceTargetingConfig) => void;
  disabled?: boolean;
}

export function AudienceTargetingPanel({
  storeId, // currently unused but kept for future Shopify segment selector
  config,
  onConfigChange,
  disabled = false,
}: AudienceTargetingPanelProps) {
  const updateConfig = useCallback(
    (updates: Partial<AudienceTargetingConfig>) => {
      onConfigChange({ ...config, ...updates });
    },
    [config, onConfigChange]
  );

  // ---------------------------------------------------------------------------
  // Session Rules (anonymous / session-level audience logic)
  // ---------------------------------------------------------------------------

  const sessionUi = audienceConditionsToUi(config.sessionRules?.conditions ?? []);
  const hasSessionRules = (config.sessionRules?.enabled ?? false) && sessionUi.length > 0;
  const hasShopifySegments = (config.shopifySegmentIds?.length ?? 0) > 0;
  const hasTargeting = hasShopifySegments || hasSessionRules;

  const [shopifySegments, setShopifySegments] = useState<ShopifySegmentOption[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewTotal, setPreviewTotal] = useState<number | null>(null);
  const [previewBreakdown, setPreviewBreakdown] = useState<
    { segmentId: string; totalCustomers: number }[]
  >([]);
  const [autoPreviewEnabled, setAutoPreviewEnabled] = useState(true);
  const [lastPreviewConfigKey, setLastPreviewConfigKey] = useState<string | null>(null);

  const previewConfigKey = useMemo(() => computePreviewConfigKey(config), [config]);

  const isPreviewStale = lastPreviewConfigKey !== null && previewConfigKey !== lastPreviewConfigKey;

  const refreshPreview = useCallback(async () => {
    if (!config.enabled) return;

    if (!hasTargeting) {
      setPreviewTotal(0);
      setPreviewError(null);
      setPreviewBreakdown([]);
      setLastPreviewConfigKey(computePreviewConfigKey(config));
      return;
    }

    setPreviewLoading(true);
    setPreviewError(null);

    try {
      const response = await fetch("/api/audience/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audienceTargeting: config }),
      });

      const json = await response.json();

      if (!response.ok || json.success === false) {
        throw new Error(json.error || "Failed to fetch audience preview");
      }

      const total = json.data?.estimatedReach?.totalCustomers ?? 0;
      const perSegment =
        (json.data?.estimatedReach?.perSegment as
          | { segmentId: string; totalCustomers: number }[]
          | undefined) ?? [];

      setPreviewTotal(total);
      setPreviewBreakdown(perSegment);
      setLastPreviewConfigKey(computePreviewConfigKey(config));
    } catch (err) {
      console.error("Failed to refresh audience preview:", err);
      setPreviewTotal(null);
      setPreviewBreakdown([]);
      setPreviewError(err instanceof Error ? err.message : "Failed to fetch audience preview");
    } finally {
      setPreviewLoading(false);
    }
  }, [config, hasTargeting]);

  useEffect(() => {
    if (!config.enabled || !hasTargeting || !autoPreviewEnabled) return;
    if (lastPreviewConfigKey === previewConfigKey) return;

    const timer = setTimeout(() => {
      refreshPreview();
    }, 800);

    return () => clearTimeout(timer);
  }, [
    config.enabled,
    hasTargeting,
    autoPreviewEnabled,
    previewConfigKey,
    lastPreviewConfigKey,
    refreshPreview,
  ]);

  const updateSessionRules = useCallback(
    (
      updates: Partial<{
        enabled: boolean;
        conditions: TriggerCondition[];
        logicOperator: LogicOperator;
      }>
    ) => {
      const nextUi: {
        enabled: boolean;
        conditions: TriggerCondition[];
        logicOperator: LogicOperator;
      } = {
        enabled: config.sessionRules?.enabled ?? false,
        conditions: sessionUi,
        logicOperator: (config.sessionRules?.logicOperator as LogicOperator) ?? "AND",
        ...updates,
      };

      updateConfig({
        sessionRules: {
          enabled: nextUi.enabled,
          conditions: uiConditionsToAudience(nextUi.conditions),
          logicOperator: nextUi.logicOperator,
        },
      });
    },
    [config.sessionRules?.enabled, config.sessionRules?.logicOperator, sessionUi, updateConfig]
  );

  const handleAddSessionCondition = useCallback(() => {
    const newCondition: TriggerCondition = {
      id: `session_${Date.now()}`,
      type: "cart-value",
      operator: "greater-than",
      value: 0,
    };

    const conditions = sessionUi || [];
    updateSessionRules({ conditions: [...conditions, newCondition], enabled: true });
  }, [sessionUi, updateSessionRules]);

  const handleUpdateSessionCondition = useCallback(
    (id: string, updates: Partial<TriggerCondition>) => {
      const conditions = sessionUi || [];
      updateSessionRules({
        conditions: conditions.map((c: TriggerCondition) =>
          c.id === id ? { ...c, ...updates } : c
        ),
      });
    },
    [sessionUi, updateSessionRules]
  );

  const handleRemoveSessionCondition = useCallback(
    (id: string) => {
      const conditions = sessionUi || [];
      updateSessionRules({
        conditions: conditions.filter((c: TriggerCondition) => c.id !== id),
      });
    },
    [sessionUi, updateSessionRules]
  );

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
            helpText="Only show this campaign to a subset of visitors based on segments and session rules."
            data-test-id="audience-targeting-enabled-checkbox"
          />

          {config.enabled && (
            <Banner tone="info">
              <Text as="p" variant="bodySm">
                Your campaign will only show to visitors who match your Shopify customer segments
                and/or the session rules configured below.
              </Text>
            </Banner>
          )}
        </BlockStack>
      </Card>

      {config.enabled && (
        <Card>
          <BlockStack gap="400">
            <Text as="h3" variant="headingSm">
              Shopify customer segments
            </Text>
            <Text as="p" variant="bodySm" tone="subdued">
              Choose which Shopify customer segments this campaign should target. These filters
              apply when the visitor is recognized as a customer.
            </Text>

            <ShopifySegmentSelector
              selectedSegmentIds={config.shopifySegmentIds ?? []}
              onChange={(ids) => updateConfig({ shopifySegmentIds: ids })}
              disabled={disabled}
              onSegmentsLoaded={setShopifySegments}
            />
          </BlockStack>
        </Card>
      )}

      {/* Session Rules (only show if enabled) */}
      {config.enabled && (
        <Card>
          <BlockStack gap="400">
            <InlineStack align="space-between" blockAlign="center">
              <BlockStack gap="100">
                <Text as="h3" variant="headingSm">
                  Session Rules (anonymous / in-session)
                </Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  Define rules based on current session context like cart value or page type. These
                  rules apply even when the visitor is not yet a Shopify customer.
                </Text>
              </BlockStack>

              <Checkbox
                label="Enable session rules"
                checked={config.sessionRules?.enabled ?? false}
                onChange={(checked) => updateSessionRules({ enabled: checked })}
                disabled={disabled}
              />
            </InlineStack>

            {config.sessionRules?.enabled && (
              <BlockStack gap="400">
                {sessionUi.length > 0 ? (
                  <ConditionBuilder
                    conditions={sessionUi}
                    logicOperator={(config.sessionRules?.logicOperator as LogicOperator) ?? "AND"}
                    onUpdateCondition={handleUpdateSessionCondition}
                    onRemoveCondition={handleRemoveSessionCondition}
                    onLogicOperatorChange={(operator) =>
                      updateSessionRules({ logicOperator: operator })
                    }
                  />
                ) : (
                  <Banner tone="info">
                    <Text as="p" variant="bodySm">
                      No session rules yet. Add a condition to start narrowing your audience based
                      on in-session behavior.
                    </Text>
                  </Banner>
                )}

                <Box>
                  <button type="button" onClick={handleAddSessionCondition} disabled={disabled}>
                    Add session condition
                  </button>
                </Box>
              </BlockStack>
            )}
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
              <InlineStack gap="200" blockAlign="center">
                <Text as="span" variant="bodySm" fontWeight="semibold">
                  Shopify segments:
                </Text>
                <Text as="span" variant="bodySm">
                  {config.shopifySegmentIds?.length ?? 0} selected
                </Text>
              </InlineStack>

              {hasSessionRules && (
                <InlineStack gap="200" blockAlign="center">
                  <Text as="span" variant="bodySm" fontWeight="semibold">
                    Session rules:
                  </Text>
                  <Text as="span" variant="bodySm">
                    {sessionUi.length} condition(s) with{" "}
                    {(config.sessionRules?.logicOperator as LogicOperator) ?? "AND"} logic
                  </Text>
                </InlineStack>
              )}
            </BlockStack>

            <Box paddingBlockStart="200">
              <BlockStack gap="200">
                <InlineStack gap="200" blockAlign="center">
                  <Checkbox
                    label="Auto-refresh estimate"
                    checked={autoPreviewEnabled}
                    onChange={(checked) => setAutoPreviewEnabled(checked)}
                    disabled={!hasTargeting}
                  />

                  {isPreviewStale && !previewLoading && !previewError && (
                    <Text as="span" variant="bodySm" tone="subdued">
                      Audience settings changed since last estimate.
                    </Text>
                  )}
                </InlineStack>

                <InlineStack gap="200" blockAlign="center">
                  <Button
                    variant="plain"
                    onClick={refreshPreview}
                    disabled={previewLoading || !hasTargeting}
                  >
                    {previewLoading ? "Calculating audience size..." : "Refresh audience estimate"}
                  </Button>

                  {!previewLoading && previewTotal !== null && !previewError && (
                    <Text as="span" variant="bodySm">
                      Estimated reach: ~{previewTotal.toLocaleString()} customers
                    </Text>
                  )}

                  {previewError && (
                    <Text as="span" variant="bodySm" tone="critical">
                      {previewError}
                    </Text>
                  )}
                </InlineStack>

                {!previewLoading && previewBreakdown.length > 0 && !previewError && (
                  <BlockStack gap="100">
                    {previewBreakdown.map((entry) => {
                      const segment = shopifySegments.find((s) => s.id === entry.segmentId);
                      const label = segment?.name ?? entry.segmentId;

                      return (
                        <InlineStack key={entry.segmentId} gap="100" blockAlign="center">
                          <Text as="span" variant="bodySm" tone="subdued">
                            {label}:
                          </Text>
                          <Text as="span" variant="bodySm">
                            ~{entry.totalCustomers.toLocaleString()} customers
                          </Text>
                        </InlineStack>
                      );
                    })}

                    <Text as="p" variant="bodySm" tone="subdued">
                      If a customer belongs to multiple segments, they may be counted more than once
                      in this estimate.
                    </Text>
                  </BlockStack>
                )}
              </BlockStack>
            </Box>
          </BlockStack>
        </Card>
      )}
    </BlockStack>
  );
}
