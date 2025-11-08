/**
 * Page Targeting Panel - Configure which pages campaigns appear on
 *
 * Provides a checkbox to enable/disable page targeting and a settings button
 * to configure specific pages, patterns, and exclusions.
 */

import React, { useState, useCallback } from "react";
import {
  Card,
  BlockStack,
  InlineStack,
  Text,
  Checkbox,
  Button,
  Banner,
  Modal,
  FormLayout,
  ChoiceList,
  TextField,
  Badge,
  Collapsible,
} from "@shopify/polaris";
import { SettingsIcon, InfoIcon } from "@shopify/polaris-icons";

export interface PageTargetingConfig {
  enabled: boolean;
  pages: string[];
  customPatterns: string[];
  excludePages: string[];
}

export interface PageTargetingPanelProps {
  config: PageTargetingConfig;
  onConfigChange: (config: PageTargetingConfig) => void;
  templateType?: string;
  disabled?: boolean;
}

const DEFAULT_CONFIG: PageTargetingConfig = {
  enabled: false,
  pages: [],
  customPatterns: [],
  excludePages: [],
};

// Template-specific default pages
const TEMPLATE_DEFAULTS: Record<string, string[]> = {
  cart_upsell: ["/cart", "/checkout"],
  pdp_cross_sell: ["/products/*"],
  post_add_upsell: ["/products/*", "/collections/*"],
  "newsletter-elegant": ["/", "/collections/*", "/products/*"],
  "flash-sale-modal": ["/", "/collections/*"],
};

const PAGE_CHOICES = [
  { label: "Homepage (/)", value: "/" },
  { label: "All product pages (/products/*)", value: "/products/*" },
  { label: "All collection pages (/collections/*)", value: "/collections/*" },
  { label: "Cart page (/cart)", value: "/cart" },
  { label: "Checkout pages (/checkout)", value: "/checkout" },
  { label: "Blog pages (/blogs/*)", value: "/blogs/*" },
  { label: "Static pages (/pages/*)", value: "/pages/*" },
];

export const PageTargetingPanel: React.FC<PageTargetingPanelProps> = ({
  config = DEFAULT_CONFIG,
  onConfigChange,
  templateType,
  disabled = false,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateConfig = useCallback(
    (updates: Partial<PageTargetingConfig>) => {
      onConfigChange({ ...config, ...updates });
    },
    [config, onConfigChange],
  );

  const handleEnableChange = useCallback(
    (enabled: boolean) => {
      if (enabled && config.pages.length === 0 && templateType) {
        // Auto-populate with template defaults
        const defaultPages = TEMPLATE_DEFAULTS[templateType] || ["/"];
        updateConfig({ enabled, pages: defaultPages });
      } else {
        updateConfig({ enabled });
      }
    },
    [config.pages.length, templateType, updateConfig],
  );

  const handlePagesChange = useCallback(
    (pages: string[]) => {
      updateConfig({ pages });
    },
    [updateConfig],
  );

  const handleCustomPatternsChange = useCallback(
    (value: string) => {
      const patterns = value
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
      updateConfig({ customPatterns: patterns });
    },
    [updateConfig],
  );

  const handleExcludePagesChange = useCallback(
    (value: string) => {
      const excludePages = value
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
      updateConfig({ excludePages });
    },
    [updateConfig],
  );

  const getTemplateRecommendation = () => {
    if (!templateType) return null;

    const recommendations = {
      cart_upsell: "Recommended: Cart and checkout pages for maximum impact",
      pdp_cross_sell: "Recommended: Product pages to show related items",
      post_add_upsell:
        "Recommended: Product and collection pages where customers browse",
      "newsletter-elegant":
        "Recommended: Homepage and browsing pages for new visitors",
      "flash-sale-modal":
        "Recommended: Homepage and collection pages for maximum visibility",
    };

    return recommendations[templateType as keyof typeof recommendations];
  };

  const getSelectedPagesCount = () => {
    return config.pages.length + config.customPatterns.length;
  };

  const getSelectedPagesPreview = () => {
    const allPages = [...config.pages, ...config.customPatterns];
    if (allPages.length === 0) return "No pages selected";
    if (allPages.length <= 2) return allPages.join(", ");
    return `${allPages.slice(0, 2).join(", ")} and ${allPages.length - 2} more`;
  };

  return (
    <>
      <Card>
        <BlockStack gap="400">
          <InlineStack align="space-between" blockAlign="center">
            <InlineStack gap="300" blockAlign="center">
              <Checkbox
                label="Page Targeting"
                checked={config.enabled}
                onChange={handleEnableChange}
                disabled={disabled}
              />
              {config.enabled && (
                <Badge
                  tone={getSelectedPagesCount() > 0 ? "success" : "attention"}
                >
                  {`${String(getSelectedPagesCount())} page${getSelectedPagesCount() !== 1 ? "s" : ""}`}
                </Badge>
              )}
            </InlineStack>

            <Button
              variant="tertiary"
              icon={SettingsIcon}
              onClick={() => setIsModalOpen(true)}
              disabled={!config.enabled || disabled}
            >
              Settings
            </Button>
          </InlineStack>

          {config.enabled && (
            <BlockStack gap="300">
              {getTemplateRecommendation() && (
                <Banner tone="info" icon={InfoIcon}>
                  {getTemplateRecommendation()}
                </Banner>
              )}

              <Text as="p" variant="bodySm" tone="subdued">
                Currently targeting: {getSelectedPagesPreview()}
                {config.excludePages.length > 0 && (
                  <span>
                    {" "}
                    (excluding {config.excludePages.length} page
                    {config.excludePages.length !== 1 ? "s" : ""})
                  </span>
                )}
              </Text>
            </BlockStack>
          )}
        </BlockStack>
      </Card>

      {/* Settings Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Page Targeting Settings"
        primaryAction={{
          content: "Save",
          onAction: () => setIsModalOpen(false),
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => setIsModalOpen(false),
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="500">
            <FormLayout>
              <ChoiceList
                title="Show on pages"
                allowMultiple
                choices={PAGE_CHOICES}
                selected={config.pages}
                onChange={handlePagesChange}
              />

              <Button
                variant="plain"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? "Hide" : "Show"} Advanced Options
              </Button>

              <Collapsible id="advanced-options" open={showAdvanced}>
                <BlockStack gap="400">
                  <TextField
                    id="custom-patterns"
                    label="Custom URL patterns"
                    value={config.customPatterns.join(", ")}
                    onChange={handleCustomPatternsChange}
                    placeholder="/collections/summer-*, /pages/about"
                    autoComplete="off"
                  />

                  <TextField
                    id="exclude-pages"
                    label="Exclude pages"
                    value={config.excludePages.join(", ")}
                    onChange={handleExcludePagesChange}
                    placeholder="/checkout, /account, /pages/privacy"
                    autoComplete="off"
                  />
                </BlockStack>
              </Collapsible>
            </FormLayout>

            {getTemplateRecommendation() && (
              <Banner tone="info">
                <Text as="p" variant="bodySm">
                  <strong>Tip:</strong> {getTemplateRecommendation()}
                </Text>
              </Banner>
            )}
          </BlockStack>
        </Modal.Section>
      </Modal>
    </>
  );
};
