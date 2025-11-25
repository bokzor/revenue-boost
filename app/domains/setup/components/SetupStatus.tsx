/**
 * SetupStatus Component
 * 
 * Minimal, reusable component to display app setup status
 * Shows essential checks: theme extension and metafield
 * Displays custom proxy URL override if detected
 */

import { Card, BlockStack, Text, List, InlineStack, Badge, Banner, Button } from "@shopify/polaris";

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
}

export function SetupStatus({ status, setupComplete, themeEditorUrl, compact = false }: SetupStatusProps) {
  if (compact && setupComplete) {
    return (
      <Banner tone="success">
        <p>✓ App is fully configured and ready to use</p>
      </Banner>
    );
  }

  if (compact && !setupComplete) {
    return (
      <Banner
        tone="warning"
        title="Setup Required"
        action={themeEditorUrl ? {
          content: "Enable in Theme Editor",
          url: themeEditorUrl,
          external: true,
        } : undefined}
      >
        <p>Theme extension needs to be enabled in your theme editor for popups to appear on your storefront.</p>
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
                <Badge tone="attention">Check Pending</Badge>
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
                  A custom API URL has been configured in your theme settings. This overrides the default app URL.
                </Text>
              </BlockStack>
            </List.Item>
          )}
        </List>

        {!status.themeExtensionEnabled && themeEditorUrl && (
          <BlockStack gap="200">
            <Text as="p" variant="bodyMd" tone="subdued">
              To enable the theme extension, open your theme editor and toggle on "Revenue Boost Popups" under App embeds.
            </Text>
            <Button url={themeEditorUrl} target="_blank" variant="primary">
              Open Theme Editor
            </Button>
          </BlockStack>
        )}
      </BlockStack>
    </Card>
  );
}

