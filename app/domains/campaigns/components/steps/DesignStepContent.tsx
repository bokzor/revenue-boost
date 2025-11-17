/**
 * Design Step Content Component
 *
 * Properly separated design step with:
 * - ContentConfigSection for template-specific content fields
 * - DesignConfigSection for universal design/color fields
 */

import { Banner, Text, BlockStack, Card, Divider, Layout } from "@shopify/polaris";
import { ContentConfigSection } from "../sections/ContentConfigSection";
import { DesignConfigSection } from "../sections/DesignConfigSection";
import { NewsletterContentSection } from "../sections/NewsletterContentSection";
import type { NewsletterContent } from "../sections/NewsletterContentSection";
import { TemplateSelector, type SelectedTemplate } from "../TemplateSelector";
import { LivePreviewPanel } from "~/domains/popups/components/preview/LivePreviewPanel";
import { Affix } from "~/shared/components/ui/Affix";
import type { CampaignGoal, TemplateType } from "~/shared/hooks/useWizardState";
import type { ContentConfig, DesignConfig } from "~/domains/campaigns/types/campaign";
import type { DiscountConfig } from "~/domains/popups/services/discounts/discount.server";
import type { UnifiedTemplate } from "../../hooks/useTemplates";

import type { SpinToWinContent } from "~/domains/campaigns/types/campaign";
import { getSpinToWinSliceColors, getSpinToWinWheelBorder } from "~/config/color-presets";


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
  onContentChange: (content: Partial<ContentConfig>) => void;
  onDesignChange: (design: Partial<DesignConfig>) => void;
  onDiscountChange?: (config: DiscountConfig) => void;
  onTemplateSelect: (template: SelectedTemplate) => void;
  initialTemplates?: UnifiedTemplate[];
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
  onContentChange,
  onDesignChange,
  onDiscountChange,
  onTemplateSelect,
  initialTemplates,
}: DesignStepContentProps) {
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
              />
            </BlockStack>
          </Card>

          {/* Only show configuration if template is selected */}
          {templateType && (
            <>
              {/* Newsletter Template - Self-contained with Content, Discount, and Design */}
              {(templateType === "NEWSLETTER" || templateType === "EXIT_INTENT") ? (
                <>
                  <NewsletterContentSection
                    content={contentConfig as Partial<NewsletterContent>}
                    designConfig={designConfig}
                    discountConfig={discountConfig}
                    onChange={onContentChange as (c: Partial<NewsletterContent>) => void}
                    onDesignChange={onDesignChange}
                    onDiscountChange={onDiscountChange}
                  />
                </>
              ) : (
                <>
                  {/* Other Templates - Content and Design sections without wrapper */}
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
                  />
                </>
              )}
            </>
          )}
        </BlockStack>
      </Layout.Section>

      {/* Right Column - Live Preview */}
      <Layout.Section variant="oneHalf">
        <div
          data-affix-boundary
          style={{ position: "relative", alignSelf: "flex-start" }}
        >
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
                shopDomain={shopDomain}
                campaignId={campaignId}
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

