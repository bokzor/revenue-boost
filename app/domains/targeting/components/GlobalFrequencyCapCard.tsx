/**
 * Global Frequency Cap Card Component
 *
 * Configure cross-campaign coordination with visibility into global settings
 */

import {
  Card,
  BlockStack,
  Checkbox,
  Text,
  Banner,
  Box,
  Badge,
  Link,
  List,
  InlineStack,
} from "@shopify/polaris";
import type { GlobalFrequencyCappingSettings } from "~/domains/store/types/settings";
import { GLOBAL_FREQUENCY_BEST_PRACTICES } from "~/domains/store/types/settings";

interface GlobalFrequencyCapCardProps {
  respectGlobalCap: boolean;
  onGlobalCapChange: (respectGlobalCap: boolean) => void;
  /** Global frequency capping settings from store - shows actual limits when enabled */
  globalSettings?: GlobalFrequencyCappingSettings;
}

/**
 * Format seconds into a human-readable duration
 */
function formatCooldown(seconds: number): string {
  if (seconds < 60) return `${seconds} seconds`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
  return `${Math.round(seconds / 86400)} days`;
}

export function GlobalFrequencyCapCard({
  respectGlobalCap,
  onGlobalCapChange,
  globalSettings,
}: GlobalFrequencyCapCardProps) {
  const isGlobalCappingEnabled = globalSettings?.enabled ?? false;
  const hasGlobalLimits =
    isGlobalCappingEnabled &&
    (globalSettings?.max_per_session ||
      globalSettings?.max_per_day ||
      globalSettings?.cooldown_between_popups);

  return (
    <Card>
      <Box padding="400">
        <BlockStack gap="400">
          <InlineStack gap="200" align="start" blockAlign="center">
            <Text as="h3" variant="headingMd">
              Cross-Campaign Coordination
            </Text>
            {respectGlobalCap && isGlobalCappingEnabled && <Badge tone="success">Active</Badge>}
          </InlineStack>

          <Text as="p" variant="bodySm" tone="subdued">
            Prevent popup fatigue by coordinating with other campaigns. This setting ensures
            visitors don&apos;t see too many popups across all your active campaigns.
          </Text>

          <Checkbox
            label="Respect global frequency cap"
            checked={respectGlobalCap}
            onChange={onGlobalCapChange}
            helpText="When enabled, this campaign will count towards and respect your store's global popup limits"
          />

          {respectGlobalCap ? (
            <BlockStack gap="300">
              {hasGlobalLimits ? (
                <Banner tone="success">
                  <BlockStack gap="200">
                    <Text as="p" variant="bodyMd" fontWeight="semibold">
                      Global coordination enabled
                    </Text>
                    <Text as="p" variant="bodySm">
                      This campaign will respect your store&apos;s global frequency limits:
                    </Text>
                    <Box paddingBlockStart="100">
                      <List type="bullet">
                        {globalSettings?.max_per_session && (
                          <List.Item>
                            Max{" "}
                            <Text as="span" fontWeight="semibold">
                              {globalSettings.max_per_session}
                            </Text>{" "}
                            popup{globalSettings.max_per_session !== 1 ? "s" : ""} per session
                          </List.Item>
                        )}
                        {globalSettings?.max_per_day && (
                          <List.Item>
                            Max{" "}
                            <Text as="span" fontWeight="semibold">
                              {globalSettings.max_per_day}
                            </Text>{" "}
                            popup{globalSettings.max_per_day !== 1 ? "s" : ""} per day
                          </List.Item>
                        )}
                        {globalSettings?.cooldown_between_popups &&
                          globalSettings.cooldown_between_popups > 0 && (
                            <List.Item>
                              <Text as="span" fontWeight="semibold">
                                {formatCooldown(globalSettings.cooldown_between_popups)}
                              </Text>{" "}
                              cooldown between popups
                            </List.Item>
                          )}
                      </List>
                    </Box>
                    <Box paddingBlockStart="100">
                      <Text as="p" variant="bodySm" tone="subdued">
                        <Link url="/app/settings" removeUnderline>
                          Manage global limits in Settings →
                        </Link>
                      </Text>
                    </Box>
                  </BlockStack>
                </Banner>
              ) : (
                <Banner tone="info">
                  <BlockStack gap="200">
                    <Text as="p" variant="bodyMd" fontWeight="semibold">
                      Global coordination enabled, but no limits set
                    </Text>
                    <Text as="p" variant="bodySm">
                      This campaign will coordinate with other campaigns, but you haven&apos;t configured
                      global frequency limits yet. We recommend setting up global limits to prevent
                      popup fatigue.
                    </Text>
                    <Box paddingBlockStart="100">
                      <Text as="p" variant="bodySm" fontWeight="medium">
                        Recommended settings (best practices):
                      </Text>
                      <List type="bullet">
                        <List.Item>
                          {GLOBAL_FREQUENCY_BEST_PRACTICES.max_per_session} popups per session
                        </List.Item>
                        <List.Item>
                          {GLOBAL_FREQUENCY_BEST_PRACTICES.max_per_day} popups per day
                        </List.Item>
                        <List.Item>
                          {formatCooldown(GLOBAL_FREQUENCY_BEST_PRACTICES.cooldown_between_popups)}{" "}
                          cooldown between popups
                        </List.Item>
                      </List>
                    </Box>
                    <Box paddingBlockStart="100">
                      <Text as="p" variant="bodySm" tone="subdued">
                        <Link url="/app/settings" removeUnderline>
                          Configure global limits in Settings →
                        </Link>
                      </Text>
                    </Box>
                  </BlockStack>
                </Banner>
              )}
            </BlockStack>
          ) : (
            <Banner tone="warning">
              <BlockStack gap="200">
                <Text as="p" variant="bodyMd" fontWeight="semibold">
                  Independent frequency tracking
                </Text>
                <Text as="p" variant="bodySm">
                  This campaign will track frequency independently. Visitors may see multiple popups
                  if they match multiple campaigns, which could lead to popup fatigue.
                </Text>
                <Text as="p" variant="bodySm" fontWeight="medium">
                  We recommend enabling global coordination if you have multiple active campaigns.
                </Text>
              </BlockStack>
            </Banner>
          )}
        </BlockStack>
      </Box>
    </Card>
  );
}
