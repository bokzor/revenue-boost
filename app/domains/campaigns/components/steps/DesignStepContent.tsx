/**
 * Design Step Content Component
 *
 * Properly separated design step with:
 * - ContentConfigSection for template-specific content fields
 * - DesignConfigSection for universal design/color fields (used by ALL templates)
 */

import { useState, useCallback, useMemo } from "react";
import { Banner, Text, BlockStack, Card, Divider, Layout } from "@shopify/polaris";
import { ContentConfigSection } from "../sections/ContentConfigSection";
import { DesignConfigSection } from "../sections/DesignConfigSection";
import { NewsletterContentSection } from "../sections/NewsletterContentSection";
import type { NewsletterContent } from "../sections/NewsletterContentSection";
import { FlashSaleContentSection } from "../sections/FlashSaleContentSection";
import type { FlashSaleContent } from "../sections/FlashSaleContentSection";
import { TemplateSelector, type SelectedTemplate } from "../TemplateSelector";
import { LivePreviewPanel, type PreviewDevice } from "~/domains/popups/components/preview/LivePreviewPanel";
import { Affix } from "~/shared/components/ui/Affix";
import type { CampaignGoal, TemplateType } from "~/shared/hooks/useWizardState";
import type { ContentConfig, DesignConfig, SpinToWinContent, DiscountConfig } from "~/domains/campaigns/types/campaign";
import type { UnifiedTemplate } from "../../hooks/useTemplates";

import { getSpinToWinSliceColors, getSpinToWinWheelBorder } from "~/config/color-presets";
import { CustomCSSEditor } from "../CustomCSSEditor";
import { UpgradeBanner, useFeatureAccess } from "~/domains/billing";
import { getWheelColorsFromPreset, type ThemePresetInput } from "~/domains/store/types/theme-preset";
import type { BackgroundPreset } from "~/config/background-presets";

interface DesignStepContentProps {
  goal?: CampaignGoal;
  templateType?: TemplateType;
  templateId?: string;
  storeId: string;
  shopDomain?: string;
  campaignId?: string;
  contentConfig: Partial<ContentConfig>;
  designConfig: Partial<DesignConfig>;
  discountConfig?: DiscountConfig;
  targetRules?: Record<string, unknown>;
  globalCustomCSS?: string;
  /** Custom theme presets from store settings */
  customThemePresets?: Array<{
    id: string;
    name: string;
    brandColor: string;
    backgroundColor: string;
    textColor: string;
    surfaceColor?: string;
    successColor?: string;
    fontFamily?: string;
  }>;
  /**
   * Map of layout -> proven background presets.
   * Loaded once from recipe service, filtered by current layout in components.
   */
  backgroundsByLayout?: Record<string, BackgroundPreset[]>;
  /** Default theme tokens for preview (from store's default preset or Shopify theme) */
  defaultThemeTokens?: import("~/domains/campaigns/types/design-tokens").DesignTokens;
  onContentChange: (content: Partial<ContentConfig>) => void;
  onDesignChange: (design: Partial<DesignConfig>) => void;
  onDiscountChange?: (config: DiscountConfig) => void;
  onTemplateSelect: (template: SelectedTemplate) => void;
  initialTemplates?: UnifiedTemplate[];
  preselectedTemplateType?: string; // For auto-selecting template from URL param
  skipAutoSelect?: boolean; // Skip auto-selection when content is prefilled from recipe
}

