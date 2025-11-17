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
  Autocomplete,
} from "@shopify/polaris";
import { SettingsIcon, InfoIcon } from "@shopify/polaris-icons";
import type { PageTargetingConfig } from "~/domains/campaigns/types/campaign";
import { ProductPicker } from "~/domains/campaigns/components/form";

export interface PageTargetingPanelProps {
  config: PageTargetingConfig;
  onConfigChange: (config: PageTargetingConfig) => void;
  templateType?: string;
  disabled?: boolean;
}

// Re-export for convenience
export type { PageTargetingConfig };

const DEFAULT_CONFIG: PageTargetingConfig = {
  enabled: false,
  pages: [],
  customPatterns: [],
  excludePages: [],
  productTags: [],
  collections: [],
};

// NOTE: Template-specific defaults have been removed.
// Templates now define their own page targeting in the database
// (Template.targetRules.pageTargeting)

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
  const [tagSearchValue, setTagSearchValue] = useState("");
  const [tagOptions, setTagOptions] = useState<{ value: string; label: string }[]>([]);
  const [isTagLoading, setIsTagLoading] = useState(false);

  const updateConfig = useCallback(
    (updates: Partial<PageTargetingConfig>) => {
      onConfigChange({ ...config, ...updates });
    },
    [config, onConfigChange],
  );

  const fetchTagOptions = useCallback(
    async (search: string) => {
      try {
        setIsTagLoading(true);
        const params = new URLSearchParams();
        if (search.trim()) {
          params.set("q", search.trim());
        }
        params.set("first", "200");
        const response = await fetch(`/api/product-tags?${params.toString()}`);
        const json = await response.json();
        const tags: string[] =
          json?.data?.tags && Array.isArray(json.data.tags)
            ? json.data.tags
            : Array.isArray(json?.tags)
            ? json.tags
            : [];
        setTagOptions(
          tags.map((tag: string) => ({
            value: tag,
            label: tag,
          })),
        );
      } catch (error) {
        console.error("[PageTargetingPanel] Failed to fetch product tags", error);
      } finally {
        setIsTagLoading(false);
      }
    },
    [],
  );

  const handleTagInputChange = useCallback(
    (value: string) => {
      setTagSearchValue(value);

      // Debounce network calls: only fetch after user pauses typing for 300ms
      if (value.trim() === "") {
        setTagOptions([]);
        return;
      }

      if ((window as any).requestIdleCallback) {
        (window as any).requestIdleCallback(() => {
          void fetchTagOptions(value);
        }, { timeout: 300 });
      } else {
        setTimeout(() => {
          void fetchTagOptions(value);
        }, 300);
      }
    },
    [fetchTagOptions],
  );

  const handleTagSelect = useCallback(
    (selected: string[]) => {
      updateConfig({ productTags: selected });
    },
    [updateConfig],
  );

  const handleEnableChange = useCallback(
    (enabled: boolean) => {
      // Simply enable/disable without auto-populating
      // Template's page targeting should already be set from database
      updateConfig({ enabled });
    },
    [updateConfig],
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

  // NOTE: Template recommendations have been removed.
  // Templates should define their own page targeting in the database.
  // This function is kept for backward compatibility but returns null.
  const getTemplateRecommendation = () => {
    return null;
  };

  const getSelectedPagesCount = () => {
    return (
      config.pages.length +
      config.customPatterns.length +
      (config.productTags?.length || 0) +
      (config.collections?.length || 0)
    );
  };

  const getSelectedPagesPreview = () => {
    const items: string[] = [
      ...config.pages,
      ...config.customPatterns,
      ...(config.productTags || []).map((tag) => `tag:${tag}`),
      ...(config.collections || []).map((c) => "collection"),
    ];
    if (items.length === 0) return "No targeting filters selected";
    if (items.length <= 2) return items.join(", ");
    return `${items.slice(0, 2).join(", ")} and ${items.length - 2} more`;
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

                  <Autocomplete
                    allowMultiple
                    options={tagOptions}
                    selected={config.productTags || []}
                    loading={isTagLoading}
                    onSelect={handleTagSelect}
                    textField={
                      <Autocomplete.TextField
                        label="Product tags"
                        value={tagSearchValue}
                        onChange={handleTagInputChange}
                        autoComplete="off"
                        placeholder="Search product tags"
                      />
                    }
                  />

                  <ProductPicker
                    mode="collection"
                    selectionType="multiple"
                    selectedIds={config.collections}
                    onSelect={(selections) =>
                      updateConfig({ collections: selections.map((s) => s.id) })
                    }
                    buttonLabel="Limit to specific collections (optional)"
                    showSelected
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
