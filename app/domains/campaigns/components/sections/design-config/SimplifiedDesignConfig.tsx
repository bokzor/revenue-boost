/**
 * SimplifiedDesignConfig Component
 *
 * Main design configuration component that combines:
 * - ThemeModeSelector: Choose shopify/preset/custom
 * - PresetDesignSelector: Pick a preset (when mode is "preset")
 * - SimplifiedColorPicker: Custom colors (when mode is "custom")
 *
 * For "shopify" mode, shows a preview of the inherited store theme.
 */

import { useCallback } from "react";
import { BlockStack, Card, Text, Banner, Divider, InlineStack, Badge } from "@shopify/polaris";
import { ThemeModeSelector } from "./ThemeModeSelector";
import { PresetDesignSelector } from "./PresetDesignSelector";
import { SimplifiedColorPicker } from "./SimplifiedColorPicker";
import type {
  ThemeMode,
  DesignTokens,
  CampaignDesign,
} from "~/domains/campaigns/types/design-tokens";

export interface SimplifiedDesignConfigProps {
  /** Current design configuration */
  design: Partial<CampaignDesign>;
  /** Callback when design changes */
  onChange: (design: Partial<CampaignDesign>) => void;
  /** Tokens extracted from the store's Shopify theme (for preview) */
  shopifyTokens?: Partial<DesignTokens>;
  /** Hide preset option (for templates that don't support presets) */
  hidePreset?: boolean;
  /** Preset category filter */
  presetCategory?: "newsletter" | "seasonal" | "spin-to-win" | "all";
}

export function SimplifiedDesignConfig({
  design,
  onChange,
  shopifyTokens,
  hidePreset = false,
  presetCategory = "all",
}: SimplifiedDesignConfigProps) {
  const themeMode = design.themeMode || "shopify";

  const handleThemeModeChange = useCallback(
    (mode: ThemeMode) => {
      onChange({ ...design, themeMode: mode });
    },
    [design, onChange]
  );

  const handlePresetChange = useCallback(
    (presetId: string) => {
      onChange({ ...design, presetId });
    },
    [design, onChange]
  );

  const handleTokensChange = useCallback(
    (tokens: Partial<DesignTokens>) => {
      onChange({ ...design, tokens });
    },
    [design, onChange]
  );

  return (
    <Card>
      <BlockStack gap="500">
        <ThemeModeSelector
          value={themeMode}
          onChange={handleThemeModeChange}
          hidePreset={hidePreset}
        />

        <Divider />

        {/* Theme Mode: Shopify */}
        {themeMode === "shopify" && (
          <BlockStack gap="300">
            <InlineStack gap="200" align="center">
              <Badge tone="success">Auto-sync</Badge>
              <Text as="span" variant="bodySm" tone="subdued">
                Colors and fonts will match your Shopify theme
              </Text>
            </InlineStack>

            {shopifyTokens ? (
              <ShopifyThemePreview tokens={shopifyTokens} />
            ) : (
              <Banner tone="info">
                <Text as="p" variant="bodySm">
                  Your store&apos;s theme colors will be loaded when previewing.
                </Text>
              </Banner>
            )}
          </BlockStack>
        )}

        {/* Theme Mode: Preset */}
        {themeMode === "preset" && (
          <PresetDesignSelector
            value={design.presetId}
            onChange={handlePresetChange}
            category={presetCategory}
          />
        )}

        {/* Theme Mode: Custom */}
        {themeMode === "custom" && (
          <SimplifiedColorPicker tokens={design.tokens || {}} onChange={handleTokensChange} />
        )}
      </BlockStack>
    </Card>
  );
}

/** Simple preview of Shopify theme tokens */
function ShopifyThemePreview({ tokens }: { tokens: Partial<DesignTokens> }) {
  return (
    <div
      style={{
        padding: "16px",
        borderRadius: "12px",
        backgroundColor: tokens.background || "#ffffff",
        border: "1px solid var(--p-color-border-secondary)",
      }}
    >
      <Text as="p" variant="bodySm" tone="subdued">
        Theme Preview
      </Text>
      <div style={{ color: tokens.foreground || "#1a1a1a", marginTop: "8px" }}>
        <Text as="p" variant="bodyMd">
          Sample text in your store&apos;s colors
        </Text>
      </div>
      <button
        type="button"
        style={{
          marginTop: "12px",
          padding: "8px 16px",
          borderRadius: `${tokens.borderRadius || 8}px`,
          backgroundColor: tokens.primary || "#000000",
          color: tokens.primaryForeground || "#ffffff",
          border: "none",
          fontWeight: 600,
          fontFamily: tokens.fontFamily,
          cursor: "default",
        }}
      >
        Button
      </button>
    </div>
  );
}

export default SimplifiedDesignConfig;
