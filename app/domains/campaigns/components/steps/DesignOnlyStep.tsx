/**
 * DesignOnlyStep Component
 *
 * Renders only the design/colors configuration.
 * This is the second part of the split from DesignContentStep.
 *
 * Handles:
 * - Universal design configuration (colors, themes, backgrounds)
 * - Custom CSS editor with billing gating
 * - Spin-to-Win theme sync for wheel colors
 *
 * Does NOT handle:
 * - Template-specific content (see ContentOnlyStep)
 */

import { useCallback, useMemo } from "react";
import { BlockStack, Card, Text } from "@shopify/polaris";
import { DesignConfigSection } from "../sections/DesignConfigSection";
import { CustomCSSEditor } from "../CustomCSSEditor";
import { UpgradeBanner, useFeatureAccess } from "~/domains/billing";
import type { TemplateType } from "~/shared/hooks/useWizardState";
import type { ContentConfig, DesignConfig, SpinToWinContent } from "~/domains/campaigns/types/campaign";
import type { BackgroundPreset } from "~/config/background-presets";
import { getSpinToWinSliceColors, getSpinToWinWheelBorder, type NewsletterThemeKey } from "~/config/color-presets";
import { getWheelColorsFromPreset, type ThemePresetInput } from "~/domains/store/types/theme-preset";

export interface ThemePreset {
  id: string;
  name: string;
  brandColor: string;
  backgroundColor: string;
  textColor: string;
  surfaceColor?: string;
  successColor?: string;
  fontFamily?: string;
}

export interface DesignOnlyStepProps {
  templateType: TemplateType;
  contentConfig: Partial<ContentConfig>;
  designConfig: Partial<DesignConfig>;
  onContentChange: (content: Partial<ContentConfig>) => void;
  onDesignChange: (design: Partial<DesignConfig>) => void;
  /** Custom theme presets from store settings */
  customThemePresets?: ThemePreset[];
  /** Map of layout -> background presets */
  backgroundsByLayout?: Record<string, BackgroundPreset[]>;
  /** Global custom CSS from store settings */
  globalCustomCSS?: string;
  /** Callback when mobile layout is changed (to switch preview device) */
  onMobileLayoutChange?: () => void;
}

export function DesignOnlyStep({
  templateType,
  contentConfig,
  designConfig,
  onContentChange,
  onDesignChange,
  customThemePresets,
  backgroundsByLayout,
  globalCustomCSS,
  onMobileLayoutChange,
}: DesignOnlyStepProps) {
  // Compute available backgrounds for current layout
  const availableBackgrounds = useMemo(() => {
    if (!backgroundsByLayout) return [];
    const currentLayout = designConfig.leadCaptureLayout?.desktop;
    if (!currentLayout) return [];
    return backgroundsByLayout[currentLayout] || [];
  }, [backgroundsByLayout, designConfig.leadCaptureLayout?.desktop]);

  // Handle theme change - sync Spin-to-Win wheel colors
  const handleThemeChange = useCallback(
    (themeKey: string) => {
      if (templateType !== "SPIN_TO_WIN") return;

      const spinContent = contentConfig as Partial<SpinToWinContent>;
      const segments = spinContent.wheelSegments;
      if (!segments || segments.length === 0) return;

      const colors = getSpinToWinSliceColors(themeKey as NewsletterThemeKey, segments.length);
      const border = getSpinToWinWheelBorder(themeKey as NewsletterThemeKey);

      const updatedSegments = segments.map((segment, index) => ({
        ...segment,
        color: colors[index % colors.length],
      }));

      onContentChange({
        ...contentConfig,
        wheelSegments: updatedSegments,
        wheelBorderColor: border.color,
        wheelBorderWidth: border.width,
      });
    },
    [templateType, contentConfig, onContentChange]
  );

  // Handle custom preset apply - sync Spin-to-Win wheel colors
  const handleCustomPresetApply = useCallback(
    (presetId: string, brandColor: string) => {
      if (templateType !== "SPIN_TO_WIN") return;

      const spinContent = contentConfig as Partial<SpinToWinContent>;
      const segments = spinContent.wheelSegments;
      if (!segments || segments.length === 0) return;

      const preset = customThemePresets?.find((p) => p.id === presetId);
      if (!preset) return;

      const colors = getWheelColorsFromPreset(preset as ThemePresetInput, segments.length);

      const updatedSegments = segments.map((segment, index) => ({
        ...segment,
        color: colors[index % colors.length],
      }));

      onContentChange({
        ...contentConfig,
        wheelSegments: updatedSegments,
        wheelBorderColor: brandColor,
        wheelBorderWidth: 4,
      });
    },
    [templateType, contentConfig, customThemePresets, onContentChange]
  );

  return (
    <BlockStack gap="400">
      {/* Universal Design Configuration */}
      <DesignConfigSection
        design={designConfig}
        templateType={templateType}
        onChange={onDesignChange}
        customThemePresets={customThemePresets}
        availableBackgrounds={availableBackgrounds}
        onMobileLayoutChange={onMobileLayoutChange}
        onThemeChange={handleThemeChange}
        onCustomPresetApply={handleCustomPresetApply}
      />

      {/* Custom CSS Editor */}
      <CustomCSSEditorWithBilling
        value={designConfig.customCSS || ""}
        globalCustomCSS={globalCustomCSS}
        templateType={templateType}
        onChange={(css) =>
          onDesignChange({
            ...designConfig,
            customCSS: css,
          })
        }
      />
    </BlockStack>
  );
}

/**
 * Wrapper component that shows upgrade banner for Custom CSS feature
 * when user is on FREE or STARTER plan
 */
function CustomCSSEditorWithBilling({
  value,
  globalCustomCSS,
  templateType,
  onChange,
}: {
  value: string;
  globalCustomCSS?: string;
  templateType?: TemplateType;
  onChange: (css: string) => void;
}) {
  const { hasAccess } = useFeatureAccess("customCss");

  if (!hasAccess) {
    return (
      <Card>
        <BlockStack gap="300">
          <Text as="h3" variant="headingSm">
            Custom CSS
          </Text>
          <UpgradeBanner feature="customCss" />
        </BlockStack>
      </Card>
    );
  }

  return (
    <CustomCSSEditor
      value={value}
      globalCustomCSS={globalCustomCSS}
      templateType={templateType}
      onChange={onChange}
    />
  );
}

