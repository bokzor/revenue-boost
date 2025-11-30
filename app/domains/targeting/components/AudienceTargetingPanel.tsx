/**
 * Audience Targeting Panel - Configure campaign audience targeting
 *
 * Shopify-first audience model:
 * - Shopify customer segments define customer-level "who" for known customers.
 *
 * Note: Cart-based targeting is now handled by the cart_value trigger in
 * Enhanced Triggers (client-side) via polling /cart.js.
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
import { ShopifySegmentSelector, type ShopifySegmentOption } from "./ShopifySegmentSelector";

const computePreviewConfigKey = (config: AudienceTargetingConfig) => {
  return JSON.stringify({
    enabled: config.enabled,
    shopifySegmentIds: config.shopifySegmentIds ?? [],
  });
};

export interface AudienceTargetingPanelProps {
  storeId: string;
  config: AudienceTargetingConfig;
  onConfigChange: (config: AudienceTargetingConfig) => void;
  disabled?: boolean;
}

export function AudienceTargetingPanel({
  storeId: _storeId, // currently unused but kept for future Shopify segment selector
  config,
  onConfigChange,
  disabled = false,
}: AudienceTargetingPanelProps) {
  // Guard config changes when disabled (e.g., plan doesn't include advanced targeting)
  const updateConfig = useCallback(
    (updates: Partial<AudienceTargetingConfig>) => {
      if (disabled) return; // Prevent state mutations when feature is locked
      onConfigChange({ ...config, ...updates });
    },
    [config, onConfigChange, disabled]
  );

  // Detect if campaign has existing advanced targeting but it's disabled by plan (e.g., after downgrade)
  const hasExistingAdvancedTargeting =
    config.enabled || (config.shopifySegmentIds?.length ?? 0) > 0;

  const hasShopifySegments = (config.shopifySegmentIds?.length ?? 0) > 0;
  const hasTargeting = hasShopifySegments;

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

  return (
    <BlockStack gap="400">
      {/* Upsell Banner when advanced targeting is disabled by plan */}
      {disabled && (
        <Banner tone="info">
          <Text as="p" variant="bodySm">
            Audience targeting (Shopify segments) is not available on your current plan. Upgrade
            to precisely control who sees this campaign.
          </Text>
        </Banner>
      )}

      {/* Downgrade Warning: campaign has existing targeting but it's now locked */}
      {disabled && hasExistingAdvancedTargeting && (
        <Banner tone="warning">
          <Text as="p" variant="bodySm">
            This campaign has existing audience targeting configuration, but it is inactive on your
            current plan. The targeting rules will be ignored until you upgrade.
          </Text>
        </Banner>
      )}

      {/* Enable/Disable Toggle */}
      <Card>
        <BlockStack gap="400">
          <Checkbox
            label="Enable audience targeting"
            checked={config.enabled}
            onChange={(checked) => updateConfig({ enabled: checked })}
            disabled={disabled}
            helpText="Only show this campaign to visitors who match your Shopify customer segments."
            data-test-id="audience-targeting-enabled-checkbox"
          />

          {config.enabled && !disabled && (
            <Banner tone="info">
              <Text as="p" variant="bodySm">
                Your campaign will only show to visitors who match your selected Shopify customer
                segments. Use Cart Value Threshold trigger for cart-based targeting.
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
