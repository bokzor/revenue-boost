/**
 * DesignStep - Template selection and design customization
 *
 * REFACTORED: Now uses Context API for cleaner prop management
 * - Uses useConfigField for contentConfig and designConfig
 * - Uses useStoreInfo for shopDomain
 * - No more prop drilling
 */

import { Card, BlockStack, Text, Divider, Layout } from "@shopify/polaris";
import { ContentConfigSection } from "../sections/ContentConfigSection";
import { DesignConfigSection } from "../sections/DesignConfigSection";
import { LivePreviewPanel } from "~/domains/popups/components/preview/LivePreviewPanel";
import type { DesignConfig, ContentConfig } from "~/domains/campaigns/types/campaign";
import { useConfigField, useFormField, useStoreInfo } from "../../context/CampaignFormContext";

export function DesignStep() {
  // Use context hooks
  const { shopDomain } = useStoreInfo();
  const [goal] = useFormField("goal");
  const [templateType] = useFormField("templateType");
  const [contentConfig, updateContentConfig] = useConfigField<ContentConfig>("contentConfig");
  const [designConfig, updateDesignConfig] = useConfigField<DesignConfig>("designConfig");

  if (!goal || !templateType) {
    return (
      <Card>
        <BlockStack gap="400">
          <Text as="p" tone="subdued">
            Please select a goal and template first to continue with design customization.
          </Text>
        </BlockStack>
      </Card>
    );
  }

  return (
    <Layout>
      {/* Left Column - Configuration Forms */}
      <Layout.Section variant="oneHalf">
        <BlockStack gap="600">
          {/* Content Configuration */}
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Content Configuration
              </Text>
              <Text as="p" tone="subdued">
                Customize the text, messages, and behavior for your{" "}
                {templateType?.toLowerCase().replace(/_/g, " ")} popup.
              </Text>
              <Divider />
              <ContentConfigSection
                templateType={templateType}
                content={contentConfig}
                onChange={updateContentConfig}
              />
            </BlockStack>
          </Card>

          {/* Design & Colors Configuration */}
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Design & Colors
              </Text>
              <Text as="p" tone="subdued">
                Customize the appearance, layout, and colors of your popup. All color fields are
                optional - leave empty to use theme defaults.
              </Text>
              <Divider />
              <DesignConfigSection
                design={designConfig || {}}
                templateType={templateType}
                onChange={(design) => {
                  updateDesignConfig({ ...designConfig, ...design });
                }}
              />
            </BlockStack>
          </Card>
        </BlockStack>
      </Layout.Section>

      {/* Right Column - Live Preview */}
      <Layout.Section variant="oneHalf">
        <div style={{ position: "sticky", top: "20px" }}>
          <LivePreviewPanel
            templateType={templateType}
            config={contentConfig}
            designConfig={designConfig || {}}
            shopDomain={shopDomain}
          />
        </div>
      </Layout.Section>
    </Layout>
  );
}
