/**
 * Match Your Theme Button Component
 *
 * Fetches the merchant's Shopify theme settings and allows applying
 * those colors/fonts to the current popup design.
 * Optionally allows saving the theme as a reusable custom preset.
 */

import { useState, useCallback } from "react";
import {
  Button,
  Icon,
  InlineStack,
  Text,
  Tooltip,
  Spinner,
  Banner,
  ButtonGroup,
} from "@shopify/polaris";
import { PaintBrushFlatIcon, CheckIcon, SaveIcon } from "@shopify/polaris-icons";
import type { ThemePresetInput } from "~/domains/store/types/theme-preset";
import { expandThemePreset } from "~/domains/store/types/theme-preset";
import type { DesignConfig } from "~/domains/campaigns/types/campaign";
import { useFetcher } from "react-router";

// =============================================================================
// TYPES
// =============================================================================

interface ThemeSettingsResponse {
  success: boolean;
  preset?: ThemePresetInput;
  rawSettings?: {
    themeName: string;
    colors: {
      background: string;
      text: string;
      primary: string;
    };
    typography: {
      headingFont?: string;
      bodyFont?: string;
    };
  };
  error?: string;
}

export interface MatchThemeButtonProps {
  /** Callback when theme settings are applied */
  onApply: (designConfig: Partial<DesignConfig>, themeName: string) => void;
  /** Optional callback when "Save as Custom Theme" is clicked - passes the preset to save */
  onSaveAsPreset?: (preset: ThemePresetInput, themeName: string) => void;
  /** Optional loading state override */
  disabled?: boolean;
  /** Show as compact button or full card */
  variant?: "button" | "card";
  /** Whether the "My Store Theme" preset already exists */
  hasStoreThemePreset?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function MatchThemeButton({
  onApply,
  onSaveAsPreset,
  disabled = false,
  variant = "button",
  hasStoreThemePreset = false,
}: MatchThemeButtonProps) {
  const fetcher = useFetcher<ThemeSettingsResponse>();
  const [applied, setApplied] = useState(false);
  const [saved, setSaved] = useState(false);

  const isLoading = fetcher.state === "loading" || fetcher.state === "submitting";
  const hasError = fetcher.data?.success === false;

  const handleFetch = useCallback(() => {
    setApplied(false);
    setSaved(false);
    fetcher.load("/api/theme-settings");
  }, [fetcher]);

  // Apply the fetched theme
  const handleApply = useCallback(() => {
    if (!fetcher.data?.preset) return;

    const preset = fetcher.data.preset;
    const expandedConfig = expandThemePreset(preset);

    onApply(expandedConfig, fetcher.data.rawSettings?.themeName || "Your Theme");
    setApplied(true);
  }, [fetcher.data, onApply]);

  // Save as custom preset
  const handleSave = useCallback(() => {
    if (!fetcher.data?.preset || !onSaveAsPreset) return;

    const preset = fetcher.data.preset;
    const themeName = fetcher.data.rawSettings?.themeName || "My Store Theme";

    // Give it a unique ID and name for saving
    const presetToSave: ThemePresetInput = {
      ...preset,
      id: `store-theme-${Date.now()}`,
      name: themeName,
    };

    onSaveAsPreset(presetToSave, themeName);
    setSaved(true);
  }, [fetcher.data, onSaveAsPreset]);

  // Auto-apply when data is fetched successfully
  if (fetcher.data?.success && fetcher.data.preset && !applied && !isLoading) {
    handleApply();
  }

  if (variant === "card") {
    // Show save button only when colors are applied and callback is provided
    const showSaveButton = applied && onSaveAsPreset && !hasStoreThemePreset && !saved;

    return (
      <div
        style={{
          padding: "12px 16px",
          border: "1px dashed #8C9196",
          borderRadius: 8,
          background: applied ? "#F1F8F5" : "#FAFBFB",
        }}
      >
        <InlineStack gap="300" align="space-between" blockAlign="center">
          <InlineStack gap="200" blockAlign="center">
            <Icon source={PaintBrushFlatIcon} tone="base" />
            <div>
              <Text as="span" variant="bodyMd" fontWeight="medium">
                Match Your Theme
              </Text>
              <Text as="p" variant="bodySm" tone="subdued">
                Import colors from your Shopify theme
              </Text>
            </div>
          </InlineStack>

          {isLoading ? (
            <Spinner size="small" />
          ) : applied ? (
            <InlineStack gap="200" blockAlign="center">
              <InlineStack gap="100" blockAlign="center">
                <Icon source={CheckIcon} tone="success" />
                <Text as="span" variant="bodySm" tone="success">
                  Applied
                </Text>
              </InlineStack>
              {showSaveButton && (
                <ButtonGroup>
                  <Tooltip content="Save as reusable custom theme">
                    <Button onClick={handleSave} size="slim" icon={SaveIcon} variant="secondary">
                      Save Theme
                    </Button>
                  </Tooltip>
                </ButtonGroup>
              )}
              {saved && (
                <Text as="span" variant="bodySm" tone="success">
                  Saved!
                </Text>
              )}
            </InlineStack>
          ) : (
            <Button onClick={handleFetch} disabled={disabled} size="slim">
              Import Colors
            </Button>
          )}
        </InlineStack>

        {hasError && (
          <div style={{ marginTop: 8 }}>
            <Banner tone="warning" hideIcon>
              <Text as="p" variant="bodySm">
                {fetcher.data?.error || "Failed to fetch theme settings"}
              </Text>
            </Banner>
          </div>
        )}
      </div>
    );
  }

  // Button variant
  return (
    <Tooltip content="Import colors and fonts from your store's theme">
      <Button
        onClick={handleFetch}
        disabled={disabled || isLoading}
        icon={isLoading ? undefined : PaintBrushFlatIcon}
        loading={isLoading}
      >
        {applied ? "Theme Applied ✓" : "Match Your Theme"}
      </Button>
    </Tooltip>
  );
}

