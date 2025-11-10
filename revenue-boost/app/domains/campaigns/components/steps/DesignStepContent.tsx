/**
 * Design Step Content Component
 *
 * Extracted from CampaignFormWithABTesting to follow SOLID principles:
 * - Single Responsibility: Only renders design step content
 * - Separation of Concerns: Isolated from parent form logic
 */

import { Banner, Text } from "@shopify/polaris";
import PopupDesignEditorV2 from "~/domains/popups/components/design/PopupDesignEditorV2";
import { deriveInitialConfig } from "~/lib/campaign-config";
import type { CampaignGoal, TemplateType, CampaignFormData } from "~/shared/hooks/useWizardState";
import type { DiscountConfig } from "~/domains/commerce/services/discounts/discount.server";
import type { PopupDesignConfig, TemplateObject } from "~/domains/popups/types/design-editor.types";
import type { EnhancedTriggersConfig } from "~/domains/campaigns/types/campaign";


interface DesignStepContentProps {
  goal?: CampaignGoal;
  templateId?: string;
  templateType?: TemplateType;
  storeId: string;
  shopDomain?: string;
  campaignId?: string;
  wizardState: CampaignFormData;
  discountConfig: DiscountConfig;
  onConfigChange: (config: PopupDesignConfig) => void;
  onDiscountChange: (config: DiscountConfig) => void;
  onTemplateChange: (
    templateId: string,
    templateType: TemplateType,
    enhancedTriggers?: EnhancedTriggersConfig,
    templateObject?: TemplateObject,
  ) => void;
}

export function DesignStepContent({
  goal,
  templateId,
  templateType,
  storeId,
  shopDomain,
  campaignId,
  wizardState,
  discountConfig,
  onConfigChange,
  onDiscountChange,
  onTemplateChange,
}: DesignStepContentProps) {
  if (!goal) {
    return (
      <Banner tone="critical">
        <Text as="p">Please select a campaign goal in the Basic Settings tab first.</Text>
      </Banner>
    );
  }

  return (
    <PopupDesignEditorV2
      initialConfig={deriveInitialConfig(wizardState)}
      initialTemplateId={templateId}
      campaignGoal={goal}
      templateType={templateType}
      storeId={storeId}
      shopDomain={shopDomain}
      campaignId={campaignId}
      discountConfig={discountConfig}
      onDiscountChange={onDiscountChange}
      onConfigChange={onConfigChange}
      onTemplateChange={onTemplateChange}
    />
  );
}

