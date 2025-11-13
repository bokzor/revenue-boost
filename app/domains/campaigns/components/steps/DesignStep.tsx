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
import type { PopupDesignFormData } from "~/shared/hooks/useWizardState";
import type { DesignConfig, ContentConfig } from "~/domains/campaigns/types/campaign";
import { useConfigField, useFormField, useStoreInfo } from "../../context/CampaignFormContext";

// Props interface kept for backward compatibility
interface DesignStepProps {
  data?: unknown;
  onChange?: (data: unknown) => void;
  shopDomain?: string;
}
function toDesignConfig(p?: PopupDesignFormData): Partial<DesignConfig> {
  if (!p) return {};
  const isPos = (v: string): v is DesignConfig["position"] => ["center","top","bottom","left","right"].includes(v);
  const isSize = (v: string): v is DesignConfig["size"] => ["small","medium","large"].includes(v);
  return {
    backgroundColor: p.backgroundColor || undefined,
    textColor: p.textColor || undefined,
    buttonColor: p.buttonColor || undefined,
    buttonTextColor: p.buttonTextColor || undefined,
    position: isPos(p.position) ? p.position : undefined,
    size: isSize(p.size) ? p.size : undefined,
    overlayOpacity: p.overlayOpacity,
  };
}

function mergePopupDesignChange(prev: PopupDesignFormData | undefined, change: Partial<DesignConfig>): PopupDesignFormData {
  const base: PopupDesignFormData = prev || {
    id: "",
    title: "",
    description: "",
    buttonText: "",
    backgroundColor: "",
    textColor: "",
    buttonColor: "",
    buttonTextColor: "",
    position: "center",
    size: "medium",
    showCloseButton: true,
    overlayOpacity: 0.5,
  };
  return {
    ...base,
    backgroundColor: change.backgroundColor ?? base.backgroundColor,
    textColor: change.textColor ?? base.textColor,
    buttonColor: change.buttonColor ?? base.buttonColor,
    buttonTextColor: change.buttonTextColor ?? base.buttonTextColor,
    position: (change.position as string) ?? base.position,
    size: (change.size as string) ?? base.size,
    overlayOpacity: change.overlayOpacity ?? base.overlayOpacity,
  };
}


export function DesignStep(_props?: DesignStepProps) {
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
                Customize the text, messages, and behavior for your {templateType?.toLowerCase().replace(/_/g, ' ')} popup.
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
                Customize the appearance, layout, and colors of your popup. All color fields are optional - leave empty to use theme defaults.
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

