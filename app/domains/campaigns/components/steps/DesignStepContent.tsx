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
import { TemplateSelector, type SelectedTemplate } from "../TemplateSelector";
import { LivePreviewPanel } from "~/domains/popups/components/preview/LivePreviewPanel";
import { Affix } from "~/shared/components/ui/Affix";
import type { CampaignGoal, TemplateType } from "~/shared/hooks/useWizardState";
import type { ContentConfig, DesignConfig } from "~/domains/campaigns/types/campaign";
import type { DiscountConfig } from "~/domains/popups/services/discounts/discount.server";


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
                    content={contentConfig}
                    designConfig={designConfig}
                    discountConfig={discountConfig}
                    onChange={onContentChange}
                    onDesignChange={onDesignChange}
                    onDiscountChange={onDiscountChange}
                  />
                </>
              ) : (
                <>
                  {/* Other Templates - Separate Content and Design sections */}
                  <Card>
                    <BlockStack gap="400">
                      <Text as="h2" variant="headingMd">
                        Content Configuration
                      </Text>
                      <Text as="p" tone="subdued">
                        Customize the text, messages, and behavior for your {templateType.toLowerCase().replace(/_/g, ' ')} campaign
                      </Text>
                      <Divider />
                      <ContentConfigSection
                        templateType={templateType}
                        content={contentConfig}
                        discountConfig={discountConfig}
                        onChange={onContentChange}
                        onDiscountChange={onDiscountChange}
                      />
                    </BlockStack>
                  </Card>

                  {/* Design Configuration - Universal design/color fields */}
                  <DesignConfigSection
                    design={designConfig}
                    templateType={templateType}
                    onChange={onDesignChange}
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
                config={contentConfig}
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

