/**
 * Setup Status Page
 *
 * Shows the current setup status and provides actions to complete setup
 */

import { useEffect, useState } from "react";
import { Page, Card, Banner, List, Button, InlineStack, BlockStack, Text, Badge } from "@shopify/polaris";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useRevalidator } from "react-router";
import { authenticate } from "~/shopify.server";
import prisma from "~/db.server";

interface SetupStatus {
  shop: string;
  themeExtensionEnabled: boolean;
  metafieldSet: boolean;
  welcomeCampaignCreated: boolean;
  storeCreated: boolean;
  appProxyOk: boolean;
}

interface LoaderData {
  status: SetupStatus;
  setupComplete: boolean;
  themeEditorUrl: string;
  appProxyTestUrl: string;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);

  if (!session?.shop) {
    throw new Error("No shop session");
  }

  // Check setup status directly instead of calling API
  const status = {
    shop: session.shop,
    themeExtensionEnabled: false,
    metafieldSet: false,
    welcomeCampaignCreated: false,
    storeCreated: false,
    appProxyOk: false,
  };

  // Check if store exists
  const store = await prisma.store.findUnique({
    where: { shopifyDomain: session.shop },
  });

  status.storeCreated = !!store;

  // Check if theme extension is enabled
  // We use the REST API to check settings_data.json for app embed status
  try {
    // Get the published theme ID using REST API
    const themesUrl = `https://${session.shop}/admin/api/2024-10/themes.json`;
    const themesResponse = await fetch(themesUrl, {
      headers: {
        'X-Shopify-Access-Token': session.accessToken || '',
      },
    });

    if (!themesResponse.ok) {
      console.error('[Setup] Failed to fetch themes:', themesResponse.status, themesResponse.statusText);
      status.themeExtensionEnabled = false;
    } else {
      const themesData = await themesResponse.json();
      const publishedTheme = themesData.themes?.find((t: any) => t.role === 'main');

      if (!publishedTheme) {
        console.log('[Setup] No published theme found');
        status.themeExtensionEnabled = false;
      } else {
        const themeId = publishedTheme.id;

        // Fetch settings_data.json using REST API
        const settingsUrl = `https://${session.shop}/admin/api/2024-10/themes/${themeId}/assets.json?asset[key]=config/settings_data.json`;
        const settingsResponse = await fetch(settingsUrl, {
          headers: {
            'X-Shopify-Access-Token': session.accessToken || '',
          },
        });

        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json();
          const settingsContent = JSON.parse(settingsData.asset.value);

          console.log('[Setup] Settings data structure:', {
            hasCurrent: !!settingsContent.current,
            hasBlocks: !!settingsContent.current?.blocks,
            blockKeys: Object.keys(settingsContent.current?.blocks || {}),
          });

          // Check if our app embed is enabled in the theme settings
          // App embeds are stored in current.blocks with type "apps"
          const blocks = settingsContent.current?.blocks || {};

          // Log all blocks to see what we're working with
          Object.entries(blocks).forEach(([key, block]: [string, any]) => {
            if (block.type?.includes('apps') || block.type?.includes('revenue') || block.type?.includes('storefront')) {
              console.log('[Setup] Found app block:', { key, type: block.type, disabled: block.disabled });
            }
          });

          const appEmbedEnabled = Object.values(blocks).some((block: any) => {
            const isOurApp = block.type?.includes('revenue-boost') ||
                            block.type?.includes('storefront-popup') ||
                            block.type?.includes('revenue_boost');
            const isAppsBlock = block.type?.startsWith('shopify://apps/');
            const notDisabled = block.disabled !== true;

            return (isOurApp || isAppsBlock) && notDisabled;
          });

          status.themeExtensionEnabled = appEmbedEnabled;
          console.log('[Setup] App embed enabled:', appEmbedEnabled);
        } else {
          console.error('[Setup] Failed to fetch settings_data.json:', settingsResponse.status, settingsResponse.statusText);
        }
      }
    }
  } catch (error) {
    console.error("Error checking theme extension:", error);
    // Default to false so we show the instructions
    status.themeExtensionEnabled = false;
  }

  // Check if metafield is set
  try {
    const metafieldQuery = `
      query {
        shop {
          metafield(namespace: "revenue_boost", key: "api_url") {
            value
          }
        }
      }
    `;

    const metafieldResponse = await admin.graphql(metafieldQuery);
    const metafieldData = await metafieldResponse.json();
    status.metafieldSet = !!metafieldData.data?.shop?.metafield?.value;
  } catch (error) {
    console.error("Error checking metafield:", error);
  }

  // Check if welcome campaign exists
  if (store) {
    const welcomeCampaign = await prisma.campaign.findFirst({
      where: {
        storeId: store.id,
        name: "Welcome Popup",
      },
    });

    status.welcomeCampaignCreated = !!welcomeCampaign;
  }

  const setupComplete = status.themeExtensionEnabled && status.metafieldSet && status.welcomeCampaignCreated;

  // Check App Proxy reachability via storefront path
  let appProxyTestUrl = `https://${session.shop}/apps/revenue-boost/bundles/popup-loader.bundle.js`;
  try {
    const resp = await fetch(appProxyTestUrl, { method: "HEAD" });
    status.appProxyOk = resp.ok;
    // Fallback to another bundle if needed
    if (!status.appProxyOk) {
      appProxyTestUrl = `https://${session.shop}/apps/revenue-boost/bundles/newsletter.bundle.js`;
      const resp2 = await fetch(appProxyTestUrl, { method: "HEAD" });
      status.appProxyOk = resp2.ok;
    }
  } catch {
    status.appProxyOk = false;
  }

  // Generate theme editor URL
  const themeEditorUrl = `https://${session.shop}/admin/themes/current/editor?context=apps`;

  return {
    status,
    setupComplete,
    themeEditorUrl,
    appProxyTestUrl,
  };
}