export function DesignStepContent({
  goal,
  templateType,
  templateId,
  storeId,
  shopDomain,
  campaignId,
  contentConfig,
  designConfig,
  discountConfig,
  targetRules,
  globalCustomCSS,
  customThemePresets,
  backgroundsByLayout,
  defaultThemeTokens,
  onContentChange,
  onDesignChange,
  onDiscountChange,
  onTemplateSelect,
  initialTemplates,
  preselectedTemplateType,
  skipAutoSelect = false,
}: DesignStepContentProps) {
  // Preview device state - controlled by both device toggle and mobile layout changes
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>("tablet");

  // Switch to mobile preview when mobile layout is changed
  const handleMobileLayoutChange = useCallback(() => {
    setPreviewDevice("mobile");
  }, []);

  // Compute available backgrounds for current layout from the map
  const availableBackgrounds = useMemo(() => {
    if (!backgroundsByLayout) return [];
    const currentLayout = designConfig.leadCaptureLayout?.desktop;
    if (!currentLayout) return [];
    return backgroundsByLayout[currentLayout] || [];
  }, [backgroundsByLayout, designConfig.leadCaptureLayout?.desktop]);

  if (!goal) {
    return (
      <Banner tone="warning">
        <Text as="p">Please select a campaign goal in the Basic Settings tab first.</Text>
      </Banner>
    );
  }

  return (
    <Layout>
      {/* Left Column - Template Selector & Configuration Forms */}
      <Layout.Section variant="oneHalf">
        <BlockStack gap="600">
          {/* Template Selector - Always visible */}
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Select Template
              </Text>
              <Text as="p" tone="subdued">
                Choose a template optimized for your goal. Preview updates in real-time.
              </Text>
              <Divider />
              <TemplateSelector
                goal={goal}
                storeId={storeId}
                selectedTemplateId={templateId}
                onSelect={onTemplateSelect}
                initialTemplates={initialTemplates}
                preselectedTemplateType={preselectedTemplateType}
                skipAutoSelect={skipAutoSelect}
              />
            </BlockStack>
          </Card>

          {/* Only show configuration if template is selected */}
          {templateType && (
            <>
              {/* Newsletter/Exit Intent - Content section + shared Design section */}
              {templateType === "NEWSLETTER" || templateType === "EXIT_INTENT" ? (
                <>
                  <NewsletterContentSection
                    content={contentConfig as Partial<NewsletterContent>}
                    discountConfig={discountConfig}
                    onChange={onContentChange as (c: Partial<NewsletterContent>) => void}
                    onDiscountChange={onDiscountChange}
                  />
                  <DesignConfigSection
                    design={designConfig}
                    templateType={templateType}
                    onChange={onDesignChange}
                    customThemePresets={customThemePresets}
                    availableBackgrounds={availableBackgrounds}
                    onMobileLayoutChange={handleMobileLayoutChange}
                  />
                </>
              ) : templateType === "FLASH_SALE" ? (
                <>
                  <FlashSaleContentSection
                    content={contentConfig as Partial<FlashSaleContent>}
                    discountConfig={discountConfig}
                    errors={{}}
                    onChange={onContentChange as (c: Partial<FlashSaleContent>) => void}
                    onDiscountChange={onDiscountChange}
                    templateType="FLASH_SALE"
                  />
                  <DesignConfigSection
                    design={designConfig}
                    templateType={templateType}
                    onChange={onDesignChange}
                    customThemePresets={customThemePresets}
                    availableBackgrounds={availableBackgrounds}
                    onMobileLayoutChange={handleMobileLayoutChange}
                  />
                </>
              ) : templateType === "COUNTDOWN_TIMER" ? (
                <>
                  <FlashSaleContentSection
                    content={contentConfig as Partial<FlashSaleContent>}
                    errors={{}}
                    onChange={onContentChange as (c: Partial<FlashSaleContent>) => void}
                    templateType="COUNTDOWN_TIMER"
                    // Note: CountdownTimer doesn't support discount issuance
                  />
                  <DesignConfigSection
                    design={designConfig}
                    templateType={templateType}
                    onChange={onDesignChange}
                    customThemePresets={customThemePresets}
                    availableBackgrounds={availableBackgrounds}
                    onMobileLayoutChange={handleMobileLayoutChange}
                  />
                </>
              ) : (
                <>
                  {/* Other Templates - Content section + separate Design section */}
                  <ContentConfigSection
                    templateType={templateType}
                    content={contentConfig}
                    discountConfig={discountConfig}
                    onChange={onContentChange}
                    onDiscountChange={onDiscountChange}
                    designConfig={designConfig}
                    onDesignChange={onDesignChange}
                  />

                  {/* Design Configuration - Universal design/color fields */}
                  <DesignConfigSection
                    design={designConfig}
                    templateType={templateType}
                    onChange={onDesignChange}
                    customThemePresets={customThemePresets}
                    availableBackgrounds={availableBackgrounds}
                    onMobileLayoutChange={handleMobileLayoutChange}
                    onThemeChange={(themeKey) => {
                      if (templateType === "SPIN_TO_WIN") {
                        const spinContent = contentConfig as Partial<SpinToWinContent>;
                        const segments = spinContent.wheelSegments;
                        if (!segments || segments.length === 0) {
                          return;
                        }

                        const colors = getSpinToWinSliceColors(themeKey, segments.length);
                        const border = getSpinToWinWheelBorder(themeKey);

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
                      }
                    }}
                    onCustomPresetApply={(presetId, brandColor) => {
                      // Apply custom preset colors to Spin-to-Win wheel segments
                      if (templateType === "SPIN_TO_WIN") {
                        const spinContent = contentConfig as Partial<SpinToWinContent>;
                        const segments = spinContent.wheelSegments;
                        if (!segments || segments.length === 0) {
                          return;
                        }

                        // Find the preset and generate colors from it
                        const preset = customThemePresets?.find(p => p.id === presetId);
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
                      }
                    }}
                  />
                </>
              )}

              {/* Custom CSS Editor - shown for all templates */}
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
            </>
          )}
        </BlockStack>
      </Layout.Section>

      {/* Right Column - Live Preview */}
      <Layout.Section variant="oneHalf">
        <div data-affix-boundary style={{ position: "relative", alignSelf: "flex-start" }}>
          <Affix disableBelowWidth={768}>
            {templateType ? (
              <LivePreviewPanel
                templateType={templateType}
                // Pass both content and discount configuration into preview so
                // components like FlashSalePopup can derive their display from
                // the actual admin discount settings.
                config={{
                  ...contentConfig,
                  discountConfig,
                }}
                designConfig={designConfig}
                targetRules={targetRules}
                shopDomain={shopDomain}
                campaignId={campaignId}
                globalCustomCSS={globalCustomCSS}
                defaultThemeTokens={defaultThemeTokens}
                // Controlled device mode - switches to mobile when mobile layout is changed
                device={previewDevice}
                onDeviceChange={setPreviewDevice}
              />
            ) : (
              <Card>
                <BlockStack gap="400">
                  <Text as="h3" variant="headingMd">
                    Live Preview
                  </Text>
                  <Text as="p" tone="subdued">
                    Select a template from the left to see a live preview here.
                  </Text>
                </BlockStack>
              </Card>
            )}
          </Affix>
        </div>
      </Layout.Section>
    </Layout>
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
          <Text as="h3" variant="headingSm">Custom CSS</Text>
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
