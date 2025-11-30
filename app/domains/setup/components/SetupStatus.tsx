/**
 * SetupStatus Component
 *
 * Minimal, reusable component to display app setup status
 * Shows essential checks: theme extension and metafield
 * Displays custom proxy URL override if detected
 */

import { Card, BlockStack, Text, List, InlineStack, Badge, Banner, Button } from "@shopify/polaris";
import { useCallback } from "react";

export interface SetupStatusData {
  themeExtensionEnabled: boolean;
  appProxyOk: boolean;
  customProxyUrl: string | null;
}

interface SetupStatusProps {
  status: SetupStatusData;
  setupComplete: boolean;
  themeEditorUrl?: string;
  compact?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function SetupStatus({
  status,
  setupComplete,
  themeEditorUrl,
  compact = false,
  onRefresh,
  isRefreshing = false,
}: SetupStatusProps) {
  // Use Shopify's open API to properly open external URLs from embedded app
  const openThemeEditor = useCallback(() => {
    if (themeEditorUrl) {
      // Use shopify.open() for embedded apps - opens in new tab correctly
      if (typeof window !== "undefined" && window.shopify?.open) {
        window.shopify.open(themeEditorUrl);
      } else {
        // Fallback for non-embedded context
        window.open(themeEditorUrl, "_blank");
      }
    }
  }, [themeEditorUrl]);

  if (compact && setupComplete) {
    return (
      <Banner tone="success">
        <p>✓ App is fully configured and ready to use</p>
      </Banner>
    );
  }

  if (compact && !setupComplete) {
    // Determine what's wrong and show appropriate message
    const themeIssue = !status.themeExtensionEnabled;
    const proxyIssue = !status.appProxyOk;

    let title = "Setup Required";
    let message = "";
    let action = undefined;

    if (themeIssue && proxyIssue) {
      message = "Theme extension needs to be enabled and the app backend is unreachable.";
      action = themeEditorUrl
        ? { content: "Enable in Theme Editor", onAction: openThemeEditor }
        : undefined;
    } else if (themeIssue) {
      message = "Theme extension needs to be enabled in your theme editor for popups to appear on your storefront.";
      action = themeEditorUrl
        ? { content: "Enable in Theme Editor", onAction: openThemeEditor }
        : undefined;
    } else if (proxyIssue) {
      title = "Connection Issue";
      message = "Unable to reach the app backend. This may be a temporary issue. Try refreshing the status.";
    }

    return (
      <Banner
        tone="warning"
        title={title}
        action={action}
        secondaryAction={
          onRefresh
            ? {
                content: isRefreshing ? "Checking..." : "Refresh",
                onAction: onRefresh,
              }
            : undefined
        }
      >
        <p>{message}</p>
      </Banner>
    );
  }

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">
          Setup Status
        </Text>

        {setupComplete ? (
          <Banner tone="success">
            <p>✓ Your app is fully configured and ready to use</p>
          </Banner>
        ) : (
          <Banner tone="warning">
            <p>Some setup steps are incomplete</p>
          </Banner>
        )}

        <List type="bullet">
          <List.Item>
            <InlineStack gap="200" align="space-between" blockAlign="center">
              <Text as="span">Theme Extension Enabled</Text>
              {status.themeExtensionEnabled ? (
                <Badge tone="success">✓ Enabled</Badge>
              ) : (
                <Badge tone="critical">Not Enabled</Badge>
              )}
            </InlineStack>
          </List.Item>

          <List.Item>
            <InlineStack gap="200" align="space-between" blockAlign="center">
              <Text as="span">App Proxy Reachable</Text>
              {status.appProxyOk ? (
                <Badge tone="success">✓ Reachable</Badge>
              ) : (
                <Badge tone="critical">Unreachable</Badge>
              )}
            </InlineStack>
          </List.Item>

          {status.customProxyUrl && (
            <List.Item>
              <BlockStack gap="200">
                <InlineStack gap="200" align="space-between" blockAlign="center">
                  <Text as="span">Custom API URL Override</Text>
                  <Badge tone="info">Overridden</Badge>
                </InlineStack>
                <Text as="p" variant="bodySm" tone="subdued">
                  {status.customProxyUrl}
                </Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  A custom API URL has been configured in your theme settings. This overrides the
                  default app URL.
                </Text>
              </BlockStack>
            </List.Item>
          )}
        </List>

        {!status.themeExtensionEnabled && themeEditorUrl && (
          <BlockStack gap="200">
            <Text as="p" variant="bodyMd" tone="subdued">
              To enable the theme extension, open your theme editor and toggle on &quot;Revenue Boost
              Popups&quot; under App embeds.
            </Text>
            <Button onClick={openThemeEditor} variant="primary">
              Open Theme Editor
            </Button>
          </BlockStack>
        )}

        {onRefresh && (
          <InlineStack align="end">
            <Button onClick={onRefresh} loading={isRefreshing} variant="plain">
              Refresh Status
            </Button>
          </InlineStack>
        )}
      </BlockStack>
    </Card>
  );
}