export default function SetupPage() {
  const { status, setupComplete, themeEditorUrl, appProxyTestUrl } = useLoaderData<LoaderData>();
  const revalidator = useRevalidator();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    revalidator.revalidate();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  useEffect(() => {
    // Auto-refresh every 10 seconds if setup is not complete
    if (!setupComplete) {
      const interval = setInterval(() => {
        revalidator.revalidate();
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [setupComplete, revalidator]);

  return (
    <Page
      title="App Setup Status"
      subtitle="Check if your app is properly configured"
      primaryAction={{
        content: "Refresh Status",
        onAction: handleRefresh,
        loading: isRefreshing,
      }}
    >
      <BlockStack gap="500">
        {setupComplete ? (
          <Banner tone="success" title="Setup Complete! 🎉">
            <p>Your app is fully configured and ready to use.</p>
          </Banner>
        ) : (
          <Banner tone="warning" title="Setup Incomplete">
            <p>Some setup steps are missing. Please complete them below.</p>
          </Banner>
        )}

        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Setup Checklist
            </Text>

            <List type="bullet">
              <List.Item>
                <InlineStack gap="200" align="space-between" blockAlign="center">
                  <Text as="span">Store Record Created</Text>
                  {status.storeCreated ? (
                    <Badge tone="success">✓ Complete</Badge>
                  ) : (
                    <Badge tone="attention">Pending</Badge>
                  )}
                </InlineStack>
              </List.Item>

              <List.Item>
                <InlineStack gap="200" align="space-between" blockAlign="center">
                  <Text as="span">Theme Extension Enabled</Text>
                  {status.themeExtensionEnabled ? (
                    <Badge tone="success">✓ Complete</Badge>
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
                    <Badge tone="critical">Not Reachable</Badge>
                  )}
                </InlineStack>
              </List.Item>

              <List.Item>
                <InlineStack gap="200" align="space-between" blockAlign="center">
                  <Text as="span">API URL Metafield Set</Text>
                  {status.metafieldSet ? (
                    <Badge tone="success">✓ Complete</Badge>
                  ) : (
                    <Badge tone="attention">Pending</Badge>
                  )}
                </InlineStack>
              </List.Item>

              <List.Item>
                <InlineStack gap="200" align="space-between" blockAlign="center">
                  <Text as="span">Welcome Campaign Created</Text>
                  {status.welcomeCampaignCreated ? (
                    <Badge tone="success">✓ Complete</Badge>
                  ) : (
                    <Badge tone="attention">Pending</Badge>
                  )}
                </InlineStack>
              </List.Item>
            </List>
          </BlockStack>
        </Card>

        {!status.themeExtensionEnabled && (
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                ⚠️ Enable Theme Extension
              </Text>

              <Text as="p" variant="bodyMd">
                To display popups on your storefront, you need to enable the Revenue Boost app embed in your theme.
              </Text>
              <Text as="p" variant="bodyMd" fontWeight="semibold">
                Follow these steps:
              </Text>
              <List type="number">
                <List.Item>Click "Open Theme Editor" below</List.Item>
                <List.Item>Look for "App embeds" in the left sidebar</List.Item>
                <List.Item>Find "Revenue Boost Popups" and toggle it ON</List.Item>
                <List.Item>Click "Save" in the top right corner</List.Item>
                <List.Item>Return here and click "Refresh Status"</List.Item>
              </List>
              <Banner tone="info">
                <p>
                  <strong>Note:</strong> The app embed must be manually enabled. This is a Shopify requirement for all theme extensions.
                </p>
              </Banner>
              <InlineStack gap="200">
                <Button
                  url={themeEditorUrl}
                  target="_blank"
                  variant="primary"
                >
                  Open Theme Editor
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>
        )}
        {!status.appProxyOk && (
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">⚠️ App Proxy not reachable</Text>
              <Text as="p" variant="bodyMd">
                Your storefront cannot reach the app proxy path. Ensure your App Proxy is configured in Shopify Admin:
                Subpath prefix <code>apps</code>, Subpath <code>revenue-boost</code>.
              </Text>
              <InlineStack gap="200">
                <Button url={appProxyTestUrl} target="_blank">Test proxy URL</Button>
              </InlineStack>
            </BlockStack>
          </Card>
        )}

      </BlockStack>
    </Page>
  );
}

